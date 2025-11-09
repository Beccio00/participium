import { useState } from 'react';
import AuthModal from './AuthModal';
import '../styles/Home.css';

interface HomeProps {
  isAuthenticated: boolean;
  onShowLogin: () => void;
  onShowSignup: () => void;
}

export default function Home({ isAuthenticated, onShowLogin, onShowSignup }: HomeProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const handleAddReport = () => {
    // Sempre mostra il modal, che gestirà i due casi diversi
    setShowAuthModal(true);
  };

  const handleModalLogin = () => {
    setShowAuthModal(false);
    onShowLogin();
  };

  const handleModalSignup = () => {
    setShowAuthModal(false);
    onShowSignup();
  };

  const handleCloseModal = () => {
    setShowAuthModal(false);
  };

  return (
    <>
      <div className="home-container">
        <main className="main-content">
          {/* Map Section - Left 2/3 */}
          <div className="map-section">
            <div className="map-placeholder">
              <div className="map-header">
                <h2>Interactive Map</h2>
                <p>Municipality territory view</p>
              </div>
              <div className="map-content">
                <div className="map-icon">🗺️</div>
                <h3>Map will be displayed here</h3>
                <p>This area will contain an interactive map showing:</p>
                <ul>
                  <li>📍 Report locations</li>
                  <li>🏢 Municipal buildings</li>
                  <li>🚧 Active issues</li>
                  <li>✅ Resolved reports</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reports Section - Right 1/3 */}
          <div className="reports-section">
            <div className="reports-header">
              <h3>Recent Reports</h3>
              <span className="reports-count">0</span>
            </div>
            
            <div className="reports-content">
              <div className="reports-placeholder">
                <div className="placeholder-icon">📋</div>
                <p>No reports yet</p>
                <small>Reports will appear here once submitted by citizens.</small>
              </div>
            </div>

            {/* Add Report Button - Bottom Right */}
            <div className="add-report-section">
              <button 
                onClick={handleAddReport}
                className="add-report-btn"
              >
                <span className="btn-icon">📝</span>
                Add New Report
              </button>
              
              {!isAuthenticated && (
                <p className="auth-reminder">
                  <small>
                    You need to <button onClick={onShowLogin} className="link-btn">login</button> or{' '}
                    <button onClick={onShowSignup} className="link-btn">sign up</button> to submit reports
                  </small>
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        isAuthenticated={isAuthenticated}
        onClose={handleCloseModal}
        onLogin={handleModalLogin}
        onSignup={handleModalSignup}
      />
    </>
  );
}