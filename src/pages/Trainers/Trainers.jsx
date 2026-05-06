import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import "./Trainers.css";
import LoginModal from "../GetStarted/LoginModal.jsx";
import RegisterModal from "../GetStarted/RegisterModal.jsx";
import Mike from '../../assets/mike-kay.webp';
import Sarah from '../../assets/sarah.webp';
import Jane from '../../assets/jane.webp';

export default function Trainers( {  onLoginSuccess } ) {
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showModal, setShowModal]             = useState(false);
  const [showSuccess, setShowSuccess]         = useState(false);
  const [showLoginModal, setShowLoginModal]        = useState(false);
  const [showRegisterModal, setShowRegisterModal]  = useState(false);
  const [pendingTrainer, setPendingTrainer]   = useState(null);
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [message, setMessage]                 = useState('');
  // Temporary banner message shown after successful login
  const [postLoginMessage, setPostLoginMessage] = useState('');

  const openBooking = (trainerName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPendingTrainer(trainerName);
      setShowLoginModal(true);
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
      setName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setEmail(user.email || '');
    }
    setSelectedTrainer(trainerName);
    setShowModal(true);
  };


  const handleLoginSuccess = () => {
    setShowLoginModal(false);

    // Tell App.jsx the user is logged in (updates global isLoggedIn state)
     if (typeof onLoginSuccess === 'function') {
      onLoginSuccess();
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
      setName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setEmail(user.email || '');
    }
    if (pendingTrainer) {
      setSelectedTrainer(pendingTrainer);
      setShowModal(true);
      setPendingTrainer(null);
    }

    // Show a success banner for 4 seconds then auto-hide it
    setPostLoginMessage('Logged in! Click Start Training to begin your workout.');
    setTimeout(() => setPostLoginMessage(''), 5000);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, trainer: selectedTrainer, message }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        alert(data.message || 'Booking failed. Try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Server error. Is your backend running?');
    }
  };

  useEffect(() => {
    const cards = document.querySelectorAll('.trainer-card');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('show'), index * 120);
          }
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="trainers">
      <div className="trainers-header">
        <h2>Meet Our Trainers</h2>
        <p>Certified professionals dedicated to your fitness journey</p>
      </div>

      <div className="trainers-grid">

        <div className="trainer-card">
          <img src={Mike} alt="Mike Kay" />
          <h3>Mike Kay</h3>
          <span>Strength & Conditioning</span>
          <div className="trainer-tags">
            <span className="mike-kay">💪 Strength</span>  <span>🏋️ Power</span>
          </div>
          <div className="trainer-stats">
            <span>8 yrs</span>   <span>150 clients</span>
          </div>
          <p>Helping athletes build power, endurance, and confidence.</p>
          <button className="trainer-btn" onClick={() => openBooking('Mike Kay')}>
            Book a Session →
          </button>
          <div className="trainer-socials">
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faInstagram} /></a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faLinkedin} /></a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faTwitter} /></a>
          </div>
        </div>

        <div className="trainer-card popular">
          <img src={Sarah} alt="Sarah Williams" />
          <h3>Sarah Williams</h3>
          <span>Weight Loss Specialist</span>
          <div className="trainer-tags">
            <span>🔥 Fat Loss</span>  <span>🥗 Nutrition</span>
          </div>
          <div className="trainer-stats">
            <span>6 yrs</span>  <span>200 clients</span>
          </div>
          <p>Expert in fat loss programs and lifestyle transformation.</p>
          <button className="trainer-btn" onClick={() => openBooking('Sarah Williams')}>
            Book a Session →
          </button>
          <div className="trainer-socials">
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faInstagram} /></a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faLinkedin} /></a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faTwitter} /></a>
          </div>
        </div>

        <div className="trainer-card">
          <img src={Jane} alt="Jackie Jane" />
          <h3>Jackie Jane</h3>
          <span>Yoga & Mobility</span>
          <div className="trainer-tags">
            <span>🧘 Flexibility</span> <span>🫀 Recovery</span>
          </div>
          <div className="trainer-stats">
            <span>7 yrs</span> <span>120 clients</span>
          </div>
          <p>Focuses on flexibility, recovery, and mind-body balance.</p>
          <button className="trainer-btn" onClick={() => openBooking('Jackie Jane')}>
            Book a Session →
          </button>
          <div className="trainer-socials">
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faInstagram} /></a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faLinkedin} /></a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faTwitter} /></a>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="booking-modal" onClick={() => setShowModal(false)}>

          <div className="booking-content" onClick={e => e.stopPropagation()}>
            <h3>Book a Session with {selectedTrainer}</h3>

            <form onSubmit={handleBooking}>

              <input className="bookolo" type="text" placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)} required />

              <input className="bookolo" type="email" placeholder="Your email"
                value={email} onChange={e => setEmail(e.target.value)} required />

              <textarea className="book" placeholder="Write your message…"
                value={message} onChange={e => setMessage(e.target.value)} required />

              <div className="booking-actions">
                <button type="submit" className="confirm">Confirm Booking</button>
                <button type="button" className="confirm cancel"
                  onClick={() => setShowModal(false)}>Cancel</button>
              </div>

            </form>
          </div>
        </div>
      )}

       {/* Post-login success banner — only visible for 4 seconds after login */}
      {postLoginMessage && (
        <div className="post-login-banner">
          {postLoginMessage}
        </div>
      )}

      <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          successMessage="Login successful! Welcome back to FitnessFirst."
          onOpenRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
          }}
      />

      {/* REGISTER MODAL
          onRegistered — after successful registration, switch back to login modal
          so user can immediately log in with their new account */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegistered={() => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
        }}
      />

      {showSuccess && (
        <div className="success-popup">
           Booking sent successfully! We'll be in touch soon.
        </div>
      )}

    </section>
  );
}