import { Routes, Route, useLocation } from 'react-router'
import './styles/App.css'
import { useAuth } from './hooks/useAuth'
import Header from './components/Header'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import AdminPanel from './components/AdminPanel'

function App() {
  const { loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className={`app with-header`}>
      <Header showBackToHome={location.pathname !== '/'} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  )
}

export default App
