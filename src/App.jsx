import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import Messages from './pages/Messages'
import Dues from './pages/Dues'
import Map from './pages/Map'
import Drive from './pages/Drive'
import PNM from './pages/PNM'
import Pledges from './pages/Pledges'
import Risk from './pages/Risk'
import Alumni from './pages/Alumni'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-yellow-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="games" element={<Games />} />
          <Route path="messages" element={<Messages />} />
          <Route path="dues" element={<Dues />} />
          <Route path="map" element={<Map />} />
          <Route path="drive" element={<Drive />} />
          <Route path="pnm" element={<PNM />} />
          <Route path="pledges" element={<Pledges />} />
          <Route path="risk" element={<Risk />} />
          <Route path="alumni" element={<Alumni />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App