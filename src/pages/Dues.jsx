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
  const [payingId, setPayingId] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingDues, setEditingDues] = useState(false)
  const [globalDues, setGlobalDues] = useState(350)
  const [globalSocial, setGlobalSocial] = useState(75)
  const [globalDueDate, setGlobalDueDate] = useState('March 31')
  const [showAdminEdit, setShowAdminEdit] = useState(false)
  const [editMember, setEditMember] = useState(null)

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    setLoading(true)
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
    const me = (data || []).find(m => m.user_id === user?.id)
    setMyMember(me)
    setIsAdmin(me?.is_admin || false)
    setLoading(false)
  }

  async function markPaid(id, val = true) {
    await supabase.from('members').update({ dues_paid: val }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, dues_paid: val } : m))
  }

  async function markSocialPaid(id, val = true) {
    await supabase.from('members').update({ social_paid: val }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, social_paid: val } : m))
  }

  async function updateMemberDues(id, amount) {
    await supabase.from('members').update({ dues_amount: amount }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, dues_amount: amount } : m))
  }

  async function applyGlobalDues() {
    await supabase.from('members').update({ dues_amount: globalDues })
    setMembers(prev => prev.map(m => ({ ...m, dues_amount: globalDues })))
    setShowAdminEdit(false)
    toast('Dues updated for all members!')
  }

  async function handlePay() {
    if (!myMember) return
    await markPaid(myMember.id)
    setPayingId(null)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const [successMsg, setSuccessMsg] = useState('')
  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const paidCount = members.filter(m => m.dues_paid).length
  const unpaidCount = members.filter(m => !m.dues_paid).length
  const totalCollected = members.filter(m => m.dues_paid).reduce((s, m) => s + (m.dues_amount || globalDues), 0)
  const totalExpected = members.reduce((s, m) => s + (m.dues_amount || globalDues), 0)
  const pct = members.length > 0 ? Math.round((paidCount / members.length) * 100) : 0
  const socialPaidCount = members.filter(m => m.social_paid).length

  const myBalance = myMember?.dues_paid ? 0 : (myMember?.dues_amount || globalDues)
  const filtered = members.filter(m => {
    if (filter === 'unpaid') return !m.dues_paid
    if (filter === 'paid') return m.dues_paid
    return true
  })

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading dues...</div>

  return (
    <div className="p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dues & Payments</h1>
          <p className="text-gray-400 text-sm">Spring 2025 · Due {globalDueDate}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdminEdit(true)}
            className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm rounded-xl hover:bg-yellow-400/20 transition-all">
            ⚙️ Admin Settings
          </button>
        )}
      </div>

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">✓ {successMsg}</div>
      )}

      {showSuccess && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">✓ Payment successful!</div>
      )}

      {/* Admin Settings Modal */}
      {showAdminEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="text-lg font-bold text-white mb-4">Admin — Dues Settings</div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Base dues amount ($)</label>
              <input type="number"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                value={globalDues}
                onChange={e => setGlobalDues(Number(e.target.value))}
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Social fee ($)</label>
              <input type="number"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                value={globalSocial}
                onChange={e => setGlobalSocial(Number(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <label className="text-xs text-gray-400 mb-1 block">Due date</label>
              <input type="text"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                value={globalDueDate}
                onChange={e => setGlobalDueDate(e.target.value)}
                placeholder="e.g. March 31"
              />
            </div>

            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-5">
              <div className="text-xs text-yellow-400 font-medium mb-2">Per-member overrides</div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                      {m.initials}
                    </div>
                    <div className="flex-1 text-sm text-white">{m.name}</div>
                    <input type="number"
                      className="w-20 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-gray-700 outline-none"
                      value={m.dues_amount || globalDues}
                      onChange={e => updateMemberDues(m.id, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAdminEdit(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button onClick={applyGlobalDues}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">
                Apply to all →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-1">Pay spring dues</div>
            <div className="text-sm text-gray-400 mb-5">Mark as paid for this semester</div>
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Spring dues</span>
                <span className="text-white font-medium">${myMember?.dues_amount || globalDues}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between">
                <span className="text-white font-medium">Total</span>
                <span className="text-yellow-400 font-bold">${myMember?.dues_amount || globalDues}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayingId(null)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-3 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handlePay}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-3 text-sm hover:bg-yellow-300">
                Mark paid →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My balance */}
      <div className={`rounded-xl p-5 mb-6 border ${myBalance > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your balance</div>
            <div className={`text-4xl font-bold mb-1 ${myBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {myBalance > 0 ? `$${myBalance}` : 'Paid ✓'}
            </div>
            <div className="text-sm text-gray-400">
              {myBalance > 0 ? `Spring dues · Due ${globalDueDate}` : 'All dues paid for Spring 2025'}
            </div>
          </div>
          {myBalance > 0 && (
            <button onClick={() => setPayingId(myMember?.id)}
              className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-300 transition-all">
              Pay ${myBalance} now →
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {['overview', 'members', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-all
              ${tab === t ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Spring dues (${globalDues})</div>
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded font-medium">{pct}% collected</span>
              </div>
              <div className="bg-gray-800 rounded-full h-3 mb-3 overflow-hidden">
                <div className="h-3 rounded-full bg-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }}></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{paidCount}</div>
                  <div className="text-xs text-gray-500">Paid</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-400">{unpaidCount}</div>
                  <div className="text-xs text-gray-500">Unpaid</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">${totalCollected.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Collected</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Social fee (${globalSocial})</div>
                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded font-medium">
                  {members.length > 0 ? Math.round((socialPaidCount / members.length) * 100) : 0}% collected
                </span>
              </div>
              <div className="bg-gray-800 rounded-full h-3 mb-3 overflow-hidden">
                <div className="h-3 rounded-full bg-blue-400 transition-all duration-500"
                  style={{ width: `${members.length > 0 ? (socialPaidCount / members.length) * 100 : 0}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{socialPaidCount} paid · {members.length - socialPaidCount} pending</span>
                <span>${(socialPaidCount * globalSocial).toLocaleString()} of ${(members.length * globalSocial).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Overdue members</div>
                <button className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded hover:bg-red-400/20">Send reminders</button>
              </div>
              {members.filter(m => !m.dues_paid).length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">Everyone is paid up! 🎉</div>
              ) : (
                members.filter(m => !m.dues_paid).map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                      {m.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">${m.dues_amount || globalDues} overdue</div>
                    </div>
                    <button onClick={() => markPaid(m.id)}
                      className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-lg hover:bg-green-400/20">
                      Mark paid
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">Chapter financials</div>
              {[
                { label: 'Total collected', value: `$${(totalCollected + socialPaidCount * globalSocial).toLocaleString()}`, color: 'text-green-400' },
                { label: 'Still outstanding', value: `$${(totalExpected - totalCollected).toLocaleString()}`, color: 'text-red-400' },
                { label: 'Expected total', value: `$${(totalExpected + members.length * globalSocial).toLocaleString()}`, color: 'text-white' },
                { label: 'Late fees pending', value: '$0', color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                  <div className="text-sm text-gray-400">{s.label}</div>
                  <div className={`text-sm font-semibold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['all', 'unpaid', 'paid'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${filter === f ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                {f === 'all' ? `All (${members.length})` : f === 'unpaid' ? `Unpaid (${unpaidCount})` : `Paid (${paidCount})`}
              </button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Member</div>
              <div className="text-center">Amount</div>
              <div className="text-center">Dues</div>
              <div className="text-center">Social</div>
              <div className="text-center">Action</div>
            </div>
            {filtered.map(m => (
              <div key={m.id} className="grid grid-cols-6 px-4 py-3 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30">
                <div className="col-span-2 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color || 'bg-gray-700 text-gray-300'}`}>
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.role}</div>
                  </div>
                </div>
                <div className="text-center">
                  {isAdmin ? (
                    <input type="number"
                      className="w-16 bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-700 outline-none text-center"
                      value={m.dues_amount || globalDues}
                      onChange={e => updateMemberDues(m.id, Number(e.target.value))}
                    />
                  ) : (
                    <span className="text-sm text-white">${m.dues_amount || globalDues}</span>
                  )}
                </div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.dues_paid ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {m.dues_paid ? '✓ Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.social_paid ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {m.social_paid ? '✓ Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="text-center">
                  {isAdmin ? (
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => markPaid(m.id, !m.dues_paid)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${m.dues_paid ? 'text-gray-500 border-gray-700 hover:text-red-400' : 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20'}`}>
                        {m.dues_paid ? 'Undo' : '✓ Dues'}
                      </button>
                      <button onClick={() => markSocialPaid(m.id, !m.social_paid)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${m.social_paid ? 'text-gray-500 border-gray-700 hover:text-red-400' : 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20'}`}>
                        {m.social_paid ? 'Undo' : '✓ Social'}
                      </button>
                    </div>
                  ) : (
                    !m.dues_paid && m.user_id === user?.id ? (
                      <button onClick={() => setPayingId(m.id)}
                        className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-lg">
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

      {tab === 'history' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Member</div>
            <div>Type</div>
            <div className="text-right">Amount</div>
          </div>
          {members.filter(m => m.dues_paid || m.social_paid).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No payments yet.</div>
          ) : (
            members.filter(m => m.dues_paid || m.social_paid).map((m) => (
              <div key={m.id} className="grid grid-cols-4 px-4 py-3 border-b border-gray-800 last:border-0 items-center">
                <div className="col-span-2 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${m.color || 'bg-gray-700 text-gray-300'}`}>
                    {m.initials}
                  </div>
                  <span className="text-sm text-white">{m.name}</span>
                </div>
                <div className="text-sm text-gray-400">{m.dues_paid && m.social_paid ? 'Dues + Social' : m.dues_paid ? 'Spring dues' : 'Social fee'}</div>
                <div className="text-right text-sm font-semibold text-green-400">
                  +${((m.dues_paid ? (m.dues_amount || globalDues) : 0) + (m.social_paid ? globalSocial : 0)).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}