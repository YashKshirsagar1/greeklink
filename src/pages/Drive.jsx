import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const FOLDERS = [
  { id: 1, name: 'Academic — Notes & Tests', icon: '📚', color: 'text-blue-400', description: 'Past exams, notes, study guides' },
  { id: 2, name: 'Finance & Budget', icon: '💰', color: 'text-green-400', description: 'Budget proposals, treasurer docs' },
  { id: 3, name: 'Meeting Minutes', icon: '📋', color: 'text-yellow-400', description: 'Chapter meeting notes archive' },
  { id: 4, name: 'Event Planning', icon: '🎉', color: 'text-purple-400', description: 'Social event docs, guest lists' },
  { id: 5, name: 'Risk & Policy Docs', icon: '⚖️', color: 'text-red-400', description: 'Chapter bylaws, risk policies' },
  { id: 6, name: 'Pledge Education', icon: '🎗️', color: 'text-pink-400', description: 'Pledge program materials' },
  { id: 7, name: 'Rush Materials', icon: '⭐', color: 'text-orange-400', description: 'Rush week docs and PNM info' },
  { id: 8, name: 'Alumni Resources', icon: '🎓', color: 'text-gray-400', description: 'Alumni directory, job postings' },
]

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fileIcon(type) {
  if (!type) return '📄'
  if (type.includes('pdf')) return '📕'
  if (type.includes('image')) return '🖼️'
  if (type.includes('video')) return '🎬'
  if (type.includes('audio')) return '🎵'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('sheet') || type.includes('excel')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  return '📄'
}

export default function Drive() {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [viewMode, setViewMode] = useState('folders')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchFiles()
    fetchMe()
  }, [])

  async function fetchMe() {
    if (!user) return
    const { data } = await supabase.from('members').select('is_admin').eq('user_id', user.id).single()
    setIsAdmin(data?.is_admin || false)
  }

  async function fetchFiles() {
    setLoading(true)
    const { data } = await supabase.from('files').select('*').order('created_at', { ascending: false })
    setFiles(data || [])
    setLoading(false)
  }

  function toast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  async function uploadFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(`Uploading ${file.name}...`)
    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage
        .from('chapter-files')
        .upload(path, file, { contentType: file.type })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('chapter-files').getPublicUrl(path)
      await supabase.from('files').insert({
        name: file.name,
        folder_id: activeFolder || 1,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploaded_by: user?.user_metadata?.full_name || user?.email || 'Unknown',
      })
      await fetchFiles()
      toast(`${file.name} uploaded successfully!`)
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploading(false)
    setUploadProgress('')
    e.target.value = ''
  }

  async function deleteFile(file) {
    if (!confirm(`Delete "${file.name}"?`)) return
    const path = file.url.split('/chapter-files/')[1]
    if (path) await supabase.storage.from('chapter-files').remove([path])
    await supabase.from('files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
    toast('File deleted.')
  }

  const displayFiles = files.filter(f => {
    const matchFolder = activeFolder ? f.folder_id === activeFolder : true
    const matchSearch = search ? f.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchFolder && matchSearch
  })

  const folderCounts = {}
  FOLDERS.forEach(f => { folderCounts[f.id] = files.filter(file => file.folder_id === f.id).length })

  const recentFiles = [...files].slice(0, 5)

  return (
    <div className="p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Chapter Drive</h1>
          <p className="text-gray-400 text-sm">Shared notes, docs, and chapter resources.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-yellow-400 text-gray-900 font-bold text-sm rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50">
            {uploading ? uploadProgress : '+ Upload file'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50">
          ✓ {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <input
          className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2.5 pl-9 outline-none placeholder-gray-600 focus:border-yellow-400/40"
          placeholder="Search all files..."
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveFolder(null) }}
        />
        <span className="absolute left-3 top-3 text-gray-500 text-sm">🔍</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Folder sidebar */}
        <div className="col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Folders</div>
            </div>
            <button
              onClick={() => setActiveFolder(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all border-b border-gray-800/50
                ${!activeFolder ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span>📁</span>
              <span className="flex-1 text-left">All files</span>
              <span className="text-xs text-gray-600">{files.length}</span>
            </button>
            {FOLDERS.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all border-b border-gray-800/50 last:border-0
                  ${activeFolder === folder.id ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span>{folder.icon}</span>
                <span className="flex-1 text-left truncate text-xs">{folder.name.split('—')[0].trim()}</span>
                {folderCounts[folder.id] > 0 && (
                  <span className="text-xs text-gray-600">{folderCounts[folder.id]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-3">
          {/* Folder grid when no folder selected and no search */}
          {!activeFolder && !search && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {FOLDERS.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-700 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{folder.icon}</div>
                    <div className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                      {folderCounts[folder.id]} files
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${folder.color} mb-0.5 group-hover:text-white transition-all`}>
                    {folder.name}
                  </div>
                  <div className="text-xs text-gray-500">{folder.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* File list */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">
                {activeFolder
                  ? FOLDERS.find(f => f.id === activeFolder)?.name
                  : search ? `Search results for "${search}"` : 'Recent files'}
              </div>
              <div className="flex gap-2 items-center">
                {activeFolder && (
                  <button
                    onClick={() => { fileInputRef.current?.click() }}
                    disabled={uploading}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-all">
                    + Upload here
                  </button>
                )}
                <span className="text-xs text-gray-500">{displayFiles.length} files</span>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 text-sm py-8">Loading files...</div>
            ) : displayFiles.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-3">{activeFolder ? FOLDERS.find(f => f.id === activeFolder)?.icon : '📁'}</div>
                <div className="text-gray-500 text-sm mb-3">No files yet</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-yellow-400 text-sm border border-yellow-400/30 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition-all">
                  + Upload first file
                </button>
              </div>
            ) : (
              <div>
                {/* Header row */}
                <div className="grid grid-cols-12 px-4 py-2 text-xs text-gray-600 uppercase tracking-wider border-b border-gray-800">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Folder</div>
                  <div className="col-span-2">Uploaded by</div>
                  <div className="col-span-1 text-right">Size</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {displayFiles.map(file => (
                  <div key={file.id} className="grid grid-cols-12 px-4 py-3 border-b border-gray-800 last:border-0 items-center hover:bg-gray-800/30 group transition-all">
                    <div className="col-span-5 flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{fileIcon(file.type)}</span>
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 truncate">
                      {FOLDERS.find(f => f.id === file.folder_id)?.name.split('—')[0].trim() || 'General'}
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 truncate">{file.uploaded_by}</div>
                    <div className="col-span-1 text-xs text-gray-500 text-right">{formatSize(file.size)}</div>
                    <div className="col-span-2 flex gap-1.5 justify-end">
                      <a href={file.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-1 rounded-lg hover:bg-blue-400/20 transition-all">
                        Open
                      </a>
                      <a href={file.url} download={file.name}
                        className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-lg hover:bg-green-400/20 transition-all">
                        ↓
                      </a>
                      {isAdmin && (
                        <button onClick={() => deleteFile(file)}
                          className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-lg hover:bg-red-400/20 transition-all opacity-0 group-hover:opacity-100">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}