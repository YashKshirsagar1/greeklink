import { useState, useEffect, useRef, useCallback } from 'react'
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

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍']

const GIF_SUGGESTIONS = [
  { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', label: 'Excited' },
  { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'Party' },
  { url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', label: 'Lets go' },
  { url: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif', label: 'Nice' },
  { url: 'https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif', label: 'Wow' },
  { url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', label: 'Fire' },
]

function isValidUrl(str) {
  try { return Boolean(new URL(str)) } catch { return false }
}

function useLongPress(onLongPress, ms = 500) {
  const timerRef = useRef(null)
  const isLongPress = useRef(false)

  const start = useCallback((e) => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress(e)
    }, ms)
  }, [onLongPress, ms])

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const click = useCallback((e) => {
    if (isLongPress.current) e.preventDefault()
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onClick: click,
  }
}

function MessageBubble({ msg, isMine, showSender, user, members, allMessages, onReact, onReply, onCopy, onUnsend }) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const bubbleRef = useRef(null)

  const reactions = msg.reactions || {}
  const readBy = Array.isArray(msg.read_by) ? msg.read_by : []

  function getReplyMsg(replyId) {
    for (const chMsgs of Object.values(allMessages)) {
      const found = chMsgs.find(m => m.id === replyId)
      if (found) return found
    }
    return null
  }
  const replyMsg = msg.reply_to ? getReplyMsg(msg.reply_to) : null

  function openMenu(e) {
    e.preventDefault()
    const rect = bubbleRef.current?.getBoundingClientRect()
    setMenuPos({ x: rect?.left || 0, y: rect?.top || 0 })
    setShowContextMenu(true)
    setShowReactionPicker(false)
    if (navigator.vibrate) navigator.vibrate(50)
  }

  const longPressHandlers = useLongPress(openMenu, 500)

  function closeAll() {
    setShowContextMenu(false)
    setShowReactionPicker(false)
  }

  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''} ${showSender ? 'mt-4' : 'mt-0.5'} relative`}>
      {!isMine && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${msg.sender_color || 'bg-gray-700 text-gray-300'} ${!showSender ? 'opacity-0' : ''}`}>
          {msg.sender_initials}
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {showSender && !isMine && (
          <div className="text-xs font-medium text-white mb-1 ml-1">{msg.sender}</div>
        )}

        {/* Reply preview */}
        {replyMsg && (
          <div className={`text-xs px-2 py-1 rounded-lg mb-1 border-l-2 border-yellow-400 bg-gray-800/50 text-gray-400 max-w-full truncate`}>
            ↩ {replyMsg.sender}: {replyMsg.text?.slice(0, 50) || '📷 Media'}
          </div>
        )}

        {/* Bubble */}
        <div
          ref={bubbleRef}
          {...longPressHandlers}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          className={`relative rounded-2xl text-sm leading-relaxed cursor-pointer select-none
            ${isMine ? 'rounded-tr-sm bg-yellow-400/20 text-yellow-100' : 'rounded-tl-sm bg-gray-800 text-gray-100'}
            ${msg.image_url || msg.gif_url ? 'p-1 overflow-hidden' : 'px-3.5 py-2'}`}
        >
          {msg.image_url && msg.message_type !== 'video' && (
            <img src={msg.image_url} alt="shared"
              className="rounded-xl max-w-[280px] max-h-[300px] object-cover cursor-pointer"
              onClick={() => window.open(msg.image_url, '_blank')} />
          )}
          {msg.image_url && msg.message_type === 'video' && (
            <video src={msg.image_url} controls className="rounded-xl max-w-[280px] max-h-[300px]" />
          )}
          {msg.gif_url && (
            <img src={msg.gif_url} alt="gif" className="rounded-xl max-w-[280px] max-h-[250px] object-cover" />
          )}
          {msg.text && (
            <div className={msg.image_url || msg.gif_url ? 'px-2 py-1 text-xs' : ''}>
              {msg.text.split(' ').map((word, i) => (
                isValidUrl(word)
                  ? <a key={i} href={word} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{word} </a>
                  : <span key={i}>{word} </span>
              ))}
            </div>
          )}
        </div>

        {/* Reaction bubbles — Facebook style floating below */}
        {Object.keys(reactions).length > 0 && (
          <div className={`flex gap-0.5 -mt-2 mb-1 z-10 ${isMine ? 'mr-2' : 'ml-2'}`}>
            <div className="flex items-center bg-gray-900 border border-gray-700 rounded-full px-1.5 py-0.5 gap-0.5 shadow-lg">
              {Object.entries(reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(msg.id, emoji)}
                  className={`text-sm transition-transform hover:scale-125 ${users.includes(user?.id) ? 'opacity-100' : 'opacity-70'}`}
                >
                  {emoji}
                </button>
              ))}
              {Object.values(reactions).flat().length > 0 && (
                <span className="text-xs text-gray-400 ml-0.5">
                  {Object.values(reactions).flat().length}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Time + read receipt */}
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <div className="text-xs text-gray-600">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {isMine && (
            <div className="text-xs">
              {readBy.length > 0
                ? <span className="text-blue-400">✓✓</span>
                : <span className="text-gray-600">✓</span>}
            </div>
          )}
        </div>
      </div>

      {/* Facebook-style reaction + context menu overlay */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />

          {/* Reaction bar — floats above the message */}
          <div className={`fixed z-50 bg-gray-900 border border-gray-700 rounded-full px-3 py-2 flex gap-2 shadow-2xl`}
            style={{
              bottom: `calc(100vh - ${menuPos.y}px + 8px)`,
              ...(isMine ? { right: '80px' } : { left: '60px' }),
            }}>
            {EMOJI_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onReact(msg.id, emoji); closeAll() }}
                className="text-2xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Action menu below reactions */}
          <div className={`fixed z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-w-[200px]`}
            style={{
              bottom: `calc(100vh - ${menuPos.y}px - 120px)`,
              ...(isMine ? { right: '80px' } : { left: '60px' }),
            }}>
            <button
              onClick={() => { onReply(msg); closeAll() }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-800 transition-all border-b border-gray-800"
            >
              <span className="text-base">↩</span> Reply
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(msg.text || ''); onCopy(); closeAll() }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-800 transition-all border-b border-gray-800"
            >
              <span className="text-base">📋</span> Copy
            </button>
            {isMine && (
              <button
                onClick={() => { onUnsend(msg.id); closeAll() }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-all"
              >
                <span className="text-base">🗑</span> Unsend
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const [activeChannel, setActiveChannel] = useState(1)
  const [allMessages, setAllMessages] = useState({})
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [copyToast, setCopyToast] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const myName = user?.user_metadata?.full_name || user?.email || 'Unknown'
  const myInitials = myName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    loadAll()
    const sub = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        setAllMessages(prev => ({
          ...prev,
          [msg.channel_id]: [...(prev[msg.channel_id] || []), msg]
        }))
        if (msg.user_id !== user?.id) markRead(msg)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        setAllMessages(prev => ({
          ...prev,
          [msg.channel_id]: (prev[msg.channel_id] || []).map(m => m.id === msg.id ? msg : m)
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.old
        setAllMessages(prev => ({
          ...prev,
          [msg.channel_id]: (prev[msg.channel_id] || []).filter(m => m.id !== msg.id)
        }))
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, activeChannel])

  useEffect(() => {
    const msgs = allMessages[activeChannel] || []
    msgs.filter(m => m.user_id !== user?.id).forEach(m => markRead(m))
  }, [activeChannel, allMessages])

  async function loadAll() {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    const grouped = {}
    channels.forEach(c => { grouped[c.id] = [] })
    ;(data || []).forEach(msg => {
      if (!grouped[msg.channel_id]) grouped[msg.channel_id] = []
      grouped[msg.channel_id].push(msg)
    })
    setAllMessages(grouped)
    setLoading(false)
  }

  async function markRead(msg) {
    if (!user || msg.user_id === user.id) return
    const readBy = Array.isArray(msg.read_by) ? msg.read_by : []
    if (readBy.includes(user.id)) return
    await supabase.from('messages').update({ read_by: [...readBy, user.id] }).eq('id', msg.id)
  }

  async function send(overrides = {}) {
    const text = input.trim()
    if (!text && !overrides.image_url && !overrides.gif_url) return
    const msg = {
      channel_id: activeChannel,
      sender: myName,
      sender_initials: myInitials,
      sender_color: 'bg-yellow-400/20 text-yellow-400',
      text: text || '',
      is_mine: false,
      user_id: user?.id,
      reactions: {},
      read_by: [],
      reply_to: replyingTo?.id || null,
      message_type: overrides.gif_url ? 'gif' : overrides.image_url ? 'image' : 'text',
      ...overrides,
    }
    setInput('')
    setReplyingTo(null)
    setShowGifPicker(false)
    await supabase.from('messages').insert(msg)
  }

  async function uploadFile(file, type) {
    setUploadingMedia(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('message-media').upload(path, file, { contentType: file.type })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('message-media').getPublicUrl(path)
      await send({ image_url: urlData.publicUrl, text: '', message_type: type })
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploadingMedia(false)
  }

  async function addReaction(msgId, emoji) {
    const allMsgs = Object.values(allMessages).flat()
    const msg = allMsgs.find(m => m.id === msgId)
    if (!msg) return
    const reactions = { ...(msg.reactions || {}) }
    if (!reactions[emoji]) reactions[emoji] = []
    const idx = reactions[emoji].indexOf(user.id)
    if (idx > -1) reactions[emoji].splice(idx, 1)
    else reactions[emoji].push(user.id)
    if (reactions[emoji].length === 0) delete reactions[emoji]
    await supabase.from('messages').update({ reactions }).eq('id', msgId)
  }

  async function unsendMessage(msgId) {
    await supabase.from('messages').delete().eq('id', msgId)
  }

  function handleCopy() {
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const current = channels.find(c => c.id === activeChannel)
  const msgs = allMessages[activeChannel] || []

  const unreadCounts = {}
  channels.forEach(ch => {
    const chMsgs = allMessages[ch.id] || []
    unreadCounts[ch.id] = chMsgs.filter(m => {
      const readBy = Array.isArray(m.read_by) ? m.read_by : []
      return m.user_id !== user?.id && !readBy.includes(user?.id)
    }).length
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

      {/* Channel list */}
      <div className="w-64 min-w-[256px] bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Messages</div>
          <button className="text-yellow-400 text-xs hover:text-yellow-300">+ New</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.map(ch => {
            const chMsgs = allMessages[ch.id] || []
            const last = chMsgs[chMsgs.length - 1]
            const unread = unreadCounts[ch.id] || 0
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
                  <div className="flex items-center justify-between mb-0.5">
                    <div className={`text-sm truncate ${unread > 0 ? 'font-semibold text-white' : 'font-medium text-white'}`}>{ch.name}</div>
                    {last && <div className="text-xs text-gray-500 flex-shrink-0 ml-1">
                      {new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {last
                      ? (last.gif_url ? '🎬 GIF' : last.image_url ? '📷 Image' : last.text?.slice(0, 35) || '...')
                      : 'No messages yet'}
                  </div>
                </div>
                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {unread}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-gray-950 relative">

        {/* Copy toast */}
        {copyToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full z-50 shadow-lg">
            Copied to clipboard
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-3 bg-gray-900 flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${current.color}`}>
            {current.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{current.name}</div>
            <div className="text-xs text-gray-500">{msgs.length} messages</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
              Members
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col">
          {loading ? (
            <div className="text-center text-gray-600 text-sm mt-16">Loading...</div>
          ) : msgs.length === 0 ? (
            <div className="text-center text-gray-600 text-sm mt-16">No messages yet. Say something!</div>
          ) : (
            msgs.map((msg, idx) => {
              const isMine = msg.user_id === user?.id
              const prevMsg = msgs[idx - 1]
              const showSender = !isMine && (!prevMsg || prevMsg.user_id !== msg.user_id)
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMine={isMine}
                  showSender={showSender}
                  user={user}
                  allMessages={allMessages}
                  onReact={addReaction}
                  onReply={setReplyingTo}
                  onCopy={handleCopy}
                  onUnsend={unsendMessage}
                />
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* GIF picker */}
        {showGifPicker && (
          <div className="px-4 py-3 border-t border-gray-800 bg-gray-900 flex-shrink-0">
            <div className="text-xs text-gray-400 mb-2">Send a GIF</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {GIF_SUGGESTIONS.map((gif, i) => (
                <div key={i} className="flex-shrink-0 cursor-pointer" onClick={() => send({ gif_url: gif.url, text: '' })}>
                  <img src={gif.url} alt={gif.label} className="w-24 h-16 object-cover rounded-lg hover:opacity-80" />
                  <div className="text-xs text-gray-500 text-center mt-1">{gif.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 text-xs text-gray-400 border-l-2 border-yellow-400 pl-2">
              Replying to <span className="text-white font-medium">{replyingTo.sender}</span>: {replyingTo.text?.slice(0, 60) || '📷 Media'}
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900 flex-shrink-0">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'image')} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
            onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'video')} />

          <div className="flex gap-2 items-end">
            <div className="flex gap-1">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}
                className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                title="Image">
                {uploadingMedia ? <span className="text-xs animate-pulse">...</span> : '📷'}
              </button>
              <button onClick={() => videoInputRef.current?.click()} disabled={uploadingMedia}
                className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                title="Video">
                🎥
              </button>
              <button onClick={() => setShowGifPicker(!showGifPicker)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-all
                  ${showGifPicker ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                GIF
              </button>
            </div>

            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
              <input
                className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-500"
                placeholder={`Message ${current.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
            </div>

            <button onClick={() => send()}
              className="w-9 h-9 rounded-xl bg-yellow-400 text-gray-900 flex items-center justify-center font-bold text-sm hover:bg-yellow-300 transition-all flex-shrink-0">
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}