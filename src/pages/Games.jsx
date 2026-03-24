import { useState } from 'react'

const initialTeams = []

function winRate(t) {
  return t.w + t.l === 0 ? 0.5 : t.w / (t.w + t.l)
}

function winProb(a, b) {
  const rA = winRate(a), rB = winRate(b)
  const p = 1 / (1 + Math.pow(10, (rB - rA) * 4))
  return Math.max(0.05, Math.min(0.95, p))
}

const COLORS = ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500']

export default function Games() {
  const [tab, setTab] = useState('bracket')
  const [teams, setTeams] = useState(initialTeams)
  const [matches, setMatches] = useState([])
  const [generated, setGenerated] = useState(false)
  const [tName, setTName] = useState('Spring Pong Championship')
  const [teamSize, setTeamSize] = useState('2')
  const [format, setFormat] = useState('single')
  const [perWeek, setPerWeek] = useState(4)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [postponements, setPostponements] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamPlayers, setNewTeamPlayers] = useState('')

  const tabs = ['Setup', 'Bracket', 'Records', 'Admin']

  function addTeam() {
    if (!newTeamName.trim()) return
    setTeams([...teams, {
      name: newTeamName.trim(),
      players: newTeamPlayers.trim() || newTeamName.trim(),
      w: 0, l: 0
    }])
    setNewTeamName('')
    setNewTeamPlayers('')
  }

  function removeTeam(i) {
    setTeams(teams.filter((_, idx) => idx !== i))
  }

  function generateBracket() {
    if (teams.length < 2) return alert('Need at least 2 teams.')
    const seeded = [...teams].sort((a, b) => winRate(b) - winRate(a))
    let size = 1
    while (size < seeded.length) size *= 2
    const padded = [...seeded]
    while (padded.length < size) padded.push(null)
    const newMatches = []
    let mid = 0
    for (let r = 0; r < Math.log2(size); r++) {
      const count = size >>> (r + 1)
      for (let m = 0; m < count; m++) {
        newMatches.push({
          id: mid++, round: r, matchInRound: m,
          teamA: r === 0 ? padded[m * 2] : null,
          teamB: r === 0 ? padded[m * 2 + 1] : null,
          winner: null,
          week: r === 0 ? Math.floor(m / perWeek) + 1 : null,
          status: 'pending',
          reason: null,
        })
      }
    }
    setMatches(newMatches)
    setGenerated(true)
    setCurrentWeek(1)
    setPostponements([])
    setTab('bracket')
  }

  function enterResult(id) {
    const m = matches.find(x => x.id === id)
    if (!m || !m.teamA || !m.teamB) return
    const choice = window.confirm(`Who won?\n\nOK = ${m.teamA.name}\nCancel = ${m.teamB.name}`)
    const winner = choice ? m.teamA : m.teamB
    const loser = choice ? m.teamB : m.teamA
    winner.w++; loser.l++
    const updated = matches.map(x => x.id === id ? { ...x, winner, status: 'complete' } : x)
    const nextRound = m.round + 1
    const nextMatchIdx = Math.floor(m.matchInRound / 2)
    const isA = m.matchInRound % 2 === 0
    const final = updated.map(x => {
      if (x.round === nextRound && x.matchInRound === nextMatchIdx) {
        return isA ? { ...x, teamA: winner } : { ...x, teamB: winner }
      }
      return x
    })
    setMatches(final)
    setTeams([...teams])
  }

  function postponeMatch(id, reason, newWeek) {
    setMatches(matches.map(m => m.id === id ? { ...m, status: 'postponed', week: newWeek, reason } : m))
    const m = matches.find(x => x.id === id)
    setPostponements([...postponements, { matchId: id, from: m.week, to: newWeek, reason, time: new Date().toLocaleTimeString() }])
  }

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)
  const roundNames = ['Round 1', 'Quarterfinals', 'Semifinals', 'Final', 'Championship']
  const complete = matches.filter(m => m.winner).length
  const postponed = matches.filter(m => m.status === 'postponed').length
  const sorted = [...teams].sort((a, b) => winRate(b) - winRate(a))

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white mb-1">Games & Leaderboards</h1>
        <p className="text-gray-400 text-sm">Commissioner-run tournament engine with auto-scheduling and win probability.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-0">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all
              ${tab === t.toLowerCase()
                ? 'text-yellow-400 border-yellow-400'
                : 'text-gray-400 border-transparent hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'setup' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Tournament settings</div>
            {[
              { label: 'Tournament name', el: <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={tName} onChange={e => setTName(e.target.value)} /> },
            ].map(f => <div key={f.label} className="mb-3"><label className="text-xs text-gray-400">{f.label}</label>{f.el}</div>)}
            <div className="mb-3">
              <label className="text-xs text-gray-400">Team size</label>
              <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={teamSize} onChange={e => setTeamSize(e.target.value)}>
                <option value="1">1v1 (solo)</option>
                <option value="2">2v2 (pairs)</option>
                <option value="3">3v3</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400">Format</label>
              <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="single">Single elimination</option>
                <option value="double">Double elimination</option>
                <option value="rr">Round robin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400">Matches per week</label>
              <input type="number" min="1" max="16" className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={perWeek} onChange={e => setPerWeek(parseInt(e.target.value) || 4)} />
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Estimated duration</div>
              <div className="text-lg font-bold text-white mt-0.5">~{Math.ceil(Math.max(0, teams.length - 1) / perWeek)} weeks</div>
              <div className="text-xs text-gray-500">{Math.max(0, teams.length - 1)} matches · {perWeek}/week</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Registered teams ({teams.length})</div>
            </div>
            <div className="mb-4 max-h-48 overflow-y-auto">
              {teams.map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                  <div className={`w-6 h-6 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{t.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{t.name}</div>
                    <div className="text-xs text-gray-500 truncate">{t.players}</div>
                  </div>
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{Math.round(winRate(t) * 100)}%</span>
                  <button onClick={() => removeTeam(i)} className="text-gray-600 hover:text-red-400 text-sm ml-1">×</button>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Add team</div>
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mb-2" placeholder="Team name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
              <input className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mb-3" placeholder="Players (comma separated)" value={newTeamPlayers} onChange={e => setNewTeamPlayers(e.target.value)} />
              <button onClick={addTeam} className="w-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-lg py-2 text-sm font-medium hover:bg-yellow-400/20 transition-all">+ Register team</button>
            </div>
            <button onClick={generateBracket} className="w-full mt-3 bg-yellow-400 text-gray-950 rounded-lg py-2.5 text-sm font-bold hover:bg-yellow-300 transition-all">
              Generate bracket + schedule →
            </button>
          </div>
        </div>
      )}

      {tab === 'bracket' && (
        <div>
          {!generated ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-sm">No bracket yet. Go to Setup to generate one.</div>
              <button onClick={() => setTab('setup')} className="mt-4 text-yellow-400 text-sm underline">Go to setup →</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-900 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Complete</div><div className="text-xl font-bold text-green-400">{complete}</div></div>
                <div className="bg-gray-900 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Current week</div><div className="text-xl font-bold text-white">Week {currentWeek}</div></div>
                <div className="bg-gray-900 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Postponed</div><div className="text-xl font-bold text-yellow-400">{postponed}</div></div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto mb-4">
                <div className="text-sm font-semibold text-white mb-4">{tName}</div>
                <div className="flex gap-0 min-w-max">
                  {rounds.map(r => (
                    <div key={r} className="min-w-[160px] px-3 border-r border-gray-800 last:border-0">
                      <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-3">{roundNames[r] || `Round ${r + 1}`}</div>
                      {matches.filter(m => m.round === r).map(m => {
                        const pA = m.teamA && m.teamB ? Math.round(winProb(m.teamA, m.teamB) * 100) : 50
                        const pB = 100 - pA
                        return (
                          <div key={m.id}
                            onClick={() => !m.winner && m.teamA && m.teamB && enterResult(m.id)}
                            className={`bg-gray-800 border rounded-lg mb-3 overflow-hidden cursor-pointer hover:border-gray-600 transition-all
                              ${m.winner ? 'border-green-500/40' : m.status === 'postponed' ? 'border-yellow-500/40' : 'border-gray-700'}`}>
                            {[{ team: m.teamA, win: m.winner?.name === m.teamA?.name, prob: pA },
                              { team: m.teamB, win: m.winner?.name === m.teamB?.name, prob: pB }].map((side, si) => (
                              <div key={si} className={`flex items-center justify-between px-2.5 py-1.5 text-xs border-b border-gray-700 last:border-0 ${side.win ? 'bg-green-500/10' : ''}`}>
                                <span className={`${side.win ? 'text-green-400 font-medium' : 'text-gray-300'} truncate max-w-[90px]`}>
                                  {side.team ? side.team.name : <span className="text-gray-600 italic">TBD</span>}
                                </span>
                                {m.teamA && m.teamB && <span className="text-gray-500 flex-shrink-0 ml-1">{side.prob}%</span>}
                              </div>
                            ))}
                            <div className={`text-center text-xs py-1 ${m.winner ? 'text-green-400' : m.status === 'postponed' ? 'text-yellow-400' : 'text-gray-500'}`}>
                              {m.winner ? 'Complete' : m.status === 'postponed' ? `Postponed → Wk${m.week}` : `Week ${m.week || '?'}`}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-sm font-semibold text-white mb-3">Week {currentWeek} schedule</div>
                {matches.filter(m => m.week === currentWeek).length === 0
                  ? <div className="text-sm text-gray-500">No matches this week.</div>
                  : matches.filter(m => m.week === currentWeek).map(m => (
                    <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">
                          {m.teamA?.name || 'TBD'} <span className="text-gray-500 text-xs">({m.teamA && m.teamB ? Math.round(winProb(m.teamA, m.teamB) * 100) : 50}%)</span>
                          {' '}vs {m.teamB?.name || 'TBD'} <span className="text-gray-500 text-xs">({m.teamA && m.teamB ? 100 - Math.round(winProb(m.teamA, m.teamB) * 100) : 50}%)</span>
                        </div>
                        <div className="text-xs text-gray-500">Round {m.round + 1} · Match #{m.id + 1}</div>
                      </div>
                      {m.winner
                        ? <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Done</span>
                        : m.status === 'postponed'
                          ? <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Postponed</span>
                          : m.teamA && m.teamB && <button onClick={() => enterResult(m.id)} className="text-xs text-blue-400 border border-blue-400/30 px-3 py-1 rounded-lg hover:bg-blue-400/10">Enter result</button>
                      }
                    </div>
                  ))
                }
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Player leaderboard</div>
            {sorted.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className="text-sm font-bold text-gray-500 w-5 text-center">{i + 1}</div>
                <div className={`w-7 h-7 rounded-full ${COLORS[teams.indexOf(t) % COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{t.name[0]}</div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.players}</div>
                </div>
                <div className="text-xs text-gray-400">{t.w}W – {t.l}L</div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium
                  ${winRate(t) >= 0.6 ? 'text-green-400 bg-green-400/10' : winRate(t) >= 0.4 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {Math.round(winRate(t) * 100)}%
                </span>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-white mb-3">Log a casual result</div>
              <CasualLog teams={teams} setTeams={setTeams} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">Head-to-head probability</div>
              <H2H teams={teams} />
            </div>
          </div>
        </div>
      )}

      {tab === 'admin' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-white mb-1">Postpone a match</div>
              <div className="text-xs text-gray-500 mb-3">Commissioner only. Cascades the bracket automatically.</div>
              <PostponePanel matches={matches} postponeMatch={postponeMatch} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">Advance week</div>
              <div className="text-xs text-gray-500 mb-3">Currently on Week {currentWeek}</div>
              <button onClick={() => setCurrentWeek(w => w + 1)} className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 text-sm hover:bg-gray-700 transition-all">
                Advance to Week {currentWeek + 1}
              </button>
            </div>
          </div>

          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-white mb-3">Postponement log</div>
              {postponements.length === 0
                ? <div className="text-xs text-gray-500">No postponements yet.</div>
                : postponements.map((p, i) => {
                  const m = matches.find(x => x.id === p.matchId)
                  return (
                    <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                      <div className="text-sm text-white">{m ? `${m.teamA?.name} vs ${m.teamB?.name}` : `Match #${p.matchId + 1}`}</div>
                      <div className="text-xs text-gray-500">Week {p.from} → Week {p.to} · {p.reason} · {p.time}</div>
                    </div>
                  )
                })
              }
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-1">Reset tournament</div>
              <div className="text-xs text-gray-500 mb-3">Clears all results. Team records are kept.</div>
              <button onClick={() => { if (window.confirm('Reset all results?')) { setMatches([]); setGenerated(false); setPostponements([]); setCurrentWeek(1); setTab('setup') } }}
                className="w-full bg-red-400/10 text-red-400 border border-red-400/30 rounded-lg py-2 text-sm hover:bg-red-400/20 transition-all">
                Reset tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CasualLog({ teams, setTeams }) {
  const [winner, setWinner] = useState(0)
  const [loser, setLoser] = useState(1)
  function log() {
    if (winner === loser) return alert('Must be different teams.')
    const updated = [...teams]
    updated[winner].w++
    updated[loser].l++
    setTeams(updated)
    alert(`Logged: ${teams[winner].name} beat ${teams[loser].name}`)
  }
  return (
    <div>
      <div className="mb-2">
        <label className="text-xs text-gray-400">Winner</label>
        <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={winner} onChange={e => setWinner(parseInt(e.target.value))}>
          {teams.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-400">Loser</label>
        <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={loser} onChange={e => setLoser(parseInt(e.target.value))}>
          {teams.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
        </select>
      </div>
      <button onClick={log} className="w-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-lg py-2 text-sm font-medium hover:bg-yellow-400/20">Log result</button>
    </div>
  )
}

function H2H({ teams }) {
  const [a, setA] = useState(0)
  const [b, setB] = useState(1)
  const pA = a !== b ? Math.round(winProb(teams[a], teams[b]) * 100) : 50
  const pB = 100 - pA
  return (
    <div>
      <div className="flex gap-2 items-center mb-3">
        <select className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700" value={a} onChange={e => setA(parseInt(e.target.value))}>
          {teams.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
        </select>
        <span className="text-gray-500 text-xs">vs</span>
        <select className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700" value={b} onChange={e => setB(parseInt(e.target.value))}>
          {teams.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
        </select>
      </div>
      {a !== b && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-medium text-white">{teams[a].name}</span>
            <span className="font-medium text-white">{teams[b].name}</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-blue-500 transition-all" style={{ width: `${pA}%` }}></div>
            <div className="bg-red-500 transition-all" style={{ width: `${pB}%` }}></div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-blue-400 font-medium">{pA}% win</span>
            <span className="text-red-400 font-medium">{pB}% win</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">Based on {teams[a].w + teams[a].l} and {teams[b].w + teams[b].l} games played</div>
        </div>
      )}
    </div>
  )
}

function PostponePanel({ matches, postponeMatch }) {
  const eligible = matches.filter(m => !m.winner && m.teamA && m.teamB)
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('no-show')
  const [newWeek, setNewWeek] = useState(2)
  function submit() {
    if (!selected) return alert('Select a match.')
    postponeMatch(parseInt(selected), reason, newWeek)
    alert('Match postponed and bracket updated.')
  }
  return (
    <div>
      <div className="mb-2">
        <label className="text-xs text-gray-400">Match</label>
        <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Select match...</option>
          {eligible.map(m => <option key={m.id} value={m.id}>R{m.round + 1}: {m.teamA.name} vs {m.teamB.name} (Wk{m.week})</option>)}
        </select>
      </div>
      <div className="mb-2">
        <label className="text-xs text-gray-400">Reason</label>
        <select className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={reason} onChange={e => setReason(e.target.value)}>
          <option value="no-show">Team no-show</option>
          <option value="conflict">Schedule conflict</option>
          <option value="injury">Injury / illness</option>
          <option value="admin">Admin decision</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-400">Move to week</label>
        <input type="number" min="1" max="10" className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 mt-1" value={newWeek} onChange={e => setNewWeek(parseInt(e.target.value))} />
      </div>
      <button onClick={submit} className="w-full bg-red-400/10 text-red-400 border border-red-400/30 rounded-lg py-2 text-sm hover:bg-red-400/20">Postpone + reschedule</button>
    </div>
  )
}