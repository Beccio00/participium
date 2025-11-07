import { useState } from 'react'
import './styles/App.css'
import { useAuth } from './hooks/useAuth'
import Header from './components/Header'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'

type ViewType = 'home' | 'login' | 'signup'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const { user, isAuthenticated, loading, logout, checkAuth } = useAuth()
  console.log('App user:', user)

  const handleShowLogin = () => setCurrentView('login')
  const handleShowSignup = () => setCurrentView('signup')
  const handleBackToHome = () => {
    setCurrentView('home')
    checkAuth()
  }

  const handleLogout = async () => {
    try {
      await logout()
      setCurrentView('home')
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

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <div className="auth-page">
            <div className="back-navigation">
              <button onClick={handleBackToHome} className="back-btn">
                ← Back to Home
              </button>
            </div>
            <Login onLoginSuccess={handleBackToHome} onGoToSignup={handleShowSignup} />
          </div>
        )
      case 'signup':
        return <Signup onBackToHome={handleBackToHome} />
      default:
        return (
          <Home 
            isAuthenticated={isAuthenticated}
            onShowLogin={handleShowLogin}
            onShowSignup={handleShowSignup}
          />
        )
    }
  }

  return (
    <div className={`app ${currentView !== 'signup' ? 'with-header' : ''}`}>
      {currentView !== 'signup' && (
        <Header
          userHeader={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={handleShowLogin}
          onShowSignup={handleShowSignup}
          onLogout={handleLogout}
        />
      )}
      {renderView()}
    </div>
  )
}

export default App
