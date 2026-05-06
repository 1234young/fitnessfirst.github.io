
import { useNavigate } from 'react-router-dom';
import './Action.css';

export default function Action({ isLoggedIn, onOpenLogin, onOpenRegister }) {
  const navigate = useNavigate();

  const handleJoinNow = () => {
    if (isLoggedIn || !!localStorage.getItem('user')) {
      navigate('/workouts'); // already a member, go to workouts
    } else {
      onOpenRegister(); // new user,open register modal
    }
  };

  const handleFreeTrial = () => {
    if (isLoggedIn || !!localStorage.getItem('user')) {
      navigate('/workouts'); // already logged in,  go to workouts
    } else {
      onOpenLogin(); // trying it out, open login modal
    }
  };

  return (
    <section className="cta">
      <div className="cta-content">
        <h2>Ready to Transform Your Body?</h2>
        <p>Start your fitness journey today with expert guidance and proven programs.</p>

        <div className="cta-buttons">
          <button className="cta-btn primary" onClick={handleJoinNow}>
            Join Now
          </button>
          <button className="cta-btn secondary" onClick={handleFreeTrial}>
            Free Trial
          </button>
        </div>
      </div>
    </section>
  );
}