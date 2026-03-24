import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const duesAmount = 350
const socialAmount = 75

export default function Dues() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [filter, setFilter] = useState('all')
  const [payingId, setPayingId] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true })
    setMembers(data || [])
    setLoading(false)
  }

  async function markPaid(id) {
    await supabase.from('members').update({ dues_paid: true }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, dues_paid: true } : m))
  }

  async function markUnpaid(id) {
    await supabase.from('members').update({ dues_paid: false }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, dues_paid: false } : m))
  }

  async function markSocialPaid(id, val) {
    await supabase.from('members').update({ social_paid: val }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, social_paid: val } : m))
  }

  async function handlePay() {
    const me = members.find(m => m.name?.toLowerCase().includes(user?.user_metadata?.full_name?.split(' ')[0]?.toLowerCase()))
    if (me) await markPaid(me.id)
    setPayingId(null)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const paidCount = members.filter(m => m.dues_paid).length
  const unpaidCount = members.filter(m => !m.dues_paid).length
  const totalCollected = paidCount * duesAmount
  const pct = members.length > 0 ? Math.round((paidCount / members.length) * 100) : 0
  const socialPaidCount = members.filter(m => m.social_paid).length
  const socialPct = members.length > 0 ? Math.round((socialPaidCount / members.length) * 100) : 0

  const myName = user?.user_metadata?.full_name || ''
  const myMember = members.find(m => m.user_id === user?.id)
  console.log('user id:', user?.id)
  console.log('myMember:', myMember)
  const myBalance = myMember?.dues_paid ? 0 : duesAmount

  const filtered = members.filter(m => {
    if (filter === 'unpaid') return !m.dues_paid
    if (filter === 'paid') return m.dues_paid
    return true
  })

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading dues...</div>

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white mb-1">Dues & Payments</h1>
        <p className="text-gray-400 text-sm">Spring 2025 · Due March 31</p>
      </div>

      {showSuccess && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 flex items-center gap-2">
          <span>✓</span> Payment successful! Dues marked as paid.
        </div>
      )}

      {/* My balance card */}
      <div className={`rounded-xl p-5 mb-6 border ${myBalance > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your balance</div>
            <div className={`text-4xl font-bold mb-1 ${myBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {myBalance > 0 ? `$${myBalance}` : 'Paid ✓'}
            </div>
            <div className="text-sm text-gray-400">
              {myBalance > 0 ? 'Spring semester dues · Due March 31' : 'All dues paid for Spring 2025'}
            </div>
            {myBalance > 0 && (
              <div className="mt-2 text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg inline-block">
                ⚠ 14 days remaining · $25 late fee applies after due date
              </div>
            )}
          </div>
          {myBalance > 0 && (
            <div className="flex flex-col gap-2 ml-6">
              <button onClick={() => setPayingId(myMember?.id)}
                className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-300 transition-all whitespace-nowrap">
                Pay ${myBalance} now →
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-gray-800 text-gray-300 border border-gray-700 px-3 py-2 rounded-lg text-xs hover:bg-gray-700 transition-all">
                  Payment plan
                </button>
                <button className="bg-gray-800 text-gray-300 border border-gray-700 px-3 py-2 rounded-lg text-xs hover:bg-gray-700 transition-all">
                  Venmo instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {payingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-1">Pay spring dues</div>
            <div className="text-sm text-gray-400 mb-5">Secure payment via Stripe</div>
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Spring dues</span>
                <span className="text-white font-medium">$350.00</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-400">Processing fee</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between">
                <span className="text-white font-medium">Total</span>
                <span className="text-yellow-400 font-bold">$350.00</span>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Card number</label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-300">4242 4242 4242 4242</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Expiry</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-300">12/26</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">CVC</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-300">123</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayingId(null)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-3 text-sm hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button onClick={handlePay}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-3 text-sm hover:bg-yellow-300 transition-all">
                Pay $350 →
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="text-sm font-semibold text-white">Spring dues (${duesAmount})</div>
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
                <div className="text-sm font-semibold text-white">Social fee (${socialAmount})</div>
                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded font-medium">{socialPct}% collected</span>
              </div>
              <div className="bg-gray-800 rounded-full h-3 mb-3 overflow-hidden">
                <div className="h-3 rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${socialPct}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{socialPaidCount} paid · {members.length - socialPaidCount} pending</span>
                <span>${socialPaidCount * socialAmount} of ${members.length * socialAmount}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Overdue members</div>
                <button className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded hover:bg-red-400/20 transition-all">
                  Send all reminders
                </button>
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
                      <div className="text-xs text-gray-500">${m.dues_amount || duesAmount} overdue</div>
                    </div>
                    <button onClick={() => markPaid(m.id)}
                      className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-lg hover:bg-green-400/20 transition-all">
                      Mark paid
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">Chapter financials</div>
              {[
                { label: 'Total collected this semester', value: `$${(paidCount * duesAmount + socialPaidCount * socialAmount).toLocaleString()}`, color: 'text-green-400' },
                { label: 'Still outstanding', value: `$${(unpaidCount * duesAmount).toLocaleString()}`, color: 'text-red-400' },
                { label: 'Expected total', value: `$${(members.length * (duesAmount + socialAmount)).toLocaleString()}`, color: 'text-white' },
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
            <div className="grid grid-cols-5 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Member</div>
              <div className="text-center">Dues</div>
              <div className="text-center">Social fee</div>
              <div className="text-center">Action</div>
            </div>
            {filtered.map(m => (
              <div key={m.id} className="grid grid-cols-5 px-4 py-3 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30 transition-all">
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
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.dues_paid ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {m.dues_paid ? '✓ Paid' : `$${m.dues_amount || duesAmount}`}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.social_paid ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {m.social_paid ? '✓ Paid' : `$${socialAmount}`}
                  </span>
                </div>
                <div className="text-center">
                  {!m.dues_paid ? (
                    <button onClick={() => markPaid(m.id)}
                      className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-lg hover:bg-green-400/20 transition-all">
                      Mark paid
                    </button>
                  ) : (
                    <button onClick={() => markUnpaid(m.id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-all">
                      Undo
                    </button>
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
            <div className="col-span-2">Transaction</div>
            <div>Date</div>
            <div className="text-right">Amount</div>
          </div>
          {members.filter(m => m.dues_paid).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No payments yet.</div>
          ) : (
            members.filter(m => m.dues_paid).map((m, i) => (
              <div key={i} className="grid grid-cols-4 px-4 py-3 border-b border-gray-800 last:border-0 items-center">
                <div className="col-span-2">
                  <div className="text-sm text-white font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">Spring dues · via app</div>
                </div>
                <div className="text-sm text-gray-400">This semester</div>
                <div className="text-right text-sm font-semibold text-green-400">+${m.dues_amount || duesAmount}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}