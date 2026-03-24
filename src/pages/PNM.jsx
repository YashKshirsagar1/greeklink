import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const rushEvents = [
  { id: 1, name: 'Info Night', date: 'Mar 15', attendees: 24, capacity: 30, status: 'complete' },
  { id: 2, name: 'Invite Night', date: 'Mar 19', attendees: 18, capacity: 25, status: 'upcoming' },
  { id: 3, name: 'Final Round', date: 'Mar 22', attendees: 0, capacity: 15, status: 'upcoming' },
]

export default function PNM() {
  const [pnms, setPNMs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pnms')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [votingOpen, setVotingOpen] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newPNM, setNewPNM] = useState({ name: '', year: 'Freshman', major: '', gpa: '', phone: '' })
  const [addSuccess, setAddSuccess] = useState(false)

  useEffect(() => { fetchPNMs() }, [])

  async function fetchPNMs() {
    setLoading(true)
    const { data } = await supabase.from('pnms').select('*').order('created_at', { ascending: true })
    setPNMs(data || [])
    setLoading(false)
  }

  async function vote(id, v) {
    const pnm = pnms.find(p => p.id === id)
    const newVote = pnm?.vote === v ? null : v
    await supabase.from('pnms').update({ vote: newVote }).eq('id', id)
    setPNMs(pnms.map(p => p.id === id ? { ...p, vote: newVote } : p))
    if (selected?.id === id) setSelected(s => ({ ...s, vote: newVote }))
  }

  async function saveNote(id, notes) {
    await supabase.from('pnms').update({ notes }).eq('id', id)
    setPNMs(pnms.map(p => p.id === id ? { ...p, notes } : p))
  }

  async function handleAddPNM() {
    if (!newPNM.name.trim()) return
    const initials = newPNM.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = ['bg-yellow-400/20 text-yellow-400', 'bg-blue-400/20 text-blue-400', 'bg-green-400/20 text-green-400', 'bg-purple-400/20 text-purple-400']
    const row = {
      name: newPNM.name.trim(),
      initials,
      year: newPNM.year,
      major: newPNM.major || 'Undeclared',
      gpa: parseFloat(newPNM.gpa) || 0,
      events_attended: 0,
      total_events: 3,
      color: colors[pnms.length % colors.length],
      vote: null,
      notes: '',
      phone: newPNM.phone,
    }
    const { data } = await supabase.from('pnms').insert(row).select().single()
    setPNMs(prev => [...prev, data])
    setNewPNM({ name: '', year: 'Freshman', major: '', gpa: '', phone: '' })
    setShowAdd(false)
    setAddSuccess(true)
    setTimeout(() => setAddSuccess(false), 3000)
  }

  const filtered = pnms.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.major?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'yes') return p.vote === 'yes' && matchSearch
    if (filter === 'no') return p.vote === 'no' && matchSearch
    if (filter === 'undecided') return !p.vote && matchSearch
    return matchSearch
  })

  const yesCount = pnms.filter(p => p.vote === 'yes').length
  const noCount = pnms.filter(p => p.vote === 'no').length
  const undecidedCount = pnms.filter(p => !p.vote).length
  const sortedByVotes = [...pnms].sort((a, b) => {
    const score = v => v === 'yes' ? 2 : v === 'maybe' ? 1 : 0
    return score(b.vote) - score(a.vote)
  })

  if (loading) return <div className="p-6 text-center text-gray-500 mt-16">Loading PNMs...</div>

  return (
    <div className="p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">PNMs & Rush</h1>
          <p className="text-gray-400 text-sm">Spring Rush 2025 · {pnms.length} potential new members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVotingOpen(!votingOpen)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${votingOpen ? 'bg-green-400/10 text-green-400 border-green-400/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
            {votingOpen ? '🗳 Voting open' : '🔒 Voting closed'}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all">
            + Add PNM
          </button>
        </div>
      </div>

      {addSuccess && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ PNM added!
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Add new PNM</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Full name</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. John Smith" value={newPNM.name} onChange={e => setNewPNM({ ...newPNM, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Year</label>
                <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700"
                  value={newPNM.year} onChange={e => setNewPNM({ ...newPNM, year: e.target.value })}>
                  <option>Freshman</option><option>Sophomore</option><option>Junior</option><option>Senior</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">GPA</label>
                <input type="number" step="0.1" min="0" max="4"
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="3.5" value={newPNM.gpa} onChange={e => setNewPNM({ ...newPNM, gpa: e.target.value })} />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Major</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. Computer Science" value={newPNM.major} onChange={e => setNewPNM({ ...newPNM, major: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="412-555-0100" value={newPNM.phone} onChange={e => setNewPNM({ ...newPNM, phone: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={handleAddPNM}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">Add PNM →</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total PNMs', value: pnms.length, color: 'text-white' },
          { label: 'Yes votes', value: yesCount, color: 'text-green-400' },
          { label: 'Undecided', value: undecidedCount, color: 'text-yellow-400' },
          { label: 'No votes', value: noCount, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {['pnms', 'votes', 'events'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-all
              ${tab === t ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t === 'pnms' ? 'All PNMs' : t === 'votes' ? 'Vote summary' : 'Rush events'}
          </button>
        ))}
      </div>

      {tab === 'pnms' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-yellow-400/50 placeholder-gray-600"
                placeholder="Search PNMs..." value={search} onChange={e => setSearch(e.target.value)} />
              {['all', 'yes', 'undecided', 'no'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all
                    ${filter === f
                      ? f === 'yes' ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                        : f === 'no' ? 'bg-red-400/10 text-red-400 border border-red-400/30'
                        : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {filtered.map(p => (
                <div key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all
                    ${selected?.id === p.id ? 'border-yellow-400/40' : 'border-gray-800 hover:border-gray-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.color}`}>
                      {p.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-sm font-semibold text-white">{p.name}</div>
                        {p.vote === 'yes' && <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded">✓ Yes</span>}
                        {p.vote === 'no' && <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded">✕ No</span>}
                        {p.vote === 'maybe' && <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">~ Maybe</span>}
                      </div>
                      <div className="text-xs text-gray-500">{p.year} · {p.major} · GPA {p.gpa}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-xs text-gray-500">{p.events_attended}/{p.total_events} events</div>
                      <div className="flex gap-1">
                        {[...Array(p.total_events)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < p.events_attended ? 'bg-yellow-400' : 'bg-gray-700'}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {votingOpen && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                      {['yes', 'maybe', 'no'].map(v => (
                        <button key={v} onClick={e => { e.stopPropagation(); vote(p.id, v) }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${p.vote === v
                              ? v === 'yes' ? 'bg-green-400/20 text-green-400 border-green-400/40'
                                : v === 'no' ? 'bg-red-400/20 text-red-400 border-red-400/40'
                                : 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40'
                              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white'}`}>
                          {v === 'yes' ? '✓ Yes' : v === 'maybe' ? '~ Maybe' : '✕ No'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            {selected ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${selected.color}`}>
                    {selected.initials}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">{selected.name}</div>
                    <div className="text-xs text-gray-500">{selected.year} · {selected.major}</div>
                  </div>
                </div>
                {[
                  { label: 'GPA', value: selected.gpa },
                  { label: 'Events attended', value: `${selected.events_attended} / ${selected.total_events}` },
                  { label: 'Phone', value: selected.phone },
                  { label: 'Your vote', value: selected.vote ? selected.vote.charAt(0).toUpperCase() + selected.vote.slice(1) : 'Not voted' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className="text-xs font-medium text-white">{row.value}</span>
                  </div>
                ))}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">Notes (private)</div>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 outline-none resize-none"
                    rows={3} placeholder="Add private notes..."
                    value={selected.notes || ''}
                    onChange={e => {
                      setSelected({ ...selected, notes: e.target.value })
                      saveNote(selected.id, e.target.value)
                    }} />
                </div>
                {votingOpen && (
                  <div className="flex gap-2 mt-3">
                    {['yes', 'maybe', 'no'].map(v => (
                      <button key={v} onClick={() => vote(selected.id, v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-all
                          ${selected.vote === v
                            ? v === 'yes' ? 'bg-green-400/20 text-green-400 border-green-400/40'
                              : v === 'no' ? 'bg-red-400/20 text-red-400 border-red-400/40'
                              : 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
                        {v === 'yes' ? '✓' : v === 'no' ? '✕' : '~'} {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
                <div className="text-3xl mb-2">👆</div>
                <div className="text-sm">Click a PNM to see details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'votes' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Vote rankings</div>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">🔒 Members only</span>
            </div>
            {sortedByVotes.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="text-sm font-bold text-gray-500 w-5 text-center">{i + 1}</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.color}`}>{p.initials}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.major} · GPA {p.gpa}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium
                  ${p.vote === 'yes' ? 'bg-green-400/10 text-green-400'
                    : p.vote === 'no' ? 'bg-red-400/10 text-red-400'
                    : p.vote === 'maybe' ? 'bg-yellow-400/10 text-yellow-400'
                    : 'bg-gray-800 text-gray-500'}`}>
                  {p.vote ? p.vote.charAt(0).toUpperCase() + p.vote.slice(1) : 'No vote'}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-4">Bid recommendations</div>
            <div className="text-xs text-gray-400 mb-3">Pledges who received yes votes:</div>
            {pnms.filter(p => p.vote === 'yes').length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">No yes votes yet.</div>
            ) : pnms.filter(p => p.vote === 'yes').map(p => (
              <div key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${p.color}`}>{p.initials}</div>
                <div className="flex-1 text-sm text-white">{p.name}</div>
                <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded">Bid</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            {rushEvents.map(e => (
              <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-white">{e.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium
                    ${e.status === 'complete' ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400'}`}>
                    {e.status === 'complete' ? 'Complete' : 'Upcoming'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-3">📅 {e.date} · {e.attendees}/{e.capacity} attended</div>
                <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${(e.attendees / e.capacity) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-3">PNM attendance</div>
            {pnms.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.color}`}>{p.initials}</div>
                <div className="flex-1 text-xs font-medium text-white">{p.name}</div>
                <div className="flex gap-1">
                  {[...Array(p.total_events)].map((_, i) => (
                    <div key={i} className={`w-5 h-5 rounded flex items-center justify-center text-xs
                      ${i < p.events_attended ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-600'}`}>
                      {i < p.events_attended ? '✓' : '–'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}