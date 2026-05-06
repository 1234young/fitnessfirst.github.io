import { useNavigate } from 'react-router-dom';
import './Footer.css';
import logo from '../../assets/fitness.webp';

export default function Footer({ onLogout }) {
  const navigate = useNavigate();

  // Check if user is logged in to decide whether to show logout button
  const user = localStorage.getItem('user');

  const handleLogout = () => {
    localStorage.removeItem('user'); //  Clear session
    onLogout();                      //  Tell App.jsx: isLoggedIn = false
    navigate('/');                   //  Send user back to home
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LOGO */}
        <div className="footer-brand">
          <img src={logo} alt="Fitness Brand Logo" />
          <p>Train smart. Stay strong. Live fit.</p>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Programs</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* SOCIALS */}
        <div className="footer-socials">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://www.instagram.com" target='_blank' aria-label="Instagram">
              <i className="fa-brands fa-square-instagram"></i>
            </a>
            <a href="https://www.twitter.com" target='_blank' aria-label="Twitter">
              <i className="fa-brands fa-x-twitter"></i>
            </a>
            <a href="https://www.facebook.com" target='_blank' aria-label="Facebook">
              <i className="fa-brands fa-facebook"></i>
            </a>
          </div>
        </div>

        {/* LOGOUT — only shows when user is logged in */}
        {user && (
          <div className="footer-logout">
            <h4>Account</h4>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        )}

      </div>

      <div className="footer-bottom">
        © 2026 Fitness Brand. All rights reserved.
      </div>
    </footer>
  );
}