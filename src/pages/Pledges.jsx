import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const taskLabels = ['Orientation', 'History test', 'Service project', 'Brother interviews', 'Final review']
const GPA_REQ = 3.0
const HOURS_REQ = 20
const ATTENDANCE_REQ = 75

function status(p) {
  const issues = []
  if (p.gpa < GPA_REQ) issues.push('GPA')
  if (p.service_hours < HOURS_REQ * 0.5) issues.push('Hours')
  if (!p.dues_paid) issues.push('Dues')
  if (p.attendance_rate < ATTENDANCE_REQ) issues.push('Attendance')
  if (issues.length === 0) return { label: 'On track', color: 'bg-green-400/10 text-green-400' }
  if (issues.length >= 2) return { label: 'At risk', color: 'bg-red-400/10 text-red-400', issues }
  return { label: 'Behind', color: 'bg-yellow-400/10 text-yellow-400', issues }
}

export default function Pledges() {
  const [pledges, setPledges] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tracker')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newPledge, setNewPledge] = useState({ name: '', major: '', gpa: '', bigBro: '', phone: '' })
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => { fetchPledges() }, [])

  async function fetchPledges() {
    setLoading(true)
    const { data } = await supabase
      .from('pledges')
      .select('*')
      .order('created_at', { ascending: true })
    setPledges((data || []).map(p => ({
      ...p,
      tasks: Array.isArray(p.tasks) ? p.tasks : JSON.parse(p.tasks || '[false,false,false,false,false]')
    })))
    setLoading(false)
  }

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  async function updateHours(id, val) {
    const clamped = Math.min(HOURS_REQ, Math.max(0, val))
    await supabase.from('pledges').update({ service_hours: clamped }).eq('id', id)
    setPledges(prev => prev.map(p => p.id === id ? { ...p, service_hours: clamped } : p))
    if (selected?.id === id) setSelected(s => ({ ...s, service_hours: clamped }))
  }

  async function toggleTask(id, taskIdx) {
    const pledge = pledges.find(p => p.id === id)
    if (!pledge) return
    const tasks = [...pledge.tasks]
    tasks[taskIdx] = !tasks[taskIdx]
    await supabase.from('pledges').update({ tasks }).eq('id', id)
    setPledges(prev => prev.map(p => p.id === id ? { ...p, tasks } : p))
    if (selected?.id === id) setSelected(s => ({ ...s, tasks }))
  }

  async function toggleDues(id) {
    const pledge = pledges.find(p => p.id === id)
    if (!pledge) return
    const newVal = !pledge.dues_paid
    await supabase.from('pledges').update({ dues_paid: newVal }).eq('id', id)
    setPledges(prev => prev.map(p => p.id === id ? { ...p, dues_paid: newVal } : p))
    if (selected?.id === id) setSelected(s => ({ ...s, dues_paid: newVal }))
  }

  async function handleAdd() {
    if (!newPledge.name.trim()) return
    const initials = newPledge.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = ['bg-purple-400/20 text-purple-400', 'bg-blue-400/20 text-blue-400', 'bg-green-400/20 text-green-400', 'bg-cyan-400/20 text-cyan-400']
    const row = {
      name: newPledge.name.trim(),
      initials,
      major: newPledge.major || 'Undeclared',
      gpa: parseFloat(newPledge.gpa) || 0,
      service_hours: 0,
      required_hours: HOURS_REQ,
      dues_paid: false,
      attendance_rate: 100,
      color: colors[pledges.length % colors.length],
      role: 'Pledge',
      phone: newPledge.phone,
      big_bro: newPledge.bigBro,
      tasks: [false, false, false, false, false],
    }
    const { data, error } = await supabase.from('pledges').insert(row).select().single()
    if (error) { alert('Error adding pledge: ' + error.message); return }
    if (data) setPledges(prev => [...prev, { ...data, tasks: data.tasks || [false,false,false,false,false] }])
    setNewPledge({ name: '', major: '', gpa: '', bigBro: '', phone: '' })
    setShowAdd(false)
    toast('✓ Pledge added!')
  }

  async function deletePledge(id) {
    if (!confirm('Remove this pledge? This cannot be undone.')) return
    const { error } = await supabase.from('pledges').delete().eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    setPledges(prev => prev.filter(p => p.id !== id))
    setSelected(null)
    toast('✓ Pledge removed.')
  }

  const filtered = pledges.filter(p => {
    const s = status(p)
    if (filter === 'ontrack') return s.label === 'On track'
    if (filter === 'behind') return s.label === 'Behind'
    if (filter === 'atrisk') return s.label === 'At risk'
    return true
  })

  const avgGpa = pledges.length ? (pledges.reduce((s, p) => s + Number(p.gpa), 0) / pledges.length).toFixed(2) : '0.00'
  const avgHours = pledges.length ? Math.round(pledges.reduce((s, p) => s + p.service_hours, 0) / pledges.length) : 0
  const paidCount = pledges.filter(p => p.dues_paid).length
  const onTrackCount = pledges.filter(p => status(p).label === 'On track').length

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading pledges...</div>

  return (
    <div className="p-6">

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          {successMsg}
        </div>
      )}

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Pledge Class</h1>
          <p className="text-gray-400 text-sm">Spring 2025 · {pledges.length} pledges</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all">
          + Add pledge
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Add new pledge</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Full name</label>
              <input autoFocus
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. John Smith"
                value={newPledge.name}
                onChange={e => setNewPledge({ ...newPledge, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Major</label>
                <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="CS" value={newPledge.major} onChange={e => setNewPledge({ ...newPledge, major: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">GPA</label>
                <input type="number" step="0.1" min="0" max="4"
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="3.5" value={newPledge.gpa} onChange={e => setNewPledge({ ...newPledge, gpa: e.target.value })} />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Big brother</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. Jake D." value={newPledge.bigBro} onChange={e => setNewPledge({ ...newPledge, bigBro: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="412-555-0100" value={newPledge.phone} onChange={e => setNewPledge({ ...newPledge, phone: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">
                Add pledge →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total pledges', value: pledges.length, color: 'text-white' },
          { label: 'Avg GPA', value: avgGpa, color: parseFloat(avgGpa) >= GPA_REQ ? 'text-green-400' : 'text-red-400' },
          { label: 'Avg service hrs', value: `${avgHours}/${HOURS_REQ}`, color: 'text-yellow-400' },
          { label: 'On track', value: `${onTrackCount}/${pledges.length}`, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {[
          { key: 'tracker', label: 'Progress tracker' },
          { key: 'tasks', label: 'Task checklist' },
          { key: 'requirements', label: 'Requirements' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all
              ${tab === t.key ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tracker' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="flex gap-2 mb-4">
              {[
                { key: 'all', label: `All (${pledges.length})` },
                { key: 'ontrack', label: `On track (${onTrackCount})` },
                { key: 'behind', label: `Behind (${pledges.filter(p => status(p).label === 'Behind').length})` },
                { key: 'atrisk', label: `At risk (${pledges.filter(p => status(p).label === 'At risk').length})` },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${filter === f.key ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
                <div className="text-4xl mb-3">🎗️</div>
                <div className="text-gray-400 text-sm mb-4">No pledges yet.</div>
                <button onClick={() => setShowAdd(true)}
                  className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-xl text-sm hover:bg-yellow-300">
                  + Add first pledge
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(p => {
                  const s = status(p)
                  const hoursPct = Math.round((p.service_hours / HOURS_REQ) * 100)
                  return (
                    <div key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all
                        ${selected?.id === p.id ? 'border-yellow-400/40' : 'border-gray-800 hover:border-gray-700'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.color}`}>
                          {p.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-white">{p.name}</div>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.color}`}>{s.label}</span>
                            {p.role === 'Pledge Class President' && (
                              <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">President</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{p.major} · GPA {p.gpa} · Big: {p.big_bro}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold ${p.dues_paid ? 'text-green-400' : 'text-red-400'}`}>
                            {p.dues_paid ? 'Paid ✓' : 'Unpaid'}
                          </div>
                          <div className="text-xs text-gray-500">Dues</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Service hrs</span>
                            <span className={hoursPct === 100 ? 'text-green-400' : hoursPct >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                              {p.service_hours}/{HOURS_REQ}
                            </span>
                          </div>
                          <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all ${hoursPct === 100 ? 'bg-green-400' : hoursPct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${hoursPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Attendance</span>
                            <span className={p.attendance_rate >= ATTENDANCE_REQ ? 'text-green-400' : 'text-red-400'}>{p.attendance_rate}%</span>
                          </div>
                          <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all ${p.attendance_rate >= ATTENDANCE_REQ ? 'bg-green-400' : 'bg-red-400'}`}
                              style={{ width: `${p.attendance_rate}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Tasks</span>
                            <span className="text-blue-400">{p.tasks.filter(Boolean).length}/{p.tasks.length}</span>
                          </div>
                          <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-blue-400 transition-all"
                              style={{ width: `${(p.tasks.filter(Boolean).length / p.tasks.length) * 100}%` }} />
                          </div>
                        </div>
                      </div>

                      {s.issues && (
                        <div className="mt-2 text-xs text-red-400 bg-red-400/5 px-2 py-1 rounded-lg">
                          ⚠ Issues: {s.issues.join(', ')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            {selected ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-4">
                {/* Header with delete */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${selected.color}`}>
                    {selected.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-white">{selected.name}</div>
                    <div className="text-xs text-gray-500">{selected.role}</div>
                  </div>
                  <button
                    onClick={() => deletePledge(selected.id)}
                    className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1.5 rounded-lg hover:bg-red-400/20 transition-all flex-shrink-0">
                    Remove
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Service hours</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateHours(selected.id, selected.service_hours - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700 flex items-center justify-center">–</button>
                    <div className="flex-1 text-center">
                      <span className="text-xl font-bold text-white">{selected.service_hours}</span>
                      <span className="text-gray-500 text-sm">/{HOURS_REQ}</span>
                    </div>
                    <button onClick={() => updateHours(selected.id, selected.service_hours + 1)}
                      className="w-7 h-7 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700 flex items-center justify-center">+</button>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2 mt-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-yellow-400 transition-all"
                      style={{ width: `${(selected.service_hours / HOURS_REQ) * 100}%` }} />
                  </div>
                </div>

                {[
                  { label: 'Major', value: selected.major },
                  { label: 'GPA', value: selected.gpa, warn: selected.gpa < GPA_REQ },
                  { label: 'Big brother', value: selected.big_bro },
                  { label: 'Phone', value: selected.phone },
                  { label: 'Attendance', value: `${selected.attendance_rate}%`, warn: selected.attendance_rate < ATTENDANCE_REQ },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-medium ${row.warn ? 'text-red-400' : 'text-white'}`}>{row.value}</span>
                  </div>
                ))}

                <div className="mt-4 flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-xs text-gray-500">Dues</span>
                  <button onClick={() => toggleDues(selected.id)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-all
                      ${selected.dues_paid
                        ? 'bg-green-400/10 text-green-400 hover:bg-red-400/10 hover:text-red-400'
                        : 'bg-red-400/10 text-red-400 hover:bg-green-400/10 hover:text-green-400'}`}>
                    {selected.dues_paid ? '✓ Paid — click to undo' : '✕ Unpaid — click to mark paid'}
                  </button>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tasks</div>
                  {taskLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <button onClick={() => toggleTask(selected.id, i)}
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 transition-all
                          ${selected.tasks[i]
                            ? 'bg-green-400/20 text-green-400 border border-green-400/40'
                            : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>
                        {selected.tasks[i] ? '✓' : ''}
                      </button>
                      <span className={`text-xs ${selected.tasks[i] ? 'text-gray-400 line-through' : 'text-white'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
                <div className="text-3xl mb-2">👆</div>
                <div className="text-sm">Click a pledge to manage their progress</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider"
            style={{ gridTemplateColumns: '200px repeat(5, 1fr)' }}>
            <div>Pledge</div>
            {taskLabels.map(t => <div key={t} className="text-center">{t}</div>)}
          </div>
          {pledges.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-500">No pledges yet.</div>
          ) : pledges.map(p => (
            <div key={p.id}
              className="grid px-4 py-3 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30 transition-all"
              style={{ gridTemplateColumns: '200px repeat(5, 1fr)' }}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.color}`}>{p.initials}</div>
                <div className="text-sm text-white font-medium truncate">{p.name}</div>
              </div>
              {p.tasks.map((done, i) => (
                <div key={i} className="flex justify-center">
                  <button onClick={() => toggleTask(p.id, i)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all
                      ${done ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-gray-800 text-gray-600 border border-gray-700 hover:border-yellow-400/30'}`}>
                    {done ? '✓' : '–'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'requirements' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-4">Chapter requirements</div>
            {[
              { label: 'Minimum GPA', value: `${GPA_REQ}.0`, met: pledges.filter(p => p.gpa >= GPA_REQ).length, total: pledges.length, color: 'bg-blue-400' },
              { label: 'Service hours', value: `${HOURS_REQ} hrs`, met: pledges.filter(p => p.service_hours >= HOURS_REQ).length, total: pledges.length, color: 'bg-yellow-400' },
              { label: 'Dues paid', value: '$175', met: paidCount, total: pledges.length, color: 'bg-green-400' },
              { label: 'Attendance rate', value: `${ATTENDANCE_REQ}%+`, met: pledges.filter(p => p.attendance_rate >= ATTENDANCE_REQ).length, total: pledges.length, color: 'bg-purple-400' },
              { label: 'All tasks complete', value: '5/5 tasks', met: pledges.filter(p => p.tasks.every(Boolean)).length, total: pledges.length, color: 'bg-cyan-400' },
            ].map(r => (
              <div key={r.label} className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white font-medium">{r.label}</span>
                  <span className="text-gray-400">{r.met}/{r.total} meeting requirement · {r.value}</span>
                </div>
                <div className="bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${r.color} transition-all duration-500`}
                    style={{ width: `${r.total > 0 ? (r.met / r.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-4">Initiation eligibility</div>
            <div className="text-xs text-gray-400 mb-4">Pledges who meet ALL requirements are eligible for initiation.</div>
            {pledges.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No pledges yet.</div>
            ) : pledges.map(p => {
              const eligible = p.gpa >= GPA_REQ && p.service_hours >= HOURS_REQ && p.dues_paid && p.attendance_rate >= ATTENDANCE_REQ && p.tasks.every(Boolean)
              const issues = [
                p.gpa < GPA_REQ && 'GPA below 3.0',
                p.service_hours < HOURS_REQ && `${HOURS_REQ - p.service_hours} hrs remaining`,
                !p.dues_paid && 'Dues unpaid',
                p.attendance_rate < ATTENDANCE_REQ && 'Attendance low',
                !p.tasks.every(Boolean) && `${p.tasks.filter(Boolean).length}/${p.tasks.length} tasks done`,
              ].filter(Boolean)
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.color}`}>{p.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{p.name}</div>
                    {!eligible && <div className="text-xs text-red-400 truncate">{issues.join(' · ')}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0
                    ${eligible ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {eligible ? '✓ Eligible' : 'Not yet'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
