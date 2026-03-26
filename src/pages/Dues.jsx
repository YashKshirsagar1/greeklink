import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Dues() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [filter, setFilter] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const [myMember, setMyMember] = useState(null)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [globalDues, setGlobalDues] = useState(0)
  const [globalSocial, setGlobalSocial] = useState(0)
  const [globalDueDate, setGlobalDueDate] = useState('March 31')
  const [editDues, setEditDues] = useState(0)
  const [editSocial, setEditSocial] = useState(0)
  const [editDueDate, setEditDueDate] = useState('March 31')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchMembers(), fetchSettings()])
    setLoading(false)
  }

  async function fetchSettings() {
    const { data } = await supabase.from('chapter_settings').select('*').eq('id', 1).single()
    if (data) {
      setGlobalDues(data.dues_amount ?? 0)
      setGlobalSocial(data.social_amount ?? 0)
      setGlobalDueDate(data.due_date ?? 'March 31')
      setEditDues(data.dues_amount ?? 0)
      setEditSocial(data.social_amount ?? 0)
      setEditDueDate(data.due_date ?? 'March 31')
    }
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

  function openAdmin() {
    setEditDues(globalDues)
    setEditSocial(globalSocial)
    setEditDueDate(globalDueDate)
    setShowAdminModal(true)
  }

  async function saveSettings() {
    const { error: e1 } = await supabase.from('chapter_settings').upsert({
      id: 1, dues_amount: editDues, social_amount: editSocial, due_date: editDueDate
    })
    if (e1) { alert('Error: ' + e1.message); return }
    await supabase.from('members').update({ dues_amount: editDues })
    setGlobalDues(editDues)
    setGlobalSocial(editSocial)
    setGlobalDueDate(editDueDate)
    setMembers(prev => prev.map(m => ({ ...m, dues_amount: editDues })))
    setShowAdminModal(false)
    toast('✓ Settings saved!')
  }

  async function markDuesPaid(id, val) {
    await supabase.from('members').update({ dues_paid: val }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, dues_paid: val } : m))
  }

  async function markSocialPaid(id, val) {
    const { data, error } = await supabase
      .from('members')
      .update({ social_paid: val })
      .eq('id', id)
      .select()
    
    console.log('markSocialPaid result:', { data, error, id, val })
    
    if (error) {
      alert('Error: ' + JSON.stringify(error))
      return
    }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, social_paid: val } : m))
  }

  async function markAllDues(val) {
    await supabase.from('members').update({ dues_paid: val })
    setMembers(prev => prev.map(m => ({ ...m, dues_paid: val })))
    toast(val ? '✓ All dues marked paid' : '✓ All dues reset')
  }

  async function markAllSocial(val) {
    await supabase.from('members').update({ social_paid: val })
    setMembers(prev => prev.map(m => ({ ...m, social_paid: val })))
    toast(val ? '✓ All social fees marked paid' : '✓ All social fees reset')
  }

  async function updateMemberAmount(id, amount) {
    await supabase.from('members').update({ dues_amount: amount }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, dues_amount: amount } : m))
  }

  async function handleSelfPay() {
    if (!myMember) return
    await markDuesPaid(myMember.id, true)
    setShowPayModal(false)
    toast('✓ Payment recorded!')
  }

  // Computed stats
  const total = members.length
  const duesPaid = members.filter(m => m.dues_paid).length
  const duesUnpaid = total - duesPaid
  const socialPaid = members.filter(m => m.social_paid).length
  const duesPct = total > 0 ? Math.round((duesPaid / total) * 100) : 0
  const socialPct = total > 0 ? Math.round((socialPaid / total) * 100) : 0
  const duesCollected = members.filter(m => m.dues_paid).reduce((s, m) => s + (m.dues_amount ?? globalDues), 0)
  const duesExpected = members.reduce((s, m) => s + (m.dues_amount ?? globalDues), 0)
  const socialCollected = socialPaid * globalSocial
  const socialExpected = total * globalSocial
  const myBalance = myMember?.dues_paid ? 0 : (myMember?.dues_amount ?? globalDues)

  const filtered = members.filter(m =>
    filter === 'unpaid' ? !m.dues_paid :
    filter === 'paid' ? m.dues_paid : true
  )

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading dues...</div>

  return (
    <div className="p-6">

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 flex items-center gap-2">
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dues & Payments</h1>
          <p className="text-gray-400 text-sm">Spring 2025 · Due {globalDueDate}</p>
        </div>
        {isAdmin && (
          <button onClick={openAdmin}
            className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-medium rounded-xl hover:bg-yellow-400/20 transition-all flex items-center gap-2">
            ⚙️ Admin Settings
          </button>
        )}
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-white">Admin — Dues Settings</div>
                <div className="text-xs text-gray-500 mt-0.5">All changes save to database instantly</div>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Dues amount ($)</label>
                  <input type="number" min="0"
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/60 transition-all"
                    value={editDues}
                    onChange={e => setEditDues(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Social fee ($)</label>
                  <input type="number" min="0"
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/60 transition-all"
                    value={editSocial}
                    onChange={e => setEditSocial(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Due date</label>
                <input type="text"
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/60 transition-all"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  placeholder="e.g. March 31"
                />
              </div>

              {/* Bulk actions */}
              <div className="mb-5">
                <div className="text-xs text-gray-400 font-medium mb-2">Bulk actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => markAllDues(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-medium rounded-xl hover:bg-green-400/20 transition-all">
                    ✓ Mark all dues paid
                  </button>
                  <button onClick={() => markAllSocial(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-400/10 border border-blue-400/20 text-blue-400 text-xs font-medium rounded-xl hover:bg-blue-400/20 transition-all">
                    ✓ Mark all social paid
                  </button>
                  <button onClick={() => markAllDues(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-medium rounded-xl hover:bg-red-400/20 transition-all">
                    ✗ Reset all dues
                  </button>
                  <button onClick={() => markAllSocial(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-medium rounded-xl hover:bg-red-400/20 transition-all">
                    ✗ Reset all social
                  </button>
                </div>
              </div>

              {/* Per member */}
              <div>
                <div className="text-xs text-gray-400 font-medium mb-2">Per-member amounts</div>
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  {members.map((m, i) => (
                    <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i < members.length - 1 ? 'border-b border-gray-700' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium">{m.name}</div>
                        <div className="flex gap-2 mt-0.5">
                          <span className={`text-xs ${m.dues_paid ? 'text-green-400' : 'text-red-400'}`}>
                            {m.dues_paid ? '✓ Dues paid' : '✗ Dues unpaid'}
                          </span>
                          <span className={`text-xs ${m.social_paid ? 'text-green-400' : 'text-yellow-400'}`}>
                            · {m.social_paid ? '✓ Social paid' : '✗ Social unpaid'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">$</span>
                        <input type="number" min="0"
                          className="w-20 bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 outline-none text-center focus:border-yellow-400/50"
                          value={m.dues_amount ?? editDues}
                          onChange={e => updateMemberAmount(m.id, Number(e.target.value))}
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => markDuesPaid(m.id, !m.dues_paid)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-all ${m.dues_paid ? 'text-gray-500 border-gray-700 hover:text-red-400 hover:border-red-400/30' : 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20'}`}>
                          D
                        </button>
                        <button
                          onClick={() => markSocialPaid(m.id, !m.social_paid)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-all ${m.social_paid ? 'text-gray-500 border-gray-700 hover:text-red-400 hover:border-red-400/30' : 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20'}`}>
                          S
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-1.5">D = toggle dues · S = toggle social</div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowAdminModal(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button onClick={saveSettings}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">
                Save & apply to all →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-base font-bold text-white mb-1">Pay spring dues</div>
            <div className="text-sm text-gray-400 mb-5">Confirm your payment of ${myBalance}</div>
            <div className="bg-gray-800 rounded-xl p-4 mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Spring dues</span>
                <span className="text-white">${myMember?.dues_amount ?? globalDues}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
                <span className="text-white">Total due</span>
                <span className="text-yellow-400">${myBalance}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPayModal(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-3 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleSelfPay}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-3 text-sm hover:bg-yellow-300">
                Confirm payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My balance banner */}
      <div className={`rounded-2xl p-5 mb-6 border ${myBalance > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your balance</div>
            <div className={`text-5xl font-black mb-2 ${myBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {myBalance > 0 ? `$${myBalance}` : 'Paid ✓'}
            </div>
            <div className="text-sm text-gray-400">
              {myBalance > 0 ? `Spring dues · Due ${globalDueDate}` : 'All dues paid for Spring 2025'}
            </div>
            {myBalance > 0 && (
              <div className="mt-2 text-xs text-red-300 bg-red-400/10 px-3 py-1.5 rounded-lg inline-block">
                ⚠ $25 late fee after {globalDueDate}
              </div>
            )}
          </div>
          {myBalance > 0 && (
            <div className="flex flex-col gap-2 ml-6">
              <button onClick={() => setShowPayModal(true)}
                className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl text-sm hover:bg-yellow-300 transition-all whitespace-nowrap">
                Pay ${myBalance} now →
              </button>
              <button className="bg-gray-800 text-gray-300 border border-gray-700 px-4 py-2 rounded-xl text-xs hover:bg-gray-700 transition-all text-center">
                Venmo @touse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {['overview', 'members', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-all
              ${tab === t ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">

            {/* Dues progress */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white">Spring dues</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {globalDues > 0 ? `$${globalDues} per member` : 'Amount not set yet'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-yellow-400">{duesPct}%</div>
                  <div className="text-xs text-gray-500">collected</div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-full h-4 mb-4 overflow-hidden">
                <div className="h-4 rounded-full bg-yellow-400 transition-all duration-700 relative"
                  style={{ width: `${duesPct}%` }}>
                  {duesPct > 15 && (
                    <span className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-bold text-gray-900">{duesPct}%</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-green-400">{duesPaid}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Paid</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-red-400">{duesUnpaid}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Unpaid</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-white">${duesCollected.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-0.5">In</div>
                </div>
              </div>
            </div>

            {/* Social progress */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white">Social fee</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {globalSocial > 0 ? `$${globalSocial} per member` : 'Amount not set yet'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-400">{socialPct}%</div>
                  <div className="text-xs text-gray-500">collected</div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-full h-4 mb-4 overflow-hidden">
                <div className="h-4 rounded-full bg-blue-400 transition-all duration-700 relative"
                  style={{ width: `${socialPct}%` }}>
                  {socialPct > 15 && (
                    <span className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-bold text-white">{socialPct}%</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{socialPaid} paid · {total - socialPaid} pending</span>
                <span>${socialCollected.toLocaleString()} of ${socialExpected.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Overdue */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Overdue members</div>
                {isAdmin && duesUnpaid > 0 && (
                  <button className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-lg hover:bg-red-400/20 transition-all">
                    Send reminders
                  </button>
                )}
              </div>
              {duesUnpaid === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="text-sm text-gray-400">Everyone is paid up!</div>
                </div>
              ) : (
                members.filter(m => !m.dues_paid).map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                      {m.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{m.name}</div>
                      <div className="text-xs text-red-400">${m.dues_amount ?? globalDues} overdue</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => markDuesPaid(m.id, true)}
                        className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-xl hover:bg-green-400/20 transition-all">
                        Mark paid
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Chapter financials */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-sm font-semibold text-white mb-3">Chapter financials</div>
              {[
                { label: 'Total collected', value: `$${(duesCollected + socialCollected).toLocaleString()}`, color: 'text-green-400' },
                { label: 'Still outstanding', value: `$${((duesExpected - duesCollected) + (socialExpected - socialCollected)).toLocaleString()}`, color: 'text-red-400' },
                { label: 'Expected total', value: `$${(duesExpected + socialExpected).toLocaleString()}`, color: 'text-white' },
                { label: 'Late fees pending', value: '$0', color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                  <div className="text-sm text-gray-400">{s.label}</div>
                  <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {['all', 'unpaid', 'paid'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all
                    ${filter === f
                      ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                  {f === 'all' ? `All (${total})` : f === 'unpaid' ? `Unpaid (${duesUnpaid})` : `Paid (${duesPaid})`}
                </button>
              ))}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => markAllDues(true)}
                  className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-xl hover:bg-green-400/20 transition-all">
                  ✓ All dues paid
                </button>
                <button onClick={() => markAllSocial(true)}
                  className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-xl hover:bg-blue-400/20 transition-all">
                  ✓ All social paid
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Member</div>
              <div className="col-span-2 text-center">Amount</div>
              <div className="col-span-2 text-center">Dues</div>
              <div className="col-span-2 text-center">Social</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">No members in this category</div>
            ) : filtered.map(m => (
              <div key={m.id} className="grid grid-cols-12 px-4 py-3.5 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30 transition-all">
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.role}</div>
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  {isAdmin ? (
                    <input type="number" min="0"
                      className="w-16 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 outline-none text-center"
                      value={m.dues_amount ?? globalDues}
                      onChange={e => updateMemberAmount(m.id, Number(e.target.value))}
                    />
                  ) : (
                    <span className="text-sm text-white font-medium">${m.dues_amount ?? globalDues}</span>
                  )}
                </div>
                <div className="col-span-2 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium
                    ${m.dues_paid ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {m.dues_paid ? '✓ Paid' : '✗ Unpaid'}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium
                    ${m.social_paid ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {m.social_paid ? '✓ Paid' : '✗ Unpaid'}
                  </span>
                </div>
                <div className="col-span-2 flex gap-1.5 justify-center">
                  {isAdmin ? (
                    <>
                      <button onClick={() => markDuesPaid(m.id, !m.dues_paid)}
                        title={m.dues_paid ? 'Undo dues' : 'Mark dues paid'}
                        className={`text-xs px-2 py-1.5 rounded-lg border transition-all
                          ${m.dues_paid
                            ? 'text-gray-500 border-gray-700 hover:text-red-400 hover:border-red-400/30'
                            : 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20'}`}>
                        {m.dues_paid ? 'D ✕' : 'D ✓'}
                      </button>
                      <button onClick={() => markSocialPaid(m.id, !m.social_paid)}
                        title={m.social_paid ? 'Undo social' : 'Mark social paid'}
                        className={`text-xs px-2 py-1.5 rounded-lg border transition-all
                          ${m.social_paid
                            ? 'text-gray-500 border-gray-700 hover:text-red-400 hover:border-red-400/30'
                            : 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20'}`}>
                        {m.social_paid ? 'S ✕' : 'S ✓'}
                      </button>
                    </>
                  ) : (
                    !m.dues_paid && m.user_id === user?.id ? (
                      <button onClick={() => setShowPayModal(true)}
                        className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-xl hover:bg-yellow-400/20 transition-all">
                        Pay now
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Member</div>
            <div>Type</div>
            <div className="text-right">Amount</div>
          </div>
          {members.filter(m => m.dues_paid || m.social_paid).length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm text-gray-500">No payments recorded yet</div>
            </div>
          ) : (
            members.filter(m => m.dues_paid || m.social_paid).map(m => (
              <div key={m.id} className="grid grid-cols-4 px-4 py-3.5 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/20 transition-all">
                <div className="col-span-2 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">Spring 2025</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {m.dues_paid && m.social_paid ? 'Dues + Social' : m.dues_paid ? 'Spring dues' : 'Social fee'}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-400">
                    +${((m.dues_paid ? (m.dues_amount ?? globalDues) : 0) + (m.social_paid ? globalSocial : 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
