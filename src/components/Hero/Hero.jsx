import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';
import heroImage from '../../assets/athlete.webp';
import LoginModal from '../../pages/GetStarted/LoginModal';
import RegisterModal from '../../pages/GetStarted/RegisterModal';

export default function Hero({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Check if user is logged in when they click "Start Training"
  const handleStartTraining = () => {
    const user = localStorage.getItem('user');
    if (user) {
      // Already logged in → go straight to workouts
      navigate('/workouts');
    } else {
      // Not logged in → show login modal
      setShowLogin(true);
    }
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1>
            Train <span>Hard</span>.<br />
            Stay <span>Strong</span>.<br />
            Build Your <span>Body</span>.
          </h1>
          <p>
            Transform your fitness journey with structured workouts,
            expert guidance, and real results.
          </p>
          <div className="hero-buttons">
            <button onClick={handleStartTraining} className="hero-btn primary">
              Start Training
            </button>
            <button
              onClick={() => navigate('/programs')}
              className="hero-btn secondary"
            >
              View Programs
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img src={heroImage} alt="Athlete training" />
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={() => {
            onLoginSuccess();          // 1. Tell App.jsx user is logged in
            setShowLogin(false);       // 2. Close the modal
            navigate('/workouts');     // 3. Go to workouts
            // This now works because App.jsx checks localStorage too,
            // so the protected route won't block us anymore
          }}
          onOpenRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {/* REGISTER MODAL */}
      {showRegister && (
        <RegisterModal
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          onRegistered={() => {
            // After registering, send user to login modal
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </section>
  );
}