import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Program.css';
import strengthImg from '../../assets/strength.webp';
import fatLossImg from '../../assets/fat-loss.webp';
import hiitImg from '../../assets/hiit.webp';
import yogaImg from '../../assets/yoga.webp';

const programs = [
  {
    title: 'Strength Training',
    description: 'Build muscle, increase strength, and improve performance.',
    icon: strengthImg,
  },
  {
    title: 'Fat Loss',
    description: 'Burn calories, shred fat, and boost your metabolism.',
    icon: fatLossImg,
  },
  {
    title: 'HIIT',
    description: 'High intensity workouts designed for maximum results.',
    icon: hiitImg,
  },
  {
    title: 'Yoga & Recovery',
    description: 'Improve flexibility, balance, and muscle recovery.',
    icon: yogaImg,
  }
];

export default function Program({ isLoggedIn }) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  const handleExplore = () => {
    // Check both React state AND localStorage 
    if (isLoggedIn || !!localStorage.getItem('user')) {
      navigate('/workouts');
    } else {
      // Not logged in — show popup message
      setShowPopup(true);
    }
  };

  return (
    <section className="programs">
      <h2 className="programs-title">Our Programs</h2>
      <p className="programs-subtitle">
        Choose a workout plan tailored to your fitness goals
      </p>

      <div className="programs-grid">
        {programs.map((program) => (
          <div className="program-card" key={program.title}>
            <img
              src={program.icon}
              alt={program.title}
              className="program-icon"
            />
            <h3>{program.title}</h3>
            <p>{program.description}</p>

            {/* button instead of Link — we control navigation now */}
            <button className="explore-btn" onClick={handleExplore}>
              Explore
            </button>
          </div>
        ))}
      </div>

      {/* Popup — shown when user is not logged in */}
      {showPopup && (
        <div className="popup-backdrop" onClick={() => setShowPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <p>🔒 Please login to continue</p>
            <span>Click <strong>Get Started</strong> in the navbar to login</span>
            <button
              className="popup-close-btn"
              onClick={() => setShowPopup(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}