import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin() {
    if (!email || !password) return setError('Please fill in all fields.')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup() {
    if (!email || !password || !name) return setError('Please fill in all fields.')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) setError(error.message)
    else setSuccess('Account created! You can now log in.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="text-yellow-400 font-bold text-xl tracking-tight">Touse</div>
          <div className="text-gray-500 text-xs mt-0.5 uppercase tracking-widest">Chapter OS</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex gap-1 mb-6 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === 'login' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-white'}`}>
              Sign in
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === 'signup' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-white'}`}>
              Sign up
            </button>
          </div>

          {mode === 'signup' && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Full name</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="Jake D."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
              placeholder="jake@pitt.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />
          </div>

          <div className="mb-5">
            <label className="text-xs text-gray-400 mb-1 block">Password</label>
            <input
              type="password"
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />
          </div>

          {error && (
            <div className="bg-red-400/10 border border-red-400/30 text-red-400 text-xs px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-400/10 border border-green-400/30 text-green-400 text-xs px-3 py-2 rounded-lg mb-4">
              {success}
            </div>
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full bg-yellow-400 text-gray-900 font-bold rounded-xl py-3 text-sm hover:bg-yellow-300 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
          </button>
        </div>

        <div className="text-center mt-4 text-xs text-gray-600">
          ΣΑΕ Alpha Chapter · Spring 2025
        </div>
      </div>
    </div>
  )
}