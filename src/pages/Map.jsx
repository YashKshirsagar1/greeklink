import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const LOCATION_TYPES = {
  main: { color: '#D4AF37', label: 'Chapter house', symbol: 'Σ' },
  offcampus: { color: '#4A9EFF', label: 'Off-campus', symbol: 'H' },
  dorm: { color: '#888780', label: 'Dorm', symbol: 'D' },
  custom: { color: '#A78BFA', label: 'Custom', symbol: '★' },
  bar: { color: '#F97316', label: 'Bar / venue', symbol: 'B' },
  food: { color: '#22C55E', label: 'Food', symbol: 'F' },
}

const MAP_CENTER = [40.4444, -79.9428]

function createLocationIcon(type) {
  const t = LOCATION_TYPES[type] || LOCATION_TYPES.custom
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;
      background:${t.color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,0.5);
      border:2px solid rgba(255,255,255,0.4);
    "><span style="transform:rotate(45deg);color:white;font-size:13px;font-weight:700;line-height:1">${t.symbol}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  })
}

function createMemberIcon(initials, colorClass, isMe) {
  const hexMap = {
    yellow: '#D4AF37', green: '#22C55E', blue: '#4A9EFF',
    purple: '#A78BFA', red: '#EF4444', cyan: '#22D3EE',
  }
  const hex = Object.entries(hexMap).find(([k]) => colorClass.includes(k))?.[1] || '#4A9EFF'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:38px;height:38px;
      background:${hex}25;
      border:2.5px solid ${isMe ? '#D4AF37' : '#22C55E'};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;color:${hex};
      box-shadow:0 3px 10px rgba(0,0,0,0.5);
      font-family:sans-serif;
      position:relative;
    ">
      ${initials}
      <div style="
        position:absolute;bottom:-1px;right:-1px;
        width:11px;height:11px;
        background:#22C55E;border-radius:50%;
        border:2px solid #0D0C10;
      "></div>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -24],
  })
}

function MapClickHandler({ addingPin, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (addingPin) onMapClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function Map() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [locations, setLocations] = useState([])
  const [myMember, setMyMember] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddPin, setShowAddPin] = useState(false)
  const [newPin, setNewPin] = useState({ name: '', address: '', type: 'custom' })
  const [addingPin, setAddingPin] = useState(false)
  const [pendingLatLng, setPendingLatLng] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const watchRef = useRef(null)

  useEffect(() => {
    fetchAll()
    const membersSub = supabase
      .channel('map-members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => fetchMembers())
      .subscribe()
    const locationsSub = supabase
      .channel('map-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_locations' }, () => fetchLocations())
      .subscribe()
    return () => {
      supabase.removeChannel(membersSub)
      supabase.removeChannel(locationsSub)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  async function fetchAll() {
    await Promise.all([fetchMembers(), fetchLocations()])
    setLoading(false)
  }

  async function fetchMembers() {
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
    const me = (data || []).find(m => m.user_id === user?.id)
    setMyMember(me)
    setSharing(me?.location_sharing || false)
    setIsAdmin(me?.is_admin || false)
    if (me?.location_sharing) setLocationStatus('active')
  }

  async function fetchLocations() {
    const { data } = await supabase.from('map_locations').select('*').order('created_at')
    setLocations(data || [])
  }

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  async function toggleSharing() {
    if (!myMember) return
    if (!sharing) {
      setLocationStatus('requesting')
      if (!navigator.geolocation) { setLocationStatus('error'); return }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          await supabase.from('members').update({
            location_sharing: true,
            latitude,
            longitude,
            location_updated_at: new Date().toISOString(),
          }).eq('id', myMember.id)
          setSharing(true)
          setLocationStatus('active')
          toast('Location sharing on — your pin is live!')
          watchRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
              await supabase.from('members').update({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                location_updated_at: new Date().toISOString(),
              }).eq('id', myMember.id)
            },
            null,
            { enableHighAccuracy: true, maximumAge: 15000 }
          )
        },
        () => {
          setLocationStatus('denied')
          alert('Location denied. Click the lock icon in the address bar → Site settings → Allow Location.')
        },
        { enableHighAccuracy: true }
      )
    } else {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      await supabase.from('members').update({
        location_sharing: false, latitude: null, longitude: null,
      }).eq('id', myMember.id)
      setSharing(false)
      setLocationStatus('idle')
      toast('Location sharing off.')
    }
  }

  function handleMapClick(lat, lng) {
    setPendingLatLng({ lat, lng })
    setShowAddPin(true)
    setAddingPin(false)
  }

  async function savePin() {
    if (!newPin.name.trim()) return
    await supabase.from('map_locations').insert({
      name: newPin.name.trim(),
      address: newPin.address.trim(),
      type: newPin.type,
      latitude: pendingLatLng?.lat || MAP_CENTER[0],
      longitude: pendingLatLng?.lng || MAP_CENTER[1],
      x_pos: 50,
      y_pos: 50,
      added_by: user?.id,
    })
    setShowAddPin(false)
    setNewPin({ name: '', address: '', type: 'custom' })
    setPendingLatLng(null)
    toast('Pin added to map!')
  }

  async function deletePin(id) {
    await supabase.from('map_locations').delete().eq('id', id)
    toast('Pin removed.')
  }

  const sharingMembers = members.filter(m => m.location_sharing && m.latitude && m.longitude)
  const memberColors = [
    'bg-yellow-400/30 text-yellow-400',
    'bg-green-400/30 text-green-400',
    'bg-blue-400/30 text-blue-400',
    'bg-purple-400/30 text-purple-400',
    'bg-red-400/30 text-red-400',
    'bg-cyan-400/30 text-cyan-400',
  ]

  function getMemberColor(member) {
    const idx = members.findIndex(m => m.id === member.id)
    return memberColors[idx % memberColors.length]
  }

  function getTimeAgo(ts) {
    if (!ts) return 'Unknown'
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading map...</div>

  return (
    <div className="p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Map & Locations</h1>
          <p className="text-gray-400 text-sm">Live member locations and chapter landmarks.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddingPin(!addingPin)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${addingPin
                ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white'}`}
          >
            {addingPin ? '📍 Click map to place pin' : '+ Add pin'}
          </button>
        )}
      </div>

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-[9999]">
          ✓ {successMsg}
        </div>
      )}

      {addingPin && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-400">
          📍 Click anywhere on the map to drop a pin
        </div>
      )}

      {showAddPin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Add map pin</div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. Jake's apartment"
                value={newPin.name}
                onChange={e => setNewPin({ ...newPin, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Address (optional)</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none"
                placeholder="e.g. 123 Main St"
                value={newPin.address}
                onChange={e => setNewPin({ ...newPin, address: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700"
                value={newPin.type}
                onChange={e => setNewPin({ ...newPin, type: e.target.value })}
              >
                {Object.entries(LOCATION_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            {pendingLatLng && (
              <div className="text-xs text-gray-500 mb-4 bg-gray-800 rounded-lg px-3 py-2">
                📍 {pendingLatLng.lat.toFixed(5)}, {pendingLatLng.lng.toFixed(5)}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddPin(false); setPendingLatLng(null) }}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={savePin}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all"
              >
                Add pin →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="rounded-xl overflow-hidden mb-4 border border-gray-800" style={{ height: '480px' }}>
            <MapContainer
              center={MAP_CENTER}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <MapClickHandler addingPin={addingPin} onMapClick={handleMapClick} />

              {locations.map(loc => (
                loc.latitude && loc.longitude ? (
                  <Marker
                    key={loc.id}
                    position={[loc.latitude, loc.longitude]}
                    icon={createLocationIcon(loc.type)}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'sans-serif', minWidth: '140px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{loc.name}</div>
                        {loc.address && <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>📍 {loc.address}</div>}
                        <div style={{ fontSize: '11px', color: '#aaa' }}>{LOCATION_TYPES[loc.type]?.label}</div>
                        {isAdmin && (
                          <button
                            onClick={() => deletePin(loc.id)}
                            style={{ marginTop: '8px', fontSize: '11px', color: '#ef4444', background: 'none', border: '1px solid #ef444440', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              ))}

              {sharingMembers.map(m => (
                <Marker
                  key={m.id}
                  position={[m.latitude, m.longitude]}
                  icon={createMemberIcon(m.initials, getMemberColor(m), m.user_id === user?.id)}
                >
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', minWidth: '140px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                        {m.name} {m.user_id === user?.id ? '(you)' : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{m.role}</div>
                      <div style={{ fontSize: '11px', color: '#22c55e' }}>● Live location</div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                        Updated {getTimeAgo(m.location_updated_at)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Saved locations ({locations.length})</div>
              {isAdmin && (
                <button onClick={() => setAddingPin(true)} className="text-yellow-400 text-xs hover:text-yellow-300">
                  + Add location
                </button>
              )}
            </div>
            {locations.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                {isAdmin ? 'Click "+ Add pin" to add your first location.' : 'Admin will add locations soon.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {locations.map(loc => {
                  const t = LOCATION_TYPES[loc.type] || LOCATION_TYPES.custom
                  return (
                    <div key={loc.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold"
                        style={{ background: t.color + '25', color: t.color }}>
                        {t.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{loc.name}</div>
                        <div className="text-xs text-gray-500 truncate">{loc.address || t.label}</div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => deletePin(loc.id)} className="text-gray-600 hover:text-red-400 text-sm transition-all">×</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-3">My location</div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-800">
              <div>
                <div className="text-sm text-white">Share my location</div>
                <div className="text-xs text-gray-500 mt-0.5">Visible to all chapter members</div>
              </div>
              <button
                onClick={toggleSharing}
                className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${sharing ? 'bg-yellow-400' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${sharing ? 'left-5' : 'left-1'}`}></div>
              </button>
            </div>
            <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
              locationStatus === 'active' ? 'bg-green-400/10 text-green-400' :
              locationStatus === 'requesting' ? 'bg-yellow-400/10 text-yellow-400' :
              locationStatus === 'denied' ? 'bg-red-400/10 text-red-400' :
              'bg-gray-800 text-gray-500'
            }`}>
              {locationStatus === 'active' ? '● Live — your pin is on the map' :
               locationStatus === 'requesting' ? '⏳ Requesting GPS...' :
               locationStatus === 'denied' ? '✕ Denied — check browser settings' :
               '⏸ Location sharing off'}
            </div>
            {locationStatus === 'denied' && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-800 rounded-lg p-2 leading-relaxed">
                Click the 🔒 lock icon → Site settings → Location → Allow
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Live locations</div>
              <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded font-medium">
                {sharingMembers.length} sharing
              </span>
            </div>
            {sharingMembers.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-600 text-sm mb-2">No one sharing yet</div>
                <div className="text-xs text-gray-600 leading-relaxed">Toggle location sharing above to appear on the map</div>
              </div>
            ) : (
              sharingMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getMemberColor(m)}`}>
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {m.name}{m.user_id === user?.id ? ' (you)' : ''}
                    </div>
                    <div className="text-xs text-gray-500">{getTimeAgo(m.location_updated_at)}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                </div>
              ))
            )}
            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 text-center">
              {members.filter(m => !m.location_sharing).length} members not sharing
            </div>
          </div>

          {isAdmin && (
            <div className="bg-gray-900 border border-yellow-400/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-yellow-400 mb-3">Admin — member status</div>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getMemberColor(m)}`}>
                    {m.initials}
                  </div>
                  <div className="flex-1 text-sm text-white">{m.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${m.location_sharing ? 'bg-green-400/10 text-green-400' : 'bg-gray-800 text-gray-600'}`}>
                    {m.location_sharing ? 'Live' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
