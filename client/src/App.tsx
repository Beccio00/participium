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

  const handleShowLogin = () => setCurrentView('login')
  const handleShowSignup = () => setCurrentView('signup')
  const handleBackToHome = async () => {
    setCurrentView('home')
    await checkAuth()
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
          <Login 
            onLoginSuccess={handleBackToHome} 
            onGoToSignup={handleShowSignup}
            onBackToHome={handleBackToHome}
          />
        )
      case 'signup':
        return <Signup onBackToHome={handleBackToHome} onShowLogin={handleShowLogin} />
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
    <div className={`app ${currentView === 'home' ? 'with-header' : ''}`}>
      {currentView === 'home' && (
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
