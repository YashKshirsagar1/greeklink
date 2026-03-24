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

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍']

const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'],
  'Gestures': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','👀','👁','👅','👄','💋'],
  'People': ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧝','🧛','🧟','🧞','🧜','🧚','🧑‍🎤','🧑‍🎨','🧑‍🏫','🧑‍🏭','🧑‍💻','🧑‍🔬','🧑‍🍳'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🦋','🐛','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦤','🦚','🦜','🦢','🦩'],
  'Food': ['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🫓','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫔','🌮','🌯','🥙','🧆','🥚','🍜','🍝','🍛','🍲','🫕','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹'],
  'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥍','🏑','🏏','🪃','🥅','⛳','🪁','🎣','🤿','🎽','🎿','🛷','🥌','🎯','🪀','🪆','🎮','🎲','🧩','🎭','🎨','🖼','🎰','🎳','🏋️','🤸','🤺','🤼','🤾','🏇','⛷️','🏂','🏌️','🏄','🚣','🧗','🚵','🚴','🏊','🤽','🧘','🛹','🛼','🛺','🛻','🚀','🛸','🪂'],
  'Objects': ['💡','🔦','🕯','🪔','💰','💳','💎','⚖️','🪝','🔧','🪛','🔨','⛏','🪚','🔩','🪤','🧲','🔫','💣','🪓','🔪','🗡','⚔️','🛡','🪃','🪖','📱','💻','⌨️','🖥','🖨','🖱','🖲','💾','💿','📀','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏰','🕰','⌚','📡','🔋','🔌','💡','🔦','🕯','🧯','🛢','💸','💵','💴','💶','💷'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏩','⏭','⏯','◀️','⏪','⏮','🔼','⏫','🔽','⏬','⏸','⏹','⏺','🎦','🔅','🔆','📶','📳','📴','📵','📳','🔇','🔈','🔉','🔊','📢','📣','📯','🔔','🔕','🃏','🀄','♟','🔇','🔕','🔛','🔜','🔝','✅','❎','🆗','🆙','🆒','🆕','🆓','🔟','🔠','🔡','🔢','🔣','🔤','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫'],
}

const GIPHY_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'

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
  const cancel = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const click = useCallback((e) => { if (isLongPress.current) e.preventDefault() }, [])
  return { onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel, onTouchStart: start, onTouchEnd: cancel, onClick: click }
}

function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [search, setSearch] = useState('')

  const filtered = search
    ? Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory] || []

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden" style={{ width: '320px' }}>
      <div className="p-2 border-b border-gray-800">
        <input
          autoFocus
          className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-500"
          placeholder="Search emoji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {!search && (
        <div className="flex overflow-x-auto border-b border-gray-800 px-1">
          {Object.keys(EMOJI_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                activeCategory === cat
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <div className="grid p-2 overflow-y-auto" style={{ gridTemplateColumns: 'repeat(8, 1fr)', maxHeight: '200px' }}>
        {filtered.map((emoji, i) => (
          <button
            key={i}
            onClick={() => { onSelect(emoji); onClose() }}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-800 rounded-lg transition-all hover:scale-110"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function GifPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGifs('trending') }, [])

  async function fetchGifs(query) {
    setLoading(true)
    try {
      const endpoint = query === 'trending'
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`
      const res = await fetch(endpoint)
      const data = await res.json()
      setGifs(data.data || [])
    } catch {
      setGifs([])
    }
    setLoading(false)
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    if (e.target.value.length > 1) fetchGifs(e.target.value)
    else if (e.target.value === '') fetchGifs('trending')
  }

  const suggestions = ['Excited', 'Party', 'Fire', 'Love', 'LOL', 'Win', 'Frat', 'Lets go', 'No way', 'Amazing']

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden" style={{ width: '340px' }}>
      <div className="p-2 border-b border-gray-800">
        <input
          autoFocus
          className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-500"
          placeholder="Search GIFs..."
          value={search}
          onChange={handleSearch}
        />
      </div>
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-gray-800">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => { setSearch(s); fetchGifs(s) }}
            className="flex-shrink-0 text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-8">Loading GIFs...</div>
        ) : gifs.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">No GIFs found</div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-2">
            {gifs.map(gif => (
              <div
                key={gif.id}
                onClick={() => { onSelect(gif.images.fixed_height.url); onClose() }}
                className="cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity aspect-video"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-800">
        <div className="text-xs text-gray-600 text-center">Powered by GIPHY</div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isMine, showSender, user, allMessages, onReact, onReply, onCopy, onUnsend }) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, side: 0 })
  const bubbleRef = useRef(null)
  const reactions = msg.reactions || {}
  const readBy = Array.isArray(msg.read_by) ? msg.read_by : []

  function getReplyMsg(id) {
    for (const msgs of Object.values(allMessages)) {
      const f = msgs.find(m => m.id === id)
      if (f) return f
    }
    return null
  }
  const replyMsg = msg.reply_to ? getReplyMsg(msg.reply_to) : null

  function openMenu(e) {
    e.preventDefault()
    const rect = bubbleRef.current?.getBoundingClientRect()
    if (rect) {
      const top = rect.top + window.scrollY
      setMenuPos({ top, side: isMine ? window.innerWidth - rect.right : rect.left })
    }
    setShowContextMenu(true)
    if (navigator.vibrate) navigator.vibrate(40)
  }

  const lp = useLongPress(openMenu, 500)

  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''} ${showSender ? 'mt-4' : 'mt-0.5'} relative`}>
      {!isMine && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${msg.sender_color || 'bg-gray-700 text-gray-300'} ${!showSender ? 'opacity-0' : ''}`}>
          {msg.sender_initials}
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {showSender && !isMine && (
          <div className="text-xs font-semibold text-gray-300 mb-1 ml-1">{msg.sender}</div>
        )}

        {replyMsg && (
          <div className="text-xs px-2.5 py-1.5 rounded-xl mb-1 bg-gray-800/60 border-l-2 border-yellow-400 text-gray-400 max-w-full">
            <span className="text-yellow-400 font-medium">{replyMsg.sender}</span>: {replyMsg.text?.slice(0, 60) || '📷 Media'}
          </div>
        )}

        <div
          ref={bubbleRef}
          {...lp}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          className={`relative rounded-2xl text-sm leading-relaxed cursor-pointer
            ${isMine
              ? 'rounded-tr-sm bg-yellow-400/25 text-white'
              : 'rounded-tl-sm bg-gray-800 text-gray-100'}
            ${msg.image_url || msg.gif_url ? 'p-1' : 'px-3.5 py-2.5'}`}
        >
          {msg.image_url && msg.message_type !== 'video' && (
            <img src={msg.image_url} alt="img"
              className="rounded-xl max-w-[260px] max-h-[280px] object-cover cursor-pointer block"
              onClick={() => window.open(msg.image_url, '_blank')} />
          )}
          {msg.image_url && msg.message_type === 'video' && (
            <video src={msg.image_url} controls className="rounded-xl max-w-[260px] max-h-[280px] block" />
          )}
          {msg.gif_url && (
            <img src={msg.gif_url} alt="gif" className="rounded-xl max-w-[260px] max-h-[220px] object-cover block" />
          )}
          {msg.text && (
            <div className={msg.image_url || msg.gif_url ? 'px-2 py-1 text-xs' : ''}>
              {msg.text.split(' ').map((word, i) =>
                isValidUrl(word)
                  ? <a key={i} href={word} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{word} </a>
                  : <span key={i}>{word} </span>
              )}
            </div>
          )}
        </div>

        {Object.keys(reactions).filter(e => reactions[e]?.length > 0).length > 0 && (
          <div className={`flex -mt-1 mb-0.5 z-10 ${isMine ? 'mr-1' : 'ml-1'}`}>
            <div className="flex items-center bg-gray-900 border border-gray-700 rounded-full px-2 py-0.5 gap-1 shadow-lg">
              {Object.entries(reactions).filter(([, u]) => u.length > 0).map(([emoji, users]) => (
                <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                  className={`text-sm transition-transform hover:scale-125 ${users.includes(user?.id) ? 'opacity-100' : 'opacity-60'}`}>
                  {emoji}
                </button>
              ))}
              <span className="text-xs text-gray-400 font-medium">
                {Object.values(reactions).flat().length}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-xs text-gray-600">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMine && (
            <span className={`text-xs ${readBy.length > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
              {readBy.length > 0 ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>

      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
          <div className="fixed z-50" style={{
            top: Math.max(10, menuPos.top - 120),
            ...(isMine ? { right: 16 } : { left: 16 }),
          }}>
            <div className="bg-gray-900 border border-gray-700 rounded-full px-3 py-2 flex gap-2 shadow-2xl mb-2">
              {QUICK_REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowContextMenu(false) }}
                  className="text-2xl hover:scale-130 transition-transform active:scale-95 leading-none">
                  {emoji}
                </button>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl min-w-[180px]">
              <button onClick={() => { onReply(msg); setShowContextMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-800 border-b border-gray-800">
                <span>↩</span> Reply
              </button>
              <button onClick={() => { navigator.clipboard.writeText(msg.text || ''); onCopy(); setShowContextMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-800 border-b border-gray-800">
                <span>📋</span> Copy
              </button>
              <button onClick={() => setShowContextMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-800 border-b border-gray-800">
                <span>↗️</span> Forward
              </button>
              {isMine && (
                <button onClick={() => { onUnsend(msg.id); setShowContextMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-800">
                  <span>🗑</span> Unsend
                </button>
              )}
            </div>
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [copyToast, setCopyToast] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const inputRef = useRef(null)

  const myName = user?.user_metadata?.full_name || user?.email || 'Unknown'
  const myInitials = myName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    loadAll()
    const sub = supabase
      .channel('realtime-messages-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        setAllMessages(prev => ({ ...prev, [msg.channel_id]: [...(prev[msg.channel_id] || []), msg] }))
        if (msg.user_id !== user?.id) markRead(msg)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        setAllMessages(prev => ({ ...prev, [msg.channel_id]: (prev[msg.channel_id] || []).map(m => m.id === msg.id ? msg : m) }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.old
        setAllMessages(prev => ({ ...prev, [msg.channel_id]: (prev[msg.channel_id] || []).filter(m => m.id !== msg.id) }))
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
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
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
    setShowEmojiPicker(false)
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

  async function unsendMessage(id) {
    await supabase.from('messages').delete().eq('id', id)
  }

  function handleCopy() {
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function insertEmoji(emoji) {
    setInput(prev => prev + emoji)
    inputRef.current?.focus()
  }

  const current = channels.find(c => c.id === activeChannel)
  const msgs = allMessages[activeChannel] || []

  const unreadCounts = {}
  channels.forEach(ch => {
    unreadCounts[ch.id] = (allMessages[ch.id] || []).filter(m => {
      const rb = Array.isArray(m.read_by) ? m.read_by : []
      return m.user_id !== user?.id && !rb.includes(user?.id)
    }).length
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

      {/* Sidebar */}
      <div className="w-72 min-w-[288px] bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white mb-3">Messages</div>
          <div className="relative">
            <input className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2 pl-8 outline-none placeholder-gray-600 border border-gray-700"
              placeholder="Search conversations..." />
            <span className="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.map(ch => {
            const chMsgs = allMessages[ch.id] || []
            const last = chMsgs[chMsgs.length - 1]
            const unread = unreadCounts[ch.id] || 0
            return (
              <div key={ch.id} onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-800/40 transition-all
                  ${activeChannel === ch.id ? 'bg-gray-800' : 'hover:bg-gray-800/40'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${ch.color}`}>
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className={`text-sm truncate ${unread > 0 ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>{ch.name}</div>
                    {last && <div className="text-xs text-gray-500 flex-shrink-0 ml-1">
                      {new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>}
                  </div>
                  <div className={`text-xs truncate ${unread > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                    {last ? (last.gif_url ? '🎬 GIF' : last.image_url ? '📷 Photo' : last.text?.slice(0, 38) || '...') : 'No messages yet'}
                  </div>
                </div>
                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {unread > 9 ? '9+' : unread}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-gray-950 relative">

        {copyToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full z-50 shadow-lg border border-gray-700">
            ✓ Copied to clipboard
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-3 bg-gray-900 flex-shrink-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold ${current.color}`}>
            {current.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{current.name}</div>
            <div className="text-xs text-green-400">Active now</div>
          </div>
          <button className="text-gray-400 hover:text-white text-xl px-2">📞</button>
          <button className="text-gray-400 hover:text-white text-xl px-2">🔍</button>
          <button className="text-gray-400 hover:text-white text-xl px-2">ℹ️</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
          {loading ? (
            <div className="text-center text-gray-600 text-sm mt-16">Loading messages...</div>
          ) : msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${current.color}`}>{current.icon}</div>
              <div className="text-white font-medium">{current.name}</div>
              <div className="text-gray-500 text-sm">No messages yet. Say something!</div>
            </div>
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

        {/* Pickers */}
        {(showEmojiPicker || showGifPicker) && (
          <div className="absolute bottom-20 left-4 z-50">
            {showEmojiPicker && (
              <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />
            )}
            {showGifPicker && (
              <GifPicker onSelect={url => send({ gif_url: url, text: '' })} onClose={() => setShowGifPicker(false)} />
            )}
          </div>
        )}

        {/* Reply preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center gap-2 flex-shrink-0">
            <div className="w-1 h-8 bg-yellow-400 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-yellow-400 font-medium">{replyingTo.sender}</div>
              <div className="text-xs text-gray-400 truncate">{replyingTo.text?.slice(0, 60) || '📷 Media'}</div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-800 bg-gray-900 flex-shrink-0">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'image')} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
            onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'video')} />

          <div className="flex gap-2 items-end">
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false) }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all
                  ${showEmojiPicker ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                😊
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}
                className="w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center text-lg transition-all">
                {uploadingMedia ? <span className="text-xs animate-pulse text-yellow-400">⏳</span> : '📷'}
              </button>
              <button onClick={() => videoInputRef.current?.click()} disabled={uploadingMedia}
                className="w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center text-lg transition-all">
                🎥
              </button>
              <button onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false) }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all
                  ${showGifPicker ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700'}`}>
                GIF
              </button>
            </div>

            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5 flex items-center">
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                placeholder={`Message ${current.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
            </div>

            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base transition-all flex-shrink-0
                ${input.trim() ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-gray-800 text-gray-600'}`}>
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}