import { Routes, Route, useNavigate, useLocation } from 'react-router'
import './styles/App.css'
import { useAuth } from './hooks/useAuth'
import Header from './components/Header'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'

function App() {
  const { loading, logout, checkAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      try {
        await checkAuth()
      } catch (err) {
        console.warn('Failed to refresh auth after logout:', err)
      }
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className={`app with-header`}>
      <Header onLogout={handleLogout} showBackToHome={location.pathname !== '/'} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  )
}

export default App
