import { useState } from 'react'

const industries = ['All', 'Tech', 'Finance', 'Consulting', 'VC / PE', 'Healthcare', 'Other']

export default function Alumni() {
  const [tab, setTab] = useState('directory')
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('All')
  const [hiringOnly, setHiringOnly] = useState(false)
  const [mentorOnly, setMentorOnly] = useState(false)
  const [selectedAlumni, setSelectedAlumni] = useState(null)
  const [jobFilter, setJobFilter] = useState('All')
  const [appliedJobs, setAppliedJobs] = useState([])
  const [showDonate, setShowDonate] = useState(false)
  const [donateAmount, setDonateAmount] = useState('50')
  const [successMsg, setSuccessMsg] = useState('')
  const [showAddAlumni, setShowAddAlumni] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)
  const [alumni, setAlumni] = useState([])
  const [jobs, setJobs] = useState([])
  const [newAlumni, setNewAlumni] = useState({
    name: '', year: '', company: '', role: '',
    industry: 'Tech', location: '', email: '',
    hiring: false, mentor: false,
  })
  const [newJob, setNewJob] = useState({
    title: '', company: '', location: '',
    industry: 'Tech', type: 'Full-time',
    deadline: '', referral: false,
  })

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function handleAddAlumni() {
    if (!newAlumni.name.trim()) return
    const initials = newAlumni.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = [
      'bg-blue-400/20 text-blue-400', 'bg-green-400/20 text-green-400',
      'bg-purple-400/20 text-purple-400', 'bg-yellow-400/20 text-yellow-400',
      'bg-red-400/20 text-red-400', 'bg-cyan-400/20 text-cyan-400',
      'bg-orange-400/20 text-orange-400', 'bg-pink-400/20 text-pink-400',
    ]
    setAlumni(prev => [...prev, {
      id: Date.now(),
      name: newAlumni.name.trim(),
      initials,
      year: newAlumni.year,
      company: newAlumni.company || '—',
      role: newAlumni.role || '—',
      location: newAlumni.location || '—',
      email: newAlumni.email || '',
      color: colors[prev.length % colors.length],
      hiring: newAlumni.hiring,
      mentor: newAlumni.mentor,
      industry: newAlumni.industry,
    }])
    setNewAlumni({ name: '', year: '', company: '', role: '', industry: 'Tech', location: '', email: '', hiring: false, mentor: false })
    setShowAddAlumni(false)
    toast('Alumni added!')
  }

  function handleAddJob() {
    if (!newJob.title.trim()) return
    setJobs(prev => [...prev, {
      id: Date.now(),
      title: newJob.title.trim(),
      company: newJob.company || '—',
      location: newJob.location || '—',
      industry: newJob.industry,
      type: newJob.type,
      deadline: newJob.deadline || 'Open',
      referral: newJob.referral,
      postedBy: 'Alumni',
    }])
    setNewJob({ title: '', company: '', location: '', industry: 'Tech', type: 'Full-time', deadline: '', referral: false })
    setShowAddJob(false)
    toast('Job posted!')
  }

  function handleDonate() {
    setShowDonate(false)
    toast(`Thank you! $${donateAmount} donation recorded.`)
  }

  function applyJob(id) {
    if (appliedJobs.includes(id)) return
    setAppliedJobs(prev => [...prev, id])
    toast('Application submitted!')
  }

  function deleteAlumni(id) {
    if (!confirm('Remove this alumni?')) return
    setAlumni(prev => prev.filter(a => a.id !== id))
    setSelectedAlumni(null)
    toast('Alumni removed.')
  }

  function deleteJob(id) {
    setJobs(prev => prev.filter(j => j.id !== id))
    toast('Job removed.')
  }

  const filteredAlumni = alumni.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = industryFilter === 'All' || a.industry === industryFilter
    const matchHiring = !hiringOnly || a.hiring
    const matchMentor = !mentorOnly || a.mentor
    return matchSearch && matchIndustry && matchHiring && matchMentor
  })

  const filteredJobs = jobs.filter(j => jobFilter === 'All' || j.industry === jobFilter)

  return (
    <div className="p-6">

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ {successMsg}
        </div>
      )}

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Alumni Network</h1>
          <p className="text-gray-400 text-sm">{alumni.length} alumni registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddAlumni(true)}
            className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all">
            + Add alumni
          </button>
        </div>
      </div>

      {/* Add alumni modal */}
      {showAddAlumni && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="text-base font-bold text-white">Add Alumni</div>
              <button onClick={() => setShowAddAlumni(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full name *</label>
                <input autoFocus
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                  placeholder="e.g. John Smith"
                  value={newAlumni.name}
                  onChange={e => setNewAlumni({ ...newAlumni, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Graduation year</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="e.g. 23"
                    value={newAlumni.year}
                    onChange={e => setNewAlumni({ ...newAlumni, year: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Industry</label>
                  <select className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700"
                    value={newAlumni.industry} onChange={e => setNewAlumni({ ...newAlumni, industry: e.target.value })}>
                    {industries.filter(i => i !== 'All').map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Company</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="e.g. Google"
                    value={newAlumni.company}
                    onChange={e => setNewAlumni({ ...newAlumni, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Role</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="e.g. Software Engineer"
                    value={newAlumni.role}
                    onChange={e => setNewAlumni({ ...newAlumni, role: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Location</label>
                <input
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="e.g. San Francisco, CA"
                  value={newAlumni.location}
                  onChange={e => setNewAlumni({ ...newAlumni, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="e.g. john@google.com"
                  value={newAlumni.email}
                  onChange={e => setNewAlumni({ ...newAlumni, email: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newAlumni.hiring}
                    onChange={e => setNewAlumni({ ...newAlumni, hiring: e.target.checked })}
                    className="w-4 h-4 accent-yellow-400" />
                  <span className="text-sm text-gray-300">Currently hiring</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newAlumni.mentor}
                    onChange={e => setNewAlumni({ ...newAlumni, mentor: e.target.checked })}
                    className="w-4 h-4 accent-yellow-400" />
                  <span className="text-sm text-gray-300">Available to mentor</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowAddAlumni(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleAddAlumni}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Add alumni →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add job modal */}
      {showAddJob && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="text-base font-bold text-white">Post a Job</div>
              <button onClick={() => setShowAddJob(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Job title *</label>
                <input autoFocus
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                  placeholder="e.g. Software Engineer Intern"
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Company</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="e.g. Google"
                    value={newJob.company}
                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Location</label>
                  <input
                    className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                    placeholder="e.g. New York, NY"
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Industry</label>
                  <select className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700"
                    value={newJob.industry} onChange={e => setNewJob({ ...newJob, industry: e.target.value })}>
                    {industries.filter(i => i !== 'All').map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700"
                    value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value })}>
                    {['Full-time', 'Internship', 'Fellowship', 'Part-time'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Application deadline</label>
                <input
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="e.g. Apr 30"
                  value={newJob.deadline}
                  onChange={e => setNewJob({ ...newJob, deadline: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newJob.referral}
                  onChange={e => setNewJob({ ...newJob, referral: e.target.checked })}
                  className="w-4 h-4 accent-yellow-400" />
                <span className="text-sm text-gray-300">Referral available</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowAddJob(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleAddJob}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Post job →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donate modal */}
      {showDonate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-base font-bold text-white mb-1">Donate to chapter</div>
            <div className="text-sm text-gray-400 mb-5">Support the chapter</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['25', '50', '100', '250'].map(amt => (
                <button key={amt} onClick={() => setDonateAmount(amt)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all
                    ${donateAmount === amt ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
                  ${amt}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Custom amount</label>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                <span className="text-gray-400 mr-1">$</span>
                <input className="flex-1 bg-transparent text-white text-sm outline-none"
                  value={donateAmount} onChange={e => setDonateAmount(e.target.value)} type="number" min="1" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Designate to (optional)</label>
              <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700">
                <option>General fund</option>
                <option>Scholarship fund</option>
                <option>House improvements</option>
                <option>Philanthropy events</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDonate(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleDonate}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                Donate ${donateAmount} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total alumni', value: alumni.length, color: 'text-white' },
          { label: 'Currently hiring', value: alumni.filter(a => a.hiring).length, color: 'text-green-400' },
          { label: 'Available mentors', value: alumni.filter(a => a.mentor).length, color: 'text-blue-400' },
          { label: 'Jobs posted', value: jobs.length, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {[
          { key: 'directory', label: 'Directory' },
          { key: 'jobs', label: 'Job board' },
          { key: 'fundraising', label: 'Fundraising' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all
              ${tab === t.key ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Directory */}
      {tab === 'directory' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="flex gap-2 mb-4 flex-wrap">
              <input
                className="bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-yellow-400/50 placeholder-gray-600 flex-1 min-w-[160px]"
                placeholder="Search alumni..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {industries.map(ind => (
                <button key={ind} onClick={() => setIndustryFilter(ind)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${industryFilter === ind ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                  {ind}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={() => setHiringOnly(!hiringOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${hiringOnly ? 'bg-green-400/10 text-green-400 border-green-400/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                <div className={`w-3 h-3 rounded-full ${hiringOnly ? 'bg-green-400' : 'bg-gray-600'}`} />
                Hiring only
              </button>
              <button onClick={() => setMentorOnly(!mentorOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${mentorOnly ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                <div className={`w-3 h-3 rounded-full ${mentorOnly ? 'bg-blue-400' : 'bg-gray-600'}`} />
                Mentors only
              </button>
              <span className="text-xs text-gray-500 self-center ml-auto">{filteredAlumni.length} alumni shown</span>
            </div>

            {filteredAlumni.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🎓</div>
                <div className="text-gray-400 text-sm mb-4">No alumni yet. Add your first one!</div>
                <button onClick={() => setShowAddAlumni(true)}
                  className="bg-yellow-400 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-300">
                  + Add first alumni
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredAlumni.map(a => (
                  <div key={a.id}
                    onClick={() => setSelectedAlumni(selectedAlumni?.id === a.id ? null : a)}
                    className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all
                      ${selectedAlumni?.id === a.id ? 'border-yellow-400/40' : 'border-gray-800 hover:border-gray-700'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${a.color}`}>
                        {a.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.year ? `Class of '${a.year}` : 'Alumni'}</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-white mb-0.5">{a.role}</div>
                    <div className="text-xs text-gray-500 mb-2">{a.company} · {a.location}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{a.industry}</span>
                      {a.hiring && <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded">Hiring</span>}
                      {a.mentor && <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded">Mentor</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {selectedAlumni ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${selectedAlumni.color}`}>
                    {selectedAlumni.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-white">{selectedAlumni.name}</div>
                    <div className="text-xs text-gray-500">{selectedAlumni.year ? `Class of '${selectedAlumni.year}` : 'Alumni'}</div>
                  </div>
                  <button onClick={() => deleteAlumni(selectedAlumni.id)}
                    className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-lg hover:bg-red-400/20 flex-shrink-0">
                    Remove
                  </button>
                </div>

                {[
                  { label: 'Company', value: selectedAlumni.company },
                  { label: 'Role', value: selectedAlumni.role },
                  { label: 'Industry', value: selectedAlumni.industry },
                  { label: 'Location', value: selectedAlumni.location },
                  { label: 'Email', value: selectedAlumni.email || 'Not listed' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className="text-xs font-medium text-white text-right max-w-[150px] truncate">{row.value}</span>
                  </div>
                ))}

                <div className="flex gap-1.5 mt-3 mb-4 flex-wrap">
                  {selectedAlumni.hiring && <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded">Hiring</span>}
                  {selectedAlumni.mentor && <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded">Available to mentor</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => toast(`Message sent to ${selectedAlumni.name}!`)}
                    className="w-full bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300">
                    Message {selectedAlumni.name.split(' ')[0]}
                  </button>
                  {selectedAlumni.mentor && (
                    <button onClick={() => toast(`Mentorship request sent to ${selectedAlumni.name}!`)}
                      className="w-full bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:text-white">
                      Request mentorship
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
                <div className="text-3xl mb-2">👆</div>
                <div className="text-sm">Click an alumni to view their profile and connect</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job board */}
      {tab === 'jobs' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {['All', ...industries.filter(i => i !== 'All')].map(ind => (
                <button key={ind} onClick={() => setJobFilter(ind)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                    ${jobFilter === ind ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                  {ind}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddJob(true)}
              className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 flex-shrink-0">
              + Post job
            </button>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">💼</div>
              <div className="text-gray-400 text-sm mb-4">No jobs posted yet.</div>
              <button onClick={() => setShowAddJob(true)}
                className="bg-yellow-400 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-300">
                + Post first job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredJobs.map(j => (
                <div key={j.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white mb-0.5 truncate">{j.title}</div>
                      <div className="text-xs text-gray-400">{j.company} · {j.location}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium
                        ${j.type === 'Internship' ? 'bg-blue-400/10 text-blue-400'
                          : j.type === 'Fellowship' ? 'bg-purple-400/10 text-purple-400'
                          : 'bg-green-400/10 text-green-400'}`}>
                        {j.type}
                      </span>
                      <button onClick={() => deleteJob(j.id)}
                        className="text-gray-600 hover:text-red-400 text-sm transition-all">×</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{j.industry}</span>
                    {j.referral && <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">Referral available</span>}
                    {j.deadline && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Due {j.deadline}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Posted by {j.postedBy}</div>
                  <button onClick={() => applyJob(j.id)} disabled={appliedJobs.includes(j.id)}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all
                      ${appliedJobs.includes(j.id)
                        ? 'bg-green-400/10 text-green-400 border border-green-400/30 cursor-default'
                        : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'}`}>
                    {appliedJobs.includes(j.id) ? '✓ Applied' : 'Apply now →'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fundraising */}
      {tab === 'fundraising' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
              <div className="text-sm font-semibold text-white mb-4">Active campaigns</div>
              <div className="text-center py-8 text-gray-600 text-sm">
                No campaigns yet. Contact your alumni coordinator to set one up.
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Recent donors</div>
            <div className="text-center py-8 text-gray-600 text-sm">
              No donations recorded yet.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
