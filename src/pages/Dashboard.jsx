import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ members: 0, pnms: 0, pledges: 0 })
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [duesStats, setDuesStats] = useState({ paid: 0, unpaid: 0, total: 0, pct: 0 })
  const [loading, setLoading] = useState(true)
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [showAnnouncementInput, setShowAnnouncementInput] = useState(false)

  const name = user?.user_metadata?.full_name || user?.email || 'there'
  const firstName = name.split(' ')[0]

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)

    const [
      { count: memberCount },
      { count: pnmCount },
      { count: pledgeCount },
      { data: memberDues },
      { data: msgs },
      { data: eventData },
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('pnms').select('*', { count: 'exact', head: true }),
      supabase.from('pledges').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('dues_paid, dues_amount'),
      supabase.from('messages').select('*').eq('channel_id', 1).order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(4),
    ])

    setStats({
      members: memberCount || 0,
      pnms: pnmCount || 0,
      pledges: pledgeCount || 0,
    })

    const paid = (memberDues || []).filter(m => m.dues_paid).length
    const unpaid = (memberDues || []).length - paid
    const total = (memberDues || []).reduce((s, m) => s + (m.dues_amount || 0), 0)
    const collected = (memberDues || []).filter(m => m.dues_paid).reduce((s, m) => s + (m.dues_amount || 0), 0)
    const pct = total > 0 ? Math.round((collected / total) * 100) : 0
    setDuesStats({ paid, unpaid, collected, total, pct })

    setAnnouncements(msgs || [])
    setEvents(eventData || [])
    setLoading(false)
  }

  async function postAnnouncement() {
    if (!newAnnouncement.trim()) return
    const name = user?.user_metadata?.full_name || user?.email || 'Unknown'
    await supabase.from('messages').insert({
      channel_id: 1,
      sender: name,
      sender_initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      sender_color: 'bg-yellow-400/20 text-yellow-400',
      text: newAnnouncement.trim(),
      is_mine: false,
      user_id: user.id,
    })
    setNewAnnouncement('')
    setShowAnnouncementInput(false)
    fetchAll()
  }

  async function addEvent() {
    const title = prompt('Event title?')
    if (!title) return
    const date = prompt('Date? (e.g. Mar 25)')
    const location = prompt('Location?')
    await supabase.from('events').insert({ title, date, location: location || '', mandatory: false, tag: 'Event' })
    fetchAll()
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-yellow-400 text-sm">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome back, {firstName}. Here's what's happening.</p>
      </div>

      {/* Real stats from Supabase */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Members</div>
          <div className="text-2xl font-bold text-white">{stats.members}</div>
          <div className="text-xs text-gray-500 mt-1">Registered accounts</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dues collected</div>
          <div className="text-2xl font-bold text-yellow-400">{duesStats.pct}%</div>
          <div className="text-xs text-gray-500 mt-1">${(duesStats.collected || 0).toLocaleString()} in</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">PNMs active</div>
          <div className="text-2xl font-bold text-white">{stats.pnms}</div>
          <div className="text-xs text-gray-500 mt-1">In the system</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pledges</div>
          <div className="text-2xl font-bold text-white">{stats.pledges}</div>
          <div className="text-xs text-gray-500 mt-1">This semester</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          {/* Announcements — pulled from All Members channel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Announcements</div>
              <button
                onClick={() => setShowAnnouncementInput(!showAnnouncementInput)}
                className="text-yellow-400 text-xs hover:text-yellow-300">
                + Post
              </button>
            </div>

            {showAnnouncementInput && (
              <div className="mb-3 flex gap-2">
                <input
                  className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none focus:border-yellow-400/50"
                  placeholder="Write announcement..."
                  value={newAnnouncement}
                  onChange={e => setNewAnnouncement(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && postAnnouncement()}
                />
                <button onClick={postAnnouncement}
                  className="bg-yellow-400 text-gray-900 font-bold px-3 rounded-lg text-sm hover:bg-yellow-300">
                  Post
                </button>
              </div>
            )}

            {announcements.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No announcements yet. Post one above!
              </div>
            ) : (
              announcements.map((msg, i) => (
                <div key={msg.id} className="flex gap-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.sender_color || 'bg-gray-700 text-gray-300'}`}>
                    {msg.sender_initials}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{msg.text}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {msg.sender} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dues progress */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Dues collection</div>
              <span className="text-yellow-400 text-xs">{duesStats.pct}%</span>
            </div>
            {duesStats.total === 0 ? (
              <div className="text-sm text-gray-500 text-center py-2">No dues data yet.</div>
            ) : (
              <>
                <div className="bg-gray-800 rounded-full h-2 mb-2">
                  <div className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${duesStats.pct}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{duesStats.paid} paid</span>
                  <span>{duesStats.unpaid} unpaid · ${((duesStats.total || 0) - (duesStats.collected || 0)).toLocaleString()} remaining</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Events */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Upcoming events</div>
            <button onClick={addEvent} className="text-yellow-400 text-xs hover:text-yellow-300">+ Add</button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600 text-sm mb-3">No events yet.</div>
              <button onClick={addEvent}
                className="text-yellow-400 text-xs border border-yellow-400/30 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition-all">
                + Add first event
              </button>
            </div>
          ) : (
            events.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="text-center min-w-[40px]">
                  <div className="text-xs text-gray-500">{e.date?.split(' ')[0]}</div>
                  <div className="text-base font-bold text-yellow-400">{e.date?.split(' ')[1]}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{e.title}</div>
                  <div className="text-xs text-gray-500">{e.location}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium
                  ${e.mandatory ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                  {e.tag || 'Event'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}