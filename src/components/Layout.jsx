import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const navItems = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Messages', path: '/messages', icon: '💬' },
  { label: 'Map', path: '/map', icon: '📍' },
  { label: 'Dues', path: '/dues', icon: '💳' },
  { label: 'Games', path: '/games', icon: '🏆' },
  { label: 'Drive', path: '/drive', icon: '📁' },
  { label: 'PNMs & Rush', path: '/pnm', icon: '⭐' },
  { label: 'Pledges', path: '/pledges', icon: '🎗️' },
  { label: 'Risk Mgmt', path: '/risk', icon: '⚖️' },
  { label: 'Alumni', path: '/alumni', icon: '🎓' },
]

export default function Layout() {
  const location = useLocation()
  const { user } = useAuth()
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    async function getCount() {
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
      setMemberCount(count || 0)
    }
    getCount()
  }, [])

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="w-52 min-w-[208px] bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="text-yellow-400 font-bold text-xl tracking-tight">GreekLink</div>
          <div className="text-gray-500 text-xs mt-0.5 uppercase tracking-widest">Chapter OS</div>
        </div>

        <div className="mx-3 my-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-2 text-yellow-400 text-xs font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
          ΣΑΕ · {memberCount} members
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {navItems.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                  ${isActive
                    ? 'bg-yellow-400/10 text-yellow-400 border-l-2 border-yellow-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 border-l-2 border-transparent'
                  }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 text-xs font-bold">
            {user?.user_metadata?.full_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user?.user_metadata?.full_name || user?.email}
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-gray-500 hover:text-red-400 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}