import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COLORS = [
  'bg-blue-400/20 text-blue-400',
  'bg-green-400/20 text-green-400',
  'bg-purple-400/20 text-purple-400',
  'bg-yellow-400/20 text-yellow-400',
  'bg-red-400/20 text-red-400',
  'bg-cyan-400/20 text-cyan-400',
  'bg-orange-400/20 text-orange-400',
  'bg-pink-400/20 text-pink-400',
]

const STATUS_CONFIG = {
  rush: { label: 'Rushing', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  bid: { label: 'Bid Given', color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  accepted: { label: 'Accepted', color: 'bg-green-400/10 text-green-400 border-green-400/20' },
  dropped: { label: 'Dropped', color: 'bg-red-400/10 text-red-400 border-red-400/20' },
  deferred: { label: 'Deferred', color: 'bg-gray-400/10 text-gray-400 border-gray-400/20' },
}

const VOTE_CONFIG = {
  yes: { label: 'Yes', emoji: '✅', color: 'bg-green-400/10 text-green-400 border-green-400/20' },
  no: { label: 'No', emoji: '❌', color: 'bg-red-400/10 text-red-400 border-red-400/20' },
  maybe: { label: 'Maybe', emoji: '🤔', color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
}

export default function PNM() {
  const { user } = useAuth()
  const [pnms, setPnms] = useState([])
  const [votes, setVotes] = useState([])
  const [members, setMembers] = useState([])
  const [myMember, setMyMember] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('board')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPnm, setSelectedPnm] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [newPnm, setNewPnm] = useState({
    name: '', year: 'Freshman', major: '', gpa: '',
    phone: '', email: '', instagram: '', events_attended: 0, total_events: 5, notes: ''
  })

  useEffect(() => {
    fetchAll()
    const sub = supabase.channel('pnm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnms' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnm_votes' }, fetchVotes)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchPnms(), fetchVotes(), fetchMembers()])
    setLoading(false)
  }

  async function fetchPnms() {
    const { data } = await supabase.from('pnms').select('*').order('created_at', { ascending: false })
    setPnms(data || [])
  }

  async function fetchVotes() {
    const { data } = await supabase.from('pnm_votes').select('*')
    setVotes(data || [])
  }

  async function fetchMembers() {
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
    const me = (data || []).find(m => m.user_id === user?.id)
    setMyMember(me)
    setIsAdmin(me?.is_admin || false)
  }

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  async function addPnm() {
    if (!newPnm.name.trim()) return
    const initials = newPnm.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const color = COLORS[pnms.length % COLORS.length]
    await supabase.from('pnms').insert({
      ...newPnm,
      initials,
      color,
      gpa: newPnm.gpa ? Number(newPnm.gpa) : null,
      events_attended: Number(newPnm.events_attended),
      total_events: Number(newPnm.total_events),
      status: 'rush',
    })
    setNewPnm({ name: '', year: 'Freshman', major: '', gpa: '', phone: '', email: '', instagram: '', events_attended: 0, total_events: 5, notes: '' })
    setShowAddModal(false)
    toast('PNM added!')
  }

  async function updateStatus(id, status) {
    await supabase.from('pnms').update({ status }).eq('id', id)
    setPnms(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    if (selectedPnm?.id === id) setSelectedPnm(prev => ({ ...prev, status }))
  }

  async function updateAttendance(id, events_attended) {
    await supabase.from('pnms').update({ events_attended }).eq('id', id)
    setPnms(prev => prev.map(p => p.id === id ? { ...p, events_attended } : p))
    if (selectedPnm?.id === id) setSelectedPnm(prev => ({ ...prev, events_attended }))
  }

  async function deletePnm(id) {
    if (!confirm('Remove this PNM?')) return
    await supabase.from('pnms').delete().eq('id', id)
    setShowDetailModal(false)
    setSelectedPnm(null)
    toast('PNM removed.')
  }

  async function castVote(pnmId, vote) {
    if (!myMember) return
    await supabase.from('pnm_votes').upsert({
      pnm_id: pnmId,
      member_id: myMember.id,
      vote,
    }, { onConflict: 'pnm_id,member_id' })
    await fetchVotes()
    toast(`Vote recorded: ${VOTE_CONFIG[vote].label}`)
  }

  async function updateNotes(id, notes) {
    await supabase.from('pnms').update({ notes }).eq('id', id)
    setPnms(prev => prev.map(p => p.id === id ? { ...p, notes } : p))
  }

  function getVotesForPnm(pnmId) {
    const pnmVotes = votes.filter(v => v.pnm_id === pnmId)
    const yes = pnmVotes.filter(v => v.vote === 'yes').length
    const no = pnmVotes.filter(v => v.vote === 'no').length
    const maybe = pnmVotes.filter(v => v.vote === 'maybe').length
    return { yes, no, maybe, total: pnmVotes.length }
  }

  function getMyVote(pnmId) {
    if (!myMember) return null
    return votes.find(v => v.pnm_id === pnmId && v.member_id === myMember.id)?.vote || null
  }

  function openDetail(pnm) {
    setSelectedPnm(pnm)
    setShowDetailModal(true)
  }

  const filtered = pnms.filter(p => statusFilter === 'all' ? true : p.status === statusFilter)

  const stats = {
    total: pnms.length,
    rushing: pnms.filter(p => p.status === 'rush').length,
    bids: pnms.filter(p => p.status === 'bid' || p.status === 'accepted').length,
    accepted: pnms.filter(p => p.status === 'accepted').length,
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading rush data...</div>

  return (
    <div className="p-6">

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">PNMs & Rush</h1>
          <p className="text-gray-400 text-sm">Spring 2025 rush week · {stats.total} candidates</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-yellow-400 text-gray-900 font-bold text-sm rounded-xl hover:bg-yellow-300 transition-all">
            + Add PNM
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total PNMs', value: stats.total, color: 'text-white' },
          { label: 'Still Rushing', value: stats.rushing, color: 'text-blue-400' },
          { label: 'Bids Given', value: stats.bids, color: 'text-yellow-400' },
          { label: 'Accepted', value: stats.accepted, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {['board', 'list', 'votes'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-all
              ${tab === t ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t === 'board' ? '📋 Board' : t === 'list' ? '📊 List' : '🗳️ Votes'}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['all', 'All'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border
              ${statusFilter === key
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
            {label} {key !== 'all' && `(${pnms.filter(p => p.status === key).length})`}
          </button>
        ))}
      </div>

      {/* Board view */}
      {tab === 'board' && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <div className="text-4xl mb-3">👋</div>
              <div className="text-gray-400 text-sm mb-4">No PNMs yet. Add your first rush candidate!</div>
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)}
                  className="bg-yellow-400 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-300 transition-all">
                  + Add first PNM
                </button>
              )}
            </div>
          ) : filtered.map(pnm => {
            const voteStats = getVotesForPnm(pnm.id)
            const myVote = getMyVote(pnm.id)
            const attendance = pnm.total_events > 0 ? Math.round((pnm.events_attended / pnm.total_events) * 100) : 0
            const cfg = STATUS_CONFIG[pnm.status] || STATUS_CONFIG.rush

            return (
              <div key={pnm.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all cursor-pointer group"
                onClick={() => openDetail(pnm)}>

                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${pnm.color}`}>
                      {pnm.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{pnm.name}</div>
                      <div className="text-xs text-gray-500">{pnm.year} · {pnm.major || 'Undecided'}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Info row */}
                <div className="flex gap-3 mb-3 text-xs text-gray-500">
                  {pnm.gpa && <span>📚 {pnm.gpa} GPA</span>}
                  {pnm.phone && <span>📱 {pnm.phone}</span>}
                </div>

                {/* Attendance */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Events attended</span>
                    <span className="text-white font-medium">{pnm.events_attended}/{pnm.total_events}</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-500 ${attendance >= 80 ? 'bg-green-400' : attendance >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${attendance}%` }} />
                  </div>
                </div>

                {/* Votes */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <span className="text-xs text-green-400">✅ {voteStats.yes}</span>
                    <span className="text-xs text-red-400">❌ {voteStats.no}</span>
                    <span className="text-xs text-yellow-400">🤔 {voteStats.maybe}</span>
                  </div>
                  {myVote && (
                    <span className="text-xs text-gray-500">
                      You: {VOTE_CONFIG[myVote]?.emoji}
                    </span>
                  )}
                </div>

                {/* Quick vote */}
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  {Object.entries(VOTE_CONFIG).map(([key, cfg]) => (
                    <button key={key}
                      onClick={() => castVote(pnm.id, key)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${myVote === key
                          ? cfg.color + ' border-opacity-100'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {tab === 'list' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Year / Major</div>
            <div className="col-span-1 text-center">GPA</div>
            <div className="col-span-2 text-center">Attendance</div>
            <div className="col-span-2 text-center">Votes</div>
            <div className="col-span-2 text-center">Status</div>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-500">No PNMs found</div>
          ) : filtered.map(pnm => {
            const voteStats = getVotesForPnm(pnm.id)
            const attendance = pnm.total_events > 0 ? Math.round((pnm.events_attended / pnm.total_events) * 100) : 0
            const cfg = STATUS_CONFIG[pnm.status] || STATUS_CONFIG.rush

            return (
              <div key={pnm.id}
                className="grid grid-cols-12 px-4 py-3.5 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30 cursor-pointer transition-all"
                onClick={() => openDetail(pnm)}>
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${pnm.color}`}>
                    {pnm.initials}
                  </div>
                  <div className="text-sm text-white font-medium">{pnm.name}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-300">{pnm.year}</div>
                  <div className="text-xs text-gray-500 truncate">{pnm.major || '—'}</div>
                </div>
                <div className="col-span-1 text-center text-sm text-white font-medium">
                  {pnm.gpa || '—'}
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-xs text-white mb-1">{pnm.events_attended}/{pnm.total_events}</div>
                  <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden mx-2">
                    <div className={`h-1.5 rounded-full ${attendance >= 80 ? 'bg-green-400' : attendance >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${attendance}%` }} />
                  </div>
                </div>
                <div className="col-span-2 text-center text-xs">
                  <span className="text-green-400 mr-1">✅{voteStats.yes}</span>
                  <span className="text-red-400 mr-1">❌{voteStats.no}</span>
                  <span className="text-yellow-400">🤔{voteStats.maybe}</span>
                </div>
                <div className="col-span-2 text-center">
                  {isAdmin ? (
                    <select
                      value={pnm.status}
                      onChange={e => { e.stopPropagation(); updateStatus(pnm.id, e.target.value) }}
                      onClick={e => e.stopPropagation()}
                      className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-gray-700 outline-none">
                      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Votes view */}
      {tab === 'votes' && (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(pnm => {
            const voteStats = getVotesForPnm(pnm.id)
            const myVote = getMyVote(pnm.id)
            const total = voteStats.yes + voteStats.no + voteStats.maybe
            const pnmVotes = votes.filter(v => v.pnm_id === pnm.id)

            return (
              <div key={pnm.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${pnm.color}`}>
                    {pnm.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{pnm.name}</div>
                    <div className="text-xs text-gray-500">{total} votes cast</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-green-400">{total > 0 ? Math.round((voteStats.yes / total) * 100) : 0}%</div>
                    <div className="text-xs text-gray-500">yes rate</div>
                  </div>
                </div>

                {/* Vote bars */}
                <div className="space-y-2 mb-4">
                  {[
                    { key: 'yes', label: 'Yes', count: voteStats.yes, color: 'bg-green-400' },
                    { key: 'no', label: 'No', count: voteStats.no, color: 'bg-red-400' },
                    { key: 'maybe', label: 'Maybe', count: voteStats.maybe, color: 'bg-yellow-400' },
                  ].map(v => (
                    <div key={v.key} className="flex items-center gap-2">
                      <div className="text-xs text-gray-400 w-10">{v.label}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full ${v.color} transition-all duration-500`}
                          style={{ width: total > 0 ? `${(v.count / total) * 100}%` : '0%' }} />
                      </div>
                      <div className="text-xs text-white w-4 text-right">{v.count}</div>
                    </div>
                  ))}
                </div>

                {/* Who voted what */}
                {isAdmin && pnmVotes.length > 0 && (
                  <div className="mb-4 bg-gray-800 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-2">Member votes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {pnmVotes.map(v => {
                        const member = members.find(m => m.id === v.member_id)
                        return (
                          <div key={v.id} className="flex items-center gap-1 bg-gray-700 rounded-full px-2 py-0.5">
                            <span className="text-xs text-gray-300">{member?.name?.split(' ')[0] || 'Member'}</span>
                            <span className="text-xs">{VOTE_CONFIG[v.vote]?.emoji}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* My vote */}
                <div className="flex gap-1.5">
                  {Object.entries(VOTE_CONFIG).map(([key, cfg]) => (
                    <button key={key}
                      onClick={() => castVote(pnm.id, key)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all
                        ${myVote === key
                          ? cfg.color
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-500 text-sm">No PNMs to vote on yet.</div>
          )}
        </div>
      )}

      {/* Add PNM Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="text-base font-bold text-white">Add New PNM</div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Full name *</label>
                  <input autoFocus
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                    placeholder="John Smith"
                    value={newPnm.name}
                    onChange={e => setNewPnm({ ...newPnm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Year</label>
                  <select className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    value={newPnm.year} onChange={e => setNewPnm({ ...newPnm, year: e.target.value })}>
                    {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">GPA</label>
                  <input type="number" min="0" max="4" step="0.01"
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="3.50"
                    value={newPnm.gpa}
                    onChange={e => setNewPnm({ ...newPnm, gpa: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Major</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="Computer Science"
                    value={newPnm.major}
                    onChange={e => setNewPnm({ ...newPnm, major: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Phone</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="(412) 555-0123"
                    value={newPnm.phone}
                    onChange={e => setNewPnm({ ...newPnm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Instagram</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="@username"
                    value={newPnm.instagram}
                    onChange={e => setNewPnm({ ...newPnm, instagram: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Events attended</label>
                  <input type="number" min="0"
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    value={newPnm.events_attended}
                    onChange={e => setNewPnm({ ...newPnm, events_attended: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Total rush events</label>
                  <input type="number" min="1"
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    value={newPnm.total_events}
                    onChange={e => setNewPnm({ ...newPnm, total_events: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Notes</label>
                  <textarea rows={3}
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none resize-none"
                    placeholder="First impressions, mutual connections, anything relevant..."
                    value={newPnm.notes}
                    onChange={e => setNewPnm({ ...newPnm, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={addPnm}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Add PNM →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPnm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold ${selectedPnm.color}`}>
                {selectedPnm.initials}
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-white">{selectedPnm.name}</div>
                <div className="text-xs text-gray-500">{selectedPnm.year} · {selectedPnm.major || 'Undecided'}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {selectedPnm.phone && (
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                    <div className="text-sm text-white">{selectedPnm.phone}</div>
                  </div>
                )}
                {selectedPnm.instagram && (
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Instagram</div>
                    <div className="text-sm text-white">{selectedPnm.instagram}</div>
                  </div>
                )}
                {selectedPnm.gpa && (
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">GPA</div>
                    <div className="text-sm text-white font-bold">{selectedPnm.gpa}</div>
                  </div>
                )}
                <div className="bg-gray-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Attendance</div>
                  <div className="text-sm text-white font-bold">{selectedPnm.events_attended}/{selectedPnm.total_events} events</div>
                </div>
              </div>

              {/* Status */}
              {isAdmin && (
                <div className="mb-5">
                  <div className="text-xs text-gray-400 mb-2 font-medium">Status</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button key={key}
                        onClick={() => updateStatus(selectedPnm.id, key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                          ${selectedPnm.status === key ? cfg.color : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance editor */}
              {isAdmin && (
                <div className="mb-5">
                  <div className="text-xs text-gray-400 mb-2 font-medium">Update attendance</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateAttendance(selectedPnm.id, Math.max(0, selectedPnm.events_attended - 1))}
                      className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg hover:bg-gray-700 flex items-center justify-center">−</button>
                    <span className="text-white font-bold text-lg">{selectedPnm.events_attended}</span>
                    <button onClick={() => updateAttendance(selectedPnm.id, Math.min(selectedPnm.total_events, selectedPnm.events_attended + 1))}
                      className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg hover:bg-gray-700 flex items-center justify-center">+</button>
                    <span className="text-gray-500 text-sm">of {selectedPnm.total_events} events</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-5">
                <div className="text-xs text-gray-400 mb-2 font-medium">Notes</div>
                <textarea rows={3}
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none resize-none"
                  placeholder="Add notes about this PNM..."
                  value={selectedPnm.notes || ''}
                  onChange={e => {
                    setSelectedPnm(prev => ({ ...prev, notes: e.target.value }))
                    updateNotes(selectedPnm.id, e.target.value)
                  }}
                />
              </div>

              {/* Vote */}
              <div>
                <div className="text-xs text-gray-400 mb-2 font-medium">Your vote</div>
                <div className="flex gap-2">
                  {Object.entries(VOTE_CONFIG).map(([key, cfg]) => {
                    const myVote = getMyVote(selectedPnm.id)
                    return (
                      <button key={key}
                        onClick={() => castVote(selectedPnm.id, key)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                          ${myVote === key ? cfg.color : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
                        {cfg.emoji} {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              {isAdmin && (
                <button onClick={() => deletePnm(selectedPnm.id)}
                  className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm hover:bg-red-400/20 transition-all">
                  Remove
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
