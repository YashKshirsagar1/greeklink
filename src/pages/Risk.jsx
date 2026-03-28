import { useState } from 'react'

const emergencyContacts = [
  { label: 'Campus Police', number: '412-268-2323', icon: '🚔' },
  { label: 'Campus Health', number: '412-268-2157', icon: '🏥' },
  { label: 'Chapter President', number: '—', icon: '👤' },
  { label: 'Risk Manager', number: '—', icon: '⚖️' },
  { label: 'National HQ', number: '1-800-SAE-RISK', icon: '🏛️' },
  { label: 'Poison Control', number: '1-800-222-1222', icon: '☠️' },
]

export default function Risk() {
  const [tab, setTab] = useState('sober')
  const [soberMonitors, setSoberMonitors] = useState([])
  const [guestList, setGuestList] = useState([])
  const [votes, setVotes] = useState([])
  const [reports, setReports] = useState([])
  const [philHours, setPhilHours] = useState([])
  const [newMonitor, setNewMonitor] = useState('')
  const [currentEvent, setCurrentEvent] = useState('Next Event')
  const [newGuest, setNewGuest] = useState({ name: '', host: '' })
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [showNewVote, setShowNewVote] = useState(false)
  const [newVoteTitle, setNewVoteTitle] = useState('')
  const [newVoteExec, setNewVoteExec] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportEvent, setReportEvent] = useState('')
  const [reportIncidents, setReportIncidents] = useState('0')
  const [reportNotes, setReportNotes] = useState('')
  const [showLogHours, setShowLogHours] = useState(false)
  const [logName, setLogName] = useState('')
  const [logHours, setLogHours] = useState('1')
  const [logOrg, setLogOrg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function addMonitor() {
    if (!newMonitor.trim()) return
    const initials = newMonitor.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = ['bg-yellow-400/20 text-yellow-400', 'bg-blue-400/20 text-blue-400', 'bg-green-400/20 text-green-400', 'bg-purple-400/20 text-purple-400', 'bg-cyan-400/20 text-cyan-400']
    setSoberMonitors(prev => [...prev, {
      id: Date.now(),
      name: newMonitor.trim(),
      initials,
      event: currentEvent,
      color: colors[prev.length % colors.length],
      confirmed: false,
    }])
    setNewMonitor('')
    toast('Sober monitor added!')
  }

  function toggleConfirm(id) {
    setSoberMonitors(prev => prev.map(m => m.id === id ? { ...m, confirmed: !m.confirmed } : m))
  }

  function removeMonitor(id) {
    setSoberMonitors(prev => prev.filter(m => m.id !== id))
  }

  function checkIn(id) {
    setGuestList(prev => prev.map(g => g.id === id ? {
      ...g, checkedIn: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } : g))
  }

  function removeGuest(id) {
    setGuestList(prev => prev.filter(g => g.id !== id))
  }

  function addGuest() {
    if (!newGuest.name.trim()) return
    setGuestList(prev => [...prev, {
      id: Date.now(),
      name: newGuest.name.trim(),
      host: newGuest.host.trim() || 'Unknown',
      checkedIn: false,
      time: null,
    }])
    setNewGuest({ name: '', host: '' })
    setShowAddGuest(false)
    toast('Guest added!')
  }

  function castVote(id, choice) {
    setVotes(prev => prev.map(v => v.id === id && v.status === 'open'
      ? { ...v, voted: Math.min(v.voted + 1, v.total) }
      : v
    ))
    toast(`Vote cast: ${choice}`)
  }

  function addVote() {
    if (!newVoteTitle.trim()) return
    setVotes(prev => [...prev, {
      id: Date.now(),
      title: newVoteTitle.trim(),
      closes: 'In 7 days',
      voted: 0,
      total: newVoteExec ? 8 : 82,
      status: 'open',
      execOnly: newVoteExec,
    }])
    setNewVoteTitle('')
    setNewVoteExec(false)
    setShowNewVote(false)
    toast('Vote created!')
  }

  function submitReport() {
    if (!reportEvent.trim()) return
    setReports(prev => [...prev, {
      id: Date.now(),
      event: reportEvent.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'submitted',
      incidents: parseInt(reportIncidents) || 0,
      monitors: soberMonitors.filter(m => m.confirmed).length,
      guests: guestList.length,
      notes: reportNotes,
    }])
    setShowReport(false)
    setReportEvent('')
    setReportIncidents('0')
    setReportNotes('')
    toast('Safety report submitted!')
  }

  function logPhilHours() {
    if (!logName.trim() || !logHours) return
    const initials = logName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = ['bg-yellow-400/20 text-yellow-400', 'bg-blue-400/20 text-blue-400', 'bg-green-400/20 text-green-400', 'bg-purple-400/20 text-purple-400']
    const existing = philHours.find(p => p.name.toLowerCase() === logName.trim().toLowerCase())
    if (existing) {
      setPhilHours(prev => prev.map(p => p.name.toLowerCase() === logName.trim().toLowerCase()
        ? { ...p, hours: Math.min(p.required, p.hours + parseFloat(logHours)) }
        : p
      ))
    } else {
      setPhilHours(prev => [...prev, {
        initials,
        name: logName.trim(),
        hours: parseFloat(logHours),
        required: 20,
        color: colors[prev.length % colors.length],
      }])
    }
    setLogName('')
    setLogHours('1')
    setLogOrg('')
    toast('Hours logged!')
  }

  const checkedIn = guestList.filter(g => g.checkedIn).length
  const confirmedMonitors = soberMonitors.filter(m => m.confirmed).length

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white mb-1">Risk Management</h1>
        <p className="text-gray-400 text-sm">Sober monitors, guest lists, safety reports, votes, and philanthropy hours.</p>
      </div>

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ {successMsg}
        </div>
      )}

      {/* Add guest modal */}
      {showAddGuest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Add guest</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Guest name</label>
              <input autoFocus
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. Sarah K."
                value={newGuest.name}
                onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Host (brother responsible)</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. Yash K."
                value={newGuest.host}
                onChange={e => setNewGuest({ ...newGuest, host: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddGuest(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={addGuest}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Add →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New vote modal */}
      {showNewVote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Create vote</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Vote title</label>
              <input autoFocus
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. Approve spring budget"
                value={newVoteTitle}
                onChange={e => setNewVoteTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addVote()}
              />
            </div>
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => setNewVoteExec(!newVoteExec)}
                className={`w-10 h-6 rounded-full transition-all relative ${newVoteExec ? 'bg-yellow-400' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newVoteExec ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm text-gray-300">Exec board only</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewVote(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={addVote}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Create →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File report modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">File safety report</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Event name</label>
              <input autoFocus
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. Spring Mixer"
                value={reportEvent}
                onChange={e => setReportEvent(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Number of incidents</label>
              <input type="number" min="0"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                value={reportIncidents}
                onChange={e => setReportIncidents(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea rows={3}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none resize-none"
                placeholder="Any incidents, observations, or notes..."
                value={reportNotes}
                onChange={e => setReportNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReport(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={submitReport}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Submit →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {[
          { key: 'sober', label: 'Sober monitors' },
          { key: 'guests', label: 'Guest list' },
          { key: 'votes', label: 'Chapter votes' },
          { key: 'philhours', label: 'Philanthropy hrs' },
          { key: 'emergency', label: 'Emergency contacts' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all
              ${tab === t.key ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sober monitors */}
      {tab === 'sober' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <input
                    className="bg-transparent text-sm font-semibold text-white outline-none border-b border-gray-700 focus:border-yellow-400/50 pb-0.5"
                    value={currentEvent}
                    onChange={e => setCurrentEvent(e.target.value)}
                    placeholder="Event name..."
                  />
                  <div className="text-xs text-gray-500 mt-1">{confirmedMonitors} confirmed · {soberMonitors.length} assigned</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0
                  ${confirmedMonitors >= 2 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                  {confirmedMonitors >= 2 ? '✓ Covered' : '⚠ Need more'}
                </span>
              </div>

              {soberMonitors.length === 0 ? (
                <div className="text-center py-6 text-gray-600 text-sm">No sober monitors assigned yet.</div>
              ) : (
                soberMonitors.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.color}`}>
                      {m.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.event}</div>
                    </div>
                    <button onClick={() => toggleConfirm(m.id)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium border transition-all
                        ${m.confirmed
                          ? 'bg-green-400/10 text-green-400 border-green-400/30'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-yellow-400/30 hover:text-yellow-400'}`}>
                      {m.confirmed ? '✓ Confirmed' : 'Confirm'}
                    </button>
                    <button onClick={() => removeMonitor(m.id)}
                      className="text-gray-600 hover:text-red-400 text-sm transition-all ml-1">×</button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">Add sober monitor</div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                  placeholder="Member name..."
                  value={newMonitor}
                  onChange={e => setNewMonitor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMonitor()}
                />
                <button onClick={addMonitor}
                  className="bg-yellow-400 text-gray-900 font-bold px-4 rounded-lg text-sm hover:bg-yellow-300 transition-all">
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-white mb-3">Safety reports</div>
              {reports.length === 0 ? (
                <div className="text-center py-6 text-gray-600 text-sm">No safety reports filed yet.</div>
              ) : (
                reports.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{r.event}</div>
                      <div className="text-xs text-gray-500">{r.date} · {r.monitors} monitors · {r.guests} guests · {r.incidents} incidents</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium
                      ${r.status === 'submitted' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                      {r.status === 'submitted' ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
              <button onClick={() => setShowReport(true)}
                className="w-full mt-3 bg-gray-800 text-gray-300 border border-dashed border-gray-700 rounded-xl py-2.5 text-sm hover:border-yellow-400/40 hover:text-yellow-400 transition-all">
                + File new safety report
              </button>
            </div>

            <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-red-400 mb-3">⚠ Risk reminders</div>
              {[
                'Minimum 2 sober monitors required per event',
                'Guest list must be submitted 24hrs before event',
                'All incidents must be reported within 48hrs',
                'No event can exceed 2× chapter member count in guests',
              ].map((r, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-400 py-1.5 border-b border-gray-800/50 last:border-0">
                  <span className="text-red-400 flex-shrink-0">•</span>{r}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guest list */}
      {tab === 'guests' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 rounded-xl px-4 py-2 text-sm">
                <span className="text-green-400 font-bold">{checkedIn}</span>
                <span className="text-gray-400"> checked in</span>
              </div>
              <div className="bg-gray-900 rounded-xl px-4 py-2 text-sm">
                <span className="text-yellow-400 font-bold">{guestList.length - checkedIn}</span>
                <span className="text-gray-400"> expected</span>
              </div>
              <div className="bg-gray-900 rounded-xl px-4 py-2 text-sm">
                <span className="text-white font-bold">{guestList.length}</span>
                <span className="text-gray-400"> total</span>
              </div>
            </div>
            <button onClick={() => setShowAddGuest(true)}
              className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all">
              + Add guest
            </button>
          </div>

          {guestList.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-gray-400 text-sm mb-4">No guests on the list yet.</div>
              <button onClick={() => setShowAddGuest(true)}
                className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-xl text-sm hover:bg-yellow-300">
                + Add first guest
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">Guest</div>
                <div>Host</div>
                <div>Check-in time</div>
                <div className="text-right">Status</div>
              </div>
              {guestList.map(g => (
                <div key={g.id} className="grid grid-cols-5 px-4 py-3 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30 transition-all">
                  <div className="col-span-2 text-sm font-medium text-white">{g.name}</div>
                  <div className="text-sm text-gray-400">{g.host}</div>
                  <div className="text-sm text-gray-400">{g.time || '—'}</div>
                  <div className="flex justify-end gap-2">
                    {g.checkedIn ? (
                      <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded font-medium">✓ In</span>
                    ) : (
                      <button onClick={() => checkIn(g.id)}
                        className="text-xs bg-blue-400/10 text-blue-400 border border-blue-400/30 px-3 py-1 rounded-lg hover:bg-blue-400/20 transition-all">
                        Check in
                      </button>
                    )}
                    <button onClick={() => removeGuest(g.id)}
                      className="text-gray-600 hover:text-red-400 text-sm transition-all">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Votes */}
      {tab === 'votes' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Chapter votes</div>
              <button onClick={() => setShowNewVote(true)}
                className="bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-300 transition-all">
                + New vote
              </button>
            </div>
            {votes.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                <div className="text-3xl mb-3">🗳️</div>
                <div className="text-gray-400 text-sm mb-4">No votes yet.</div>
                <button onClick={() => setShowNewVote(true)}
                  className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-xl text-sm hover:bg-yellow-300">
                  + Create first vote
                </button>
              </div>
            ) : votes.map(v => (
              <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">{v.title}</div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium
                        ${v.status === 'open' ? 'bg-green-400/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {v.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                      {v.execOnly && <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">Exec only</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{v.voted}/{v.total} voted</div>
                    <div>Closes: {v.closes}</div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
                  <div className="h-2 rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${(v.voted / v.total) * 100}%` }} />
                </div>
                {v.status === 'open' && (
                  <div className="flex gap-2">
                    <button onClick={() => castVote(v.id, 'Yes')}
                      className="flex-1 bg-green-400/10 text-green-400 border border-green-400/30 rounded-lg py-1.5 text-xs font-medium hover:bg-green-400/20 transition-all">
                      ✓ Yes
                    </button>
                    <button onClick={() => castVote(v.id, 'No')}
                      className="flex-1 bg-red-400/10 text-red-400 border border-red-400/30 rounded-lg py-1.5 text-xs font-medium hover:bg-red-400/20 transition-all">
                      ✕ No
                    </button>
                    <button onClick={() => castVote(v.id, 'Abstain')}
                      className="flex-1 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg py-1.5 text-xs font-medium hover:text-white transition-all">
                      ~ Abstain
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4 self-start">
            <div className="text-sm font-semibold text-red-400 mb-3">⚠ Risk reminders</div>
            {[
              'Minimum 2 sober monitors required per event',
              'Guest list must be submitted 24hrs before event',
              'All incidents must be reported within 48hrs',
              'No event can exceed 2× chapter member count in guests',
            ].map((r, i) => (
              <div key={i} className="flex gap-2 text-xs text-gray-400 py-1.5 border-b border-gray-800/50 last:border-0">
                <span className="text-red-400 flex-shrink-0">•</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Philanthropy hours */}
      {tab === 'philhours' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Philanthropy hours</div>
              <span className="text-xs text-gray-500">Required: 20 hrs</span>
            </div>
            {philHours.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">No hours logged yet. Use the form to add hours.</div>
            ) : philHours.map((p, i) => {
              const pct = Math.round((p.hours / p.required) * 100)
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.color}`}>
                    {p.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{p.name}</span>
                      <span className={pct >= 100 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                        {p.hours}/{p.required} hrs
                      </span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${pct >= 100 ? 'text-green-400' : 'text-gray-400'}`}>
                    {pct >= 100 ? '✓' : `${pct}%`}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-4">Log hours</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Member name</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. Yash K."
                value={logName}
                onChange={e => setLogName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Hours to add</label>
              <input type="number" min="0.5" max="20" step="0.5"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                value={logHours}
                onChange={e => setLogHours(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Event / organization</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. Food bank volunteering"
                value={logOrg}
                onChange={e => setLogOrg(e.target.value)}
              />
            </div>
            <button onClick={logPhilHours}
              className="w-full bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">
              Log hours
            </button>
          </div>
        </div>
      )}

      {/* Emergency contacts */}
      {tab === 'emergency' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-1">Emergency contacts</div>
            <div className="text-xs text-gray-500 mb-4">Tap any number to call</div>
            {emergencyContacts.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
                <div className="text-xl w-8 text-center flex-shrink-0">{c.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{c.label}</div>
                  <div className="text-xs text-blue-400 font-mono">{c.number}</div>
                </div>
                <a href={`tel:${c.number}`}
                  className="text-xs bg-blue-400/10 text-blue-400 border border-blue-400/30 px-3 py-1.5 rounded-lg hover:bg-blue-400/20 transition-all">
                  Call
                </a>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-red-400 mb-3">🚨 Emergency protocol</div>
              {[
                { step: '1', text: 'Call 911 for any life-threatening emergency' },
                { step: '2', text: 'Contact chapter president and risk manager immediately' },
                { step: '3', text: 'Do not move an injured person unless in immediate danger' },
                { step: '4', text: 'Clear the area and keep bystanders back' },
                { step: '5', text: 'File an incident report within 24 hours' },
                { step: '6', text: 'Contact national HQ if police are involved' },
              ].map(p => (
                <div key={p.step} className="flex gap-3 py-2 border-b border-gray-800/50 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-red-400/20 text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {p.step}
                  </div>
                  <div className="text-xs text-gray-300">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
