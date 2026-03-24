import { useState } from 'react'

const folders = [
  { id: 1, name: 'Academic — Notes & Tests', icon: '📚', color: 'bg-blue-400/10 text-blue-400', count: 0, description: 'Past exams, notes, study guides', files: [] },
  { id: 2, name: 'Finance & Budget', icon: '💰', color: 'bg-green-400/10 text-green-400', count: 0, description: 'Budget proposals, treasurer docs', files: [] },
  { id: 3, name: 'Meeting Minutes', icon: '📋', color: 'bg-yellow-400/10 text-yellow-400', count: 0, description: 'Chapter meeting notes archive', files: [] },
  { id: 4, name: 'Event Planning', icon: '🎉', color: 'bg-purple-400/10 text-purple-400', count: 0, description: 'Social event docs, guest lists', files: [] },
  { id: 5, name: 'Risk & Policy Docs', icon: '⚖️', color: 'bg-red-400/10 text-red-400', count: 0, description: 'Chapter bylaws, risk policies', files: [] },
  { id: 6, name: 'Pledge Education', icon: '🎗️', color: 'bg-pink-400/10 text-pink-400', count: 0, description: 'Pledge program materials', files: [] },
  { id: 7, name: 'Rush Materials', icon: '⭐', color: 'bg-orange-400/10 text-orange-400', count: 0, description: 'Rush week docs and PNM info', files: [] },
  { id: 8, name: 'Alumni Resources', icon: '🎓', color: 'bg-gray-400/10 text-gray-400', count: 0, description: 'Alumni directory, job postings', files: [] },
]

const courses = ['All', 'Chemistry', 'Physics', 'Math', 'CS', 'Biology', 'Economics']

export default function Drive() {
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCourse, setActiveCourse] = useState('All')
  const [driveLinked, setDriveLinked] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFolder, setUploadFolder] = useState(1)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const currentFolder = folders.find(f => f.id === activeFolder)

  const allFiles = folders.flatMap(f => f.files.map(file => ({ ...file, folder: f.name })))
  const searchResults = search.length > 1
    ? allFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : []

  function handleUpload() {
    if (!uploadName.trim()) return
    setShowUpload(false)
    setUploadName('')
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Chapter Drive</h1>
          <p className="text-gray-400 text-sm">Shared notes, past exams, docs, and chapter resources.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all"
          >
            + Upload file
          </button>
          <button
            onClick={() => setDriveLinked(!driveLinked)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${driveLinked ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
          >
            {driveLinked ? '✓ Google Drive linked' : 'Link Google Drive'}
          </button>
        </div>
      </div>

      {/* Upload success toast */}
      {uploadSuccess && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 flex items-center gap-2">
          <span>✓</span> File uploaded successfully!
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-lg font-bold text-white mb-4">Upload file</div>

            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">File name</label>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700 outline-none focus:border-yellow-400/50"
                placeholder="e.g. Orgo II Final 2024.pdf"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Folder</label>
              <select
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-700"
                value={uploadFolder}
                onChange={e => setUploadFolder(parseInt(e.target.value))}
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 text-center mb-4 hover:border-yellow-400/40 transition-all cursor-pointer">
              <div className="text-2xl mb-2">📎</div>
              <div className="text-sm text-gray-400">Click to select file or drag & drop</div>
              <div className="text-xs text-gray-600 mt-1">PDF, DOC, XLS, PPT up to 50MB</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold rounded-xl py-2.5 text-sm hover:bg-yellow-300 transition-all"
              >
                Upload →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive sync banner */}
      {driveLinked && (
        <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-3 mb-5 flex items-center gap-3">
          <div className="text-xl">☁️</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-400">Google Drive synced</div>
            <div className="text-xs text-gray-500">Academic notes folder auto-syncing · Last updated 5 min ago</div>
          </div>
          <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded font-medium">Live</span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</div>
        <input
          className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-yellow-400/50 transition-all placeholder-gray-600"
          placeholder="Search all files — try 'orgo' or 'budget'..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>
        )}
      </div>

      {/* Search results */}
      {search.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl mb-5 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            {searchResults.length} results for "{search}"
          </div>
          {searchResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No files found.</div>
          ) : (
            searchResults.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-all cursor-pointer">
                <div className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${f.color}`}>{f.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.folder} · {f.size} · {f.date}</div>
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0">Download</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Folder view or file list */}
      {!activeFolder ? (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">All folders</div>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {folders.map(f => (
              <div
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 hover:bg-gray-800/50 transition-all group"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="text-sm font-medium text-white mb-1 group-hover:text-yellow-400 transition-colors">{f.name}</div>
                <div className="text-xs text-gray-500 mb-2">{f.description}</div>
                <div className={`text-xs font-medium px-2 py-0.5 rounded inline-block ${f.color}`}>{f.count} files</div>
              </div>
            ))}
          </div>

          {/* Recent files */}
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recently added</div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {allFiles.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-all cursor-pointer">
                <div className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 min-w-[36px] text-center ${f.color}`}>{f.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.folder} · Uploaded by {f.uploaded} · {f.date}</div>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">{f.size}</div>
                <button className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0 ml-2">↓</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveFolder(null)}
              className="text-sm text-gray-400 hover:text-white transition-all"
            >
              All folders
            </button>
            <span className="text-gray-600">›</span>
            <span className="text-sm text-white font-medium">{currentFolder?.icon} {currentFolder?.name}</span>
          </div>

          {/* Course filter for academic folder */}
          {activeFolder === 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {courses.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCourse(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${activeCourse === c ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Files */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="text-sm font-semibold text-white">{currentFolder?.files.length} files</div>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs text-yellow-400 hover:text-yellow-300 transition-all"
              >
                + Upload to this folder
              </button>
            </div>
            {currentFolder?.files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-all cursor-pointer group">
                <div className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 min-w-[36px] text-center ${f.color}`}>{f.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate group-hover:text-yellow-400 transition-colors">{f.name}</div>
                  <div className="text-xs text-gray-500">Uploaded by {f.uploaded} · {f.date} · {f.size}</div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 px-2 py-1 rounded">Preview</button>
                  <button className="text-xs text-green-400 hover:text-green-300 bg-green-400/10 px-2 py-1 rounded">↓ Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}