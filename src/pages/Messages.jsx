import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const channels = [
  { id: 1, name: 'All Members', icon: 'ΣΑΕ', color: 'bg-yellow-400/20 text-yellow-400' },
  { id: 2, name: 'Exec Board', icon: 'EB', color: 'bg-blue-400/20 text-blue-400' },
  { id: 3, name: 'Pledge Class \'25', icon: 'PC', color: 'bg-purple-400/20 text-purple-400' },
  { id: 4, name: 'Risk & Safety', icon: 'RS', color: 'bg-red-400/20 text-red-400' },
  { id: 5, name: 'Social Committee', icon: 'SC', color: 'bg-green-400/20 text-green-400' },
  { id: 6, name: 'Rush Committee', icon: 'RU', color: 'bg-orange-400/20 text-orange-400' },
  { id: 7, name: 'Alumni Network', icon: 'AL', color: 'bg-gray-400/20 text-gray-400' },
]

export default function Messages() {
  const [activeChannel, setActiveChannel] = useState(1)
  const [allMessages, setAllMessages] = useState({})
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const { user } = useAuth()

  // Load all messages once on mount
  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      // Group by channel_id
      const grouped = {}
      channels.forEach(c => { grouped[c.id] = [] })
      ;(data || []).forEach(msg => {
        if (!grouped[msg.channel_id]) grouped[msg.channel_id] = []
        grouped[msg.channel_id].push(msg)
      })
      setAllMessages(grouped)
      setLoading(false)
    }
    loadAll()
  }, [])

  // Realtime subscription — new messages appear instantly
  useEffect(() => {
    const sub = supabase
      .channel('realtime-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, payload => {
        const msg = payload.new
        setAllMessages(prev => ({
          ...prev,
          [msg.channel_id]: [...(prev[msg.channel_id] || []), msg]
        }))
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, activeChannel])

  async function send() {
    if (!input.trim()) return
    const name = user?.user_metadata?.full_name || user?.email || 'Unknown'
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const msg = {
      channel_id: activeChannel,
      sender: name,
      sender_initials: initials,
      sender_color: 'bg-blue-400/20 text-blue-400',
      text: input.trim(),
      is_mine: false,
      user_id: user.id,
    }
    setInput('')
    await supabase.from('messages').insert(msg)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const current = channels.find(c => c.id === activeChannel)
  const msgs = allMessages[activeChannel] || []
  const lastMsg = (chId) => {
    const chMsgs = allMessages[chId] || []
    return chMsgs.length > 0 ? chMsgs[chMsgs.length - 1].text : 'No messages yet'
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 52px)' }}>

      {/* Channel list */}
      <div className="w-64 min-w-[256px] bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Messages</div>
          <button className="text-yellow-400 text-xs hover:text-yellow-300">+ New</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channels.map(ch => {
            const last = lastMsg(ch.id)
            return (
              <div
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-800/50 transition-all
                  ${activeChannel === ch.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${ch.color}`}>
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{ch.name}</div>
                  <div className="text-xs text-gray-500 truncate">{last.slice(0, 35)}{last.length > 35 ? '...' : ''}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-950">

        {/* Chat header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-3 bg-gray-900">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${current.color}`}>
            {current.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{current.name}</div>
            <div className="text-xs text-gray-500">
              {loading ? 'Loading...' : `${msgs.length} messages`}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
              Members
            </button>
            <button className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
              Pin
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {loading ? (
            <div className="text-center text-gray-600 text-sm mt-16">Loading messages...</div>
          ) : msgs.length === 0 ? (
            <div className="text-center text-gray-600 text-sm mt-16">No messages yet. Say something!</div>
          ) : (
            msgs.map(msg => {
              const isMine = msg.user_id === user?.id
              return (
                <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                  {!isMine && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${msg.sender_color || 'bg-gray-700 text-gray-300'}`}>
                      {msg.sender_initials}
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-medium text-white">{msg.sender}</span>
                      </div>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed
                      ${isMine
                        ? 'bg-yellow-400/20 text-yellow-100 rounded-tr-sm'
                        : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
              <input
                className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-500"
                placeholder={`Message ${current.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
            </div>
            <button
              onClick={send}
              className="w-9 h-9 rounded-xl bg-yellow-400 text-gray-900 flex items-center justify-center font-bold text-sm hover:bg-yellow-300 transition-all flex-shrink-0"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
