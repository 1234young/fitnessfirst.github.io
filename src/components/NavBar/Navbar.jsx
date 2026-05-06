import { useState } from 'react';
import { Link } from 'react-router-dom';
import fitnessFirst from '../../assets/fitness.webp';
import avatarIcon from '../../assets/avatar.svg';
import LoginModal from '../../pages/GetStarted/LoginModal.jsx';
import RegisterModal from '../../pages/GetStarted/RegisterModal.jsx';
import './Navbar.css';

// Props received from App.jsx:
// isLoggedIn     — boolean, controls what buttons show (Get Started vs Profile/Logout)
// onLogout       — function that clears localStorage and resets App state
// onLoginSuccess — function that sets isLoggedIn = true in App.jsx
export default function Navbar({ isLoggedIn, onLogout, onLoginSuccess }) {

  // Controls mobile hamburger menu open/close
  const [menuOpen, setMenuOpen] = useState(false);

  // Controls visibility of login and register modals
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Temporary banner message shown after successful login
  const [postLoginMessage, setPostLoginMessage] = useState('');

  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;

  // Called by LoginModal after a successful login
  const handleLoginSuccess = () => {
    // Tell App.jsx the user is logged in (updates global isLoggedIn state)
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess();
    }

    // Close the login modal
    setShowLogin(false);

    // Show a success banner for 4 seconds then auto-hide it
    setPostLoginMessage('Logged in! Click Start Training to begin your workout.');
    setTimeout(() => setPostLoginMessage(''), 5000);
  };

  return (
    <>
      <nav className="navbar">
        <img src={fitnessFirst} alt="Fitness First Logo" />
        <h1>Fitness First</h1>

        {/* Hamburger icon — toggles mobile menu open/close */}
        <div
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Nav links — 'active' class shows them on mobile when menuOpen is true */}
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programs">Programs</Link></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/trainers">Trainers</Link></li>
          <li><Link to="/contact">Contact</Link></li>

          {/* Conditional rendering based on login state:
              - Logged in  → show Profile, Progress links + Logout button
              - Logged out → show Get Started button */}
          {isLoggedIn ? (
          <>


           {userRole !== 'admin' && (
            <>  
            <li>
              <Link to="/progress" className="progress-link">
                Progress
              </Link>
            </li>

             <li>
              <Link to="/bookings" className="bookings-link">
              My Bookings
              </Link>
            </li>

            <li>
              <Link to="/nutrition" className="nutrition-link"> Nutrition</Link>
            </li>
            </>
            )}

            {/* Admin link — only shows if user's role is admin
            We read role from localStorage user object
            JSON.parse safely handles null with || '{}' fallback */}
            {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' && (
            <li>
              <Link to="/admin" className="admin-link"> Admin</Link>
            </li>
            )}

           
            <li>
              <Link to="/profile" className="profile-link">
                <img src={avatarIcon} alt="Profile" className="nav-avatar-icon" />
              </Link>
            </li>

            <li>
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </li>
          </>
          ) : (
          <button className="btn" onClick={() => setShowLogin(true)}>
          Get Started
          </button>
          )}

        </ul>
      </nav>

      {/* Post-login success banner — only visible for 4 seconds after login */}
      {postLoginMessage && (
        <div className="post-login-banner">
          {postLoginMessage}
        </div>
      )}

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
        successMessage="Login successful! Welcome back to FitnessFirst."
        onOpenRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      {/* REGISTER MODAL
          onRegistered — after successful registration, switch back to login modal
          so user can immediately log in with their new account */}
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onRegistered={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}