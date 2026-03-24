import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const LOCATION_TYPES = {
  main: { color: '#D4AF37', label: 'Chapter house', symbol: 'Σ' },
  offcampus: { color: '#4A9EFF', label: 'Off-campus', symbol: 'H' },
  dorm: { color: '#888780', label: 'Dorm', symbol: 'D' },
  custom: { color: '#A78BFA', label: 'Custom', symbol: '★' },
  bar: { color: '#F97316', label: 'Bar / venue', symbol: 'B' },
  food: { color: '#22C55E', label: 'Food', symbol: 'F' },
}

const MAP_CENTER = { lat: 40.4444, lng: -79.9428 }
const MAP_SCALE = 800

function latLngToPercent(lat, lng) {
  const x = 50 + (lng - MAP_CENTER.lng) * MAP_SCALE
  const y = 50 - (lat - MAP_CENTER.lat) * MAP_SCALE
  return { x, y }
}

function percentToLatLng(x, y) {
  const lng = MAP_CENTER.lng + (x - 50) / MAP_SCALE
  const lat = MAP_CENTER.lat - (y - 50) / MAP_SCALE
  return { lat, lng }
}

export default function Map() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [locations, setLocations] = useState([])
  const [myMember, setMyMember] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddPin, setShowAddPin] = useState(false)
  const [newPin, setNewPin] = useState({ name: '', address: '', type: 'custom' })
  const [addingPin, setAddingPin] = useState(false)
  const [pendingPin, setPendingPin] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const mapRef = useRef(null)
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
      if (!navigator.geolocation) {
        setLocationStatus('error')
        alert('Geolocation is not supported by your browser.')
        return
      }

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
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
          )
        },
        (err) => {
          setLocationStatus('denied')
          if (err.code === 1) {
            alert('Location permission denied. In Chrome: click the lock icon in the address bar → Site settings → Allow Location.')
          } else {
            alert('Could not get your location. Please try again.')
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      await supabase.from('members').update({
        location_sharing: false,
        latitude: null,
        longitude: null,
      }).eq('id', myMember.id)
      setSharing(false)
      setLocationStatus('idle')
      toast('Location sharing turned off.')
    }
  }

  function handleMapClick(e) {
    if (!addingPin) return
    const rect = mapRef.current.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    const { lat, lng } = percentToLatLng(xPct, yPct)
    setPendingPin({ x: Math.round(xPct), y: Math.round(yPct), lat, lng })
    setShowAddPin(true)
    setAddingPin(false)
  }

  async function savePin() {
    if (!newPin.name.trim()) return
    await supabase.from('map_locations').insert({
      name: newPin.name.trim(),
      address: newPin.address.trim(),
      type: newPin.type,
      x_pos: pendingPin?.x || 50,
      y_pos: pendingPin?.y || 50,
      latitude: pendingPin?.lat || MAP_CENTER.lat,
      longitude: pendingPin?.lng || MAP_CENTER.lng,
      added_by: user?.id,
    })
    setShowAddPin(false)
    setNewPin({ name: '', address: '', type: 'custom' })
    setPendingPin(null)
    toast('Pin added to map!')
  }

  async function deletePin(id) {
    await supabase.from('map_locations').delete().eq('id', id)
    setSelectedLocation(null)
    toast('Pin removed.')
  }

  const sharingMembers = members.filter(m => m.location_sharing && m.latitude && m.longitude)
  const onlineCount = sharingMembers.length

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
            onClick={() => { setAddingPin(!addingPin); setSelectedMember(null); setSelectedLocation(null) }}
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
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ {successMsg}
        </div>
      )}

      {addingPin && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-400">
          📍 Click anywhere on the map below to place your pin
        </div>
      )}

      {showAddPin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
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
            {pendingPin && (
              <div className="text-xs text-gray-500 mb-4 bg-gray-800 rounded-lg px-3 py-2">
                📍 Coordinates: {pendingPin.lat?.toFixed(4)}, {pendingPin.lng?.toFixed(4)}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddPin(false); setPendingPin(null) }}
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

          {/* Map canvas */}
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className={`border border-gray-800 rounded-xl overflow-hidden mb-4 relative ${addingPin ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ height: '460px' }}
          >
            {/* OpenStreetMap background */}
            <iframe
              title="map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${MAP_CENTER.lng - 0.02},${MAP_CENTER.lat - 0.015},${MAP_CENTER.lng + 0.02},${MAP_CENTER.lat + 0.015}&layer=mapnik`}
              className="absolute inset-0 w-full h-full"
              style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(0.9)', pointerEvents: addingPin ? 'none' : 'auto' }}
            />

            {/* Dark overlay for contrast */}
            <div className="absolute inset-0" style={{ background: 'rgba(13,12,16,0.15)', pointerEvents: 'none' }} />

            {/* Location pins */}
            {locations.map(loc => {
              const t = LOCATION_TYPES[loc.type] || LOCATION_TYPES.custom
              const pos = loc.latitude && loc.longitude
                ? latLngToPercent(loc.latitude, loc.longitude)
                : { x: loc.x_pos, y: loc.y_pos }

              if (pos.x < 1 || pos.x > 99 || pos.y < 1 || pos.y > 99) return null

              return (
                <div
                  key={loc.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -100%)', zIndex: 10 }}
                  onClick={e => { e.stopPropagation(); setSelectedLocation(loc); setSelectedMember(null) }}
                >
                  <div
                    className="w-8 h-8 rounded-full rounded-bl-none flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                    style={{ background: t.color, transform: 'rotate(-45deg)' }}
                  >
                    <span style={{ transform: 'rotate(45deg)' }} className="text-white text-xs font-bold">{t.symbol}</span>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-900/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    {loc.name}
                    {loc.address && <div className="text-gray-400">{loc.address}</div>}
                  </div>
                </div>
              )
            })}

            {/* Member dots with real GPS */}
            {sharingMembers.map(m => {
              const isMe = m.user_id === user?.id
              const color = getMemberColor(m)
              const pos = latLngToPercent(m.latitude, m.longitude)

              if (pos.x < 1 || pos.x > 99 || pos.y < 1 || pos.y > 99) return null

              return (
                <div
                  key={m.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 20 }}
                  onClick={e => { e.stopPropagation(); setSelectedMember(m); setSelectedLocation(null) }}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-transform group-hover:scale-125 shadow-lg ${color} ${isMe ? 'border-yellow-400' : 'border-green-400'}`}>
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-950"></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    {m.name}{isMe ? ' (you)' : ''}
                  </div>
                </div>
              )
            })}

            {/* Pending pin bounce preview */}
            {pendingPin && (
              <div
                className="absolute"
                style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%`, transform: 'translate(-50%, -100%)', zIndex: 30 }}
              >
                <div
                  className="w-8 h-8 rounded-full rounded-bl-none flex items-center justify-center bg-yellow-400 animate-bounce"
                  style={{ transform: 'rotate(-45deg)' }}
                >
                  <span style={{ transform: 'rotate(45deg)' }} className="text-gray-900 text-xs font-bold">+</span>
                </div>
              </div>
            )}

            {/* Selected popup */}
            {(selectedMember || selectedLocation) && (
              <div
                className="absolute bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-xl p-3 min-w-[200px] shadow-xl"
                style={{ zIndex: 50 }}
              >
                <button
                  onClick={() => { setSelectedMember(null); setSelectedLocation(null) }}
                  className="absolute top-2 right-2 text-gray-500 hover:text-white text-xs"
                >✕</button>

                {selectedMember && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getMemberColor(selectedMember)}`}>
                        {selectedMember.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{selectedMember.name}</div>
                        <div className="text-xs text-gray-500">{selectedMember.role}</div>
                      </div>
                    </div>
                    <div className="text-xs text-green-400 mb-1">● Sharing live location</div>
                    <div className="text-xs text-gray-500">Updated {getTimeAgo(selectedMember.location_updated_at)}</div>
                    {selectedMember.latitude && (
                      <div className="text-xs text-gray-600 mt-1 font-mono">
                        {selectedMember.latitude.toFixed(4)}, {selectedMember.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                )}

                {selectedLocation && (
                  <div>
                    <div className="text-sm font-medium text-white mb-1">{selectedLocation.name}</div>
                    {selectedLocation.address && (
                      <div className="text-xs text-gray-400 mb-1">📍 {selectedLocation.address}</div>
                    )}
                    <div className="text-xs text-gray-500 capitalize mb-2">
                      {LOCATION_TYPES[selectedLocation.type]?.label || selectedLocation.type}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deletePin(selectedLocation.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-all border border-red-400/30 px-2 py-1 rounded-lg"
                      >
                        Remove pin
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="absolute top-3 right-3 bg-gray-900/95 border border-gray-800 rounded-lg p-2.5 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
              {Object.entries(LOCATION_TYPES).slice(0, 4).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: val.color }}></div>
                  {val.label}
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 rounded-full border-2 border-green-400 bg-green-400/20 flex-shrink-0"></div>
                Member (live)
              </div>
            </div>

            {onlineCount > 0 && (
              <div className="absolute top-3 left-3 bg-gray-900/95 border border-green-400/30 rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ zIndex: 10 }}>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-green-400 font-medium">{onlineCount} live</span>
              </div>
            )}
          </div>

          {/* Saved locations list */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Saved locations ({locations.length})</div>
              {isAdmin && (
                <button
                  onClick={() => setAddingPin(true)}
                  className="text-yellow-400 text-xs hover:text-yellow-300"
                >
                  + Add location
                </button>
              )}
            </div>
            {locations.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No locations yet. {isAdmin ? 'Click "+ Add pin" above to add one.' : 'Your admin will add locations soon.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {locations.map(loc => {
                  const t = LOCATION_TYPES[loc.type] || LOCATION_TYPES.custom
                  return (
                    <div key={loc.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold"
                        style={{ background: t.color + '30', color: t.color }}
                      >
                        {t.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{loc.name}</div>
                        <div className="text-xs text-gray-500 truncate">{loc.address || t.label}</div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => deletePin(loc.id)}
                          className="text-gray-600 hover:text-red-400 text-sm transition-all flex-shrink-0"
                        >×</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">

          {/* My location */}
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
               locationStatus === 'requesting' ? '⏳ Requesting GPS access...' :
               locationStatus === 'denied' ? '✕ Location denied — check browser settings' :
               sharing ? '● Location sharing on' : '⏸ Location sharing off'}
            </div>

            {locationStatus === 'denied' && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-800 rounded-lg p-2">
                Chrome: click the 🔒 lock icon in address bar → Site settings → Location → Allow
              </div>
            )}
          </div>

          {/* Live members */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Live locations</div>
              <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded font-medium">
                {onlineCount} sharing
              </span>
            </div>

            {sharingMembers.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-600 text-sm mb-2">No one sharing yet</div>
                <div className="text-xs text-gray-600 leading-relaxed">Toggle "Share my location" above — your browser will ask for GPS permission</div>
              </div>
            ) : (
              sharingMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setSelectedMember(m); setSelectedLocation(null) }}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-800/50 rounded-lg px-1 -mx-1 transition-all"
                >
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

          {/* Admin panel */}
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