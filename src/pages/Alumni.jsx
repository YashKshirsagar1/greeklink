import { useState } from 'react'

const initialAlumni = [
  { id: 1, name: 'Sam Park', initials: 'SP', year: '18', company: 'Google', role: 'Software Engineer', location: 'San Francisco, CA', color: 'bg-blue-400/20 text-blue-400', hiring: true, mentor: true, industry: 'Tech', linkedin: '#', email: 'sam.park@gmail.com' },
  { id: 2, name: 'Ryan Kim', initials: 'RK', year: '20', company: 'Goldman Sachs', role: 'IB Analyst', location: 'New York, NY', color: 'bg-green-400/20 text-green-400', hiring: false, mentor: true, industry: 'Finance', linkedin: '#', email: 'ryan.kim@gs.com' },
  { id: 3, name: 'Jake Mills', initials: 'JM', year: '15', company: 'Sequoia Capital', role: 'VC Partner', location: 'Boston, MA', color: 'bg-purple-400/20 text-purple-400', hiring: false, mentor: true, industry: 'VC / PE', linkedin: '#', email: 'jake.mills@sequoia.com' },
  { id: 4, name: 'Tyler Brooks', initials: 'TB', year: '19', company: 'McKinsey', role: 'Consultant', location: 'Chicago, IL', color: 'bg-yellow-400/20 text-yellow-400', hiring: true, mentor: false, industry: 'Consulting', linkedin: '#', email: 'tyler.brooks@mckinsey.com' },
  { id: 5, name: 'Chris Evans', initials: 'CE', year: '17', company: 'SpaceX', role: 'Systems Engineer', location: 'Los Angeles, CA', color: 'bg-red-400/20 text-red-400', hiring: true, mentor: true, industry: 'Tech', linkedin: '#', email: 'chris.evans@spacex.com' },
  { id: 6, name: 'Matt Chen', initials: 'MC', year: '21', company: 'Citadel', role: 'Quant Analyst', location: 'Chicago, IL', color: 'bg-cyan-400/20 text-cyan-400', hiring: false, mentor: false, industry: 'Finance', linkedin: '#', email: 'matt.chen@citadel.com' },
  { id: 7, name: 'Alex Wong', initials: 'AW', year: '16', company: 'Meta', role: 'Product Manager', location: 'Seattle, WA', color: 'bg-orange-400/20 text-orange-400', hiring: true, mentor: true, industry: 'Tech', linkedin: '#', email: 'alex.wong@meta.com' },
  { id: 8, name: 'Derek Patel', initials: 'DP', year: '22', company: 'Deloitte', role: 'Associate', location: 'New York, NY', color: 'bg-pink-400/20 text-pink-400', hiring: false, mentor: true, industry: 'Consulting', linkedin: '#', email: 'derek.patel@deloitte.com' },
]

const jobs = [
  { id: 1, title: 'Software Engineering Intern', company: 'Google', postedBy: 'Sam Park \'18', industry: 'Tech', location: 'San Francisco, CA', deadline: 'Apr 1', type: 'Internship', referral: true },
  { id: 2, title: 'IB Analyst — Full Time', company: 'Goldman Sachs', postedBy: 'Ryan Kim \'20', industry: 'Finance', location: 'New York, NY', deadline: 'Mar 31', type: 'Full-time', referral: true },
  { id: 3, title: 'VC Fellowship', company: 'Sequoia Capital', postedBy: 'Jake Mills \'15', industry: 'VC / PE', location: 'Boston, MA', deadline: 'Apr 15', type: 'Fellowship', referral: false },
  { id: 4, title: 'Business Analyst Intern', company: 'McKinsey', postedBy: 'Tyler Brooks \'19', industry: 'Consulting', location: 'Chicago, IL', deadline: 'Apr 5', type: 'Internship', referral: true },
  { id: 5, title: 'Systems Engineer', company: 'SpaceX', postedBy: 'Chris Evans \'17', industry: 'Tech', location: 'Los Angeles, CA', deadline: 'Apr 20', type: 'Full-time', referral: false },
  { id: 6, title: 'Product Manager — New Grad', company: 'Meta', postedBy: 'Alex Wong \'16', industry: 'Tech', location: 'Seattle, WA', deadline: 'Mar 28', type: 'Full-time', referral: true },
]

const industries = ['All', 'Tech', 'Finance', 'Consulting', 'VC / PE']

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
  const [newAlumni, setNewAlumni] = useState({ name: '', year: '', company: '', role: '', industry: 'Tech', location: '' })
  const [alumni, setAlumni] = useState(initialAlumni)

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function applyJob(id) {
    if (appliedJobs.includes(id)) return
    setAppliedJobs([...appliedJobs, id])
    toast('Application submitted!')
  }

  function handleDonate() {
    setShowDonate(false)
    toast(`Thank you! $${donateAmount} donation recorded.`)
  }

  function handleAddAlumni() {
    if (!newAlumni.name.trim()) return
    const initials = newAlumni.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = ['bg-blue-400/20 text-blue-400', 'bg-green-400/20 text-green-400', 'bg-purple-400/20 text-purple-400', 'bg-yellow-400/20 text-yellow-400']
    setAlumni([...alumni, {
      id: Date.now(),
      name: newAlumni.name.trim(),
      initials,
      year: newAlumni.year,
      company: newAlumni.company || 'Unknown',
      role: newAlumni.role || 'Unknown',
      location: newAlumni.location || 'Unknown',
      color: colors[alumni.length % colors.length],
      hiring: false,
      mentor: false,
      industry: newAlumni.industry,
      linkedin: '#',
      email: '',
    }])
    setNewAlumni({ name: '', year: '', company: '', role: '', industry: 'Tech', location: '' })
    setShowAddAlumni(false)
    toast('Alumni added!')
  }

  const filteredAlumni = alumni.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
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
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Alumni Network</h1>
          <p className="text-gray-400 text-sm">{alumni.length} alumni · Class of 2010–2024</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDonate(true)}
            className="bg-gray-800 text-gray-300 border border-gray-700 px-4 py-2 rounded-xl text-sm hover:text-white hover:border-gray-600 transition-all">
            💰 Donate to chapter
          </button>
          <button onClick={() => setShowAddAlumni(true)}
            className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all">
            + Add alumni
          </button>
        </div>
      </div>

      {/* Toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ {successMsg}
        </div>
      )}

      {/* Donate modal */}
      {showDonate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-1">Donate to chapter</div>
            <div className="text-sm text-gray-400 mb-5">Support ΣΑΕ Alpha Chapter</div>
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
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={handleDonate}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">
                Donate ${donateAmount} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add alumni modal */}
      {showAddAlumni && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Add alumni</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Full name</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. John Smith" value={newAlumni.name} onChange={e => setNewAlumni({ ...newAlumni, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Graduation year</label>
                <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                  placeholder="e.g. 23" value={newAlumni.year} onChange={e => setNewAlumni({ ...newAlumni, year: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Industry</label>
                <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700"
                  value={newAlumni.industry} onChange={e => setNewAlumni({ ...newAlumni, industry: e.target.value })}>
                  {industries.filter(i => i !== 'All').map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Company</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. Google" value={newAlumni.company} onChange={e => setNewAlumni({ ...newAlumni, company: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Role</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. Software Engineer" value={newAlumni.role} onChange={e => setNewAlumni({ ...newAlumni, role: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Location</label>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. San Francisco, CA" value={newAlumni.location} onChange={e => setNewAlumni({ ...newAlumni, location: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddAlumni(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={handleAddAlumni}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">Add →</button>
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

      {tab === 'directory' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {/* Filters */}
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
                <div className={`w-3 h-3 rounded-full ${hiringOnly ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                Hiring only
              </button>
              <button onClick={() => setMentorOnly(!mentorOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${mentorOnly ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                <div className={`w-3 h-3 rounded-full ${mentorOnly ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                Mentors only
              </button>
              <span className="text-xs text-gray-500 self-center ml-auto">{filteredAlumni.length} alumni shown</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredAlumni.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlumni(selectedAlumni?.id === a.id ? null : a)}
                  className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all
                    ${selectedAlumni?.id === a.id ? 'border-yellow-400/40' : 'border-gray-800 hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${a.color}`}>
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{a.name}</div>
                      <div className="text-xs text-gray-500">Class of '{ a.year}</div>
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
          </div>

          {/* Detail panel */}
          <div>
            {selectedAlumni ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold ${selectedAlumni.color}`}>
                    {selectedAlumni.initials}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">{selectedAlumni.name}</div>
                    <div className="text-xs text-gray-500">Class of '{selectedAlumni.year}</div>
                  </div>
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

                <div className="flex gap-1.5 mt-3 mb-4">
                  {selectedAlumni.hiring && <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded">Hiring</span>}
                  {selectedAlumni.mentor && <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded">Available to mentor</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => toast(`Message sent to ${selectedAlumni.name}!`)}
                    className="w-full bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all">
                    Message {selectedAlumni.name.split(' ')[0]}
                  </button>
                  <button onClick={() => toast('LinkedIn opened!')}
                    className="w-full bg-blue-400/10 text-blue-400 border border-blue-400/30 rounded-xl py-2.5 text-sm hover:bg-blue-400/20 transition-all">
                    View LinkedIn →
                  </button>
                  {selectedAlumni.mentor && (
                    <button onClick={() => toast(`Mentorship request sent to ${selectedAlumni.name}!`)}
                      className="w-full bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:text-white transition-all">
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

      {tab === 'jobs' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['All', ...industries.filter(i => i !== 'All')].map(ind => (
              <button key={ind} onClick={() => setJobFilter(ind)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                  ${jobFilter === ind ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                {ind}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredJobs.map(j => (
              <div key={j.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{j.title}</div>
                    <div className="text-xs text-gray-400">{j.company} · {j.location}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ml-2
                    ${j.type === 'Internship' ? 'bg-blue-400/10 text-blue-400'
                      : j.type === 'Fellowship' ? 'bg-purple-400/10 text-purple-400'
                      : 'bg-green-400/10 text-green-400'}`}>
                    {j.type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{j.industry}</span>
                  {j.referral && <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">Referral available</span>}
                  <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Due {j.deadline}</span>
                </div>

                <div className="text-xs text-gray-500 mb-3">Posted by {j.postedBy}</div>

                <button
                  onClick={() => applyJob(j.id)}
                  disabled={appliedJobs.includes(j.id)}
                  className={`w-full py-2 rounded-lg text-xs font-medium transition-all
                    ${appliedJobs.includes(j.id)
                      ? 'bg-green-400/10 text-green-400 border border-green-400/30 cursor-default'
                      : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'}`}>
                  {appliedJobs.includes(j.id) ? '✓ Applied' : 'Apply now →'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gray-900 border border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-yellow-400/40 transition-all cursor-pointer"
            onClick={() => toast('Job posting form coming soon!')}>
            <div className="text-sm text-gray-500">Are you an alumni hiring? <span className="text-yellow-400">Post a job →</span></div>
          </div>
        </div>
      )}

      {tab === 'fundraising' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-white mb-4">Active campaigns</div>
              {[
                { title: 'House renovation fund', goal: 50000, raised: 32400, donors: 48, deadline: 'Jun 1' },
                { title: 'Scholarship endowment', goal: 25000, raised: 18750, donors: 31, deadline: 'Dec 31' },
                { title: 'Philanthropy matching', goal: 5000, raised: 2100, donors: 14, deadline: 'Apr 30' },
              ].map((c, i) => {
                const pct = Math.round((c.raised / c.goal) * 100)
                return (
                  <div key={i} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{c.title}</span>
                      <span className="text-gray-500">Due {c.deadline}</span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-2.5 mb-1.5 overflow-hidden">
                      <div className="h-2.5 rounded-full bg-yellow-400 transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-400 font-medium">${c.raised.toLocaleString()} raised</span>
                      <span className="text-gray-500">{pct}% of ${c.goal.toLocaleString()} · {c.donors} donors</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => setShowDonate(true)}
              className="w-full bg-yellow-400 text-gray-900 font-bold rounded-xl py-3 text-sm hover:bg-yellow-300 transition-all">
              💰 Make a donation →
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-4">Recent donors</div>
            {[
              { name: 'Sam Park \'18', amount: 500, campaign: 'House renovation', date: '2d ago' },
              { name: 'Jake Mills \'15', amount: 2500, campaign: 'Scholarship endowment', date: '5d ago' },
              { name: 'Tyler Brooks \'19', amount: 250, campaign: 'Philanthropy matching', date: '1wk ago' },
              { name: 'Anonymous', amount: 100, campaign: 'House renovation', date: '1wk ago' },
              { name: 'Chris Evans \'17', amount: 1000, campaign: 'Scholarship endowment', date: '2wk ago' },
              { name: 'Matt Chen \'21', amount: 50, campaign: 'Philanthropy matching', date: '2wk ago' },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0">
                  {d.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{d.name}</div>
                  <div className="text-xs text-gray-500">{d.campaign} · {d.date}</div>
                </div>
                <div className="text-sm font-bold text-green-400 flex-shrink-0">+${d.amount}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}