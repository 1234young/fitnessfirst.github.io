import { useNavigate } from 'react-router-dom';
import './AppPreview.css';
import app1 from '../../assets/progress.webp';
import app2 from '../../assets/workout.webp';
import app3 from '../../assets/nutrition.webp';

export default function AppPreview() {
  const navigate = useNavigate();

  const handleProgressClick = () => {
    // If logged in → go to progress page
    // If not → go to home where they can log in
    if (localStorage.getItem('user')) {
      navigate('/progress');
    } else {
      navigate('/');
    }
  };
   const handleCardClick = (path) => {
    // If logged in → go to progress page
    // If not → go to home where they can log in
    if (localStorage.getItem('user')) {
      navigate('/workouts');
    } else {
      navigate('/');
    }
  };

  return (
    <section className="app-preview">
      <h2>Train Smarter With Our App</h2>
      <p className="app-preview-subtitle">
        Track workouts, monitor progress, and stay motivated, all in one place.
      </p>

      <div className="app-grid">

        {/* Progress Tracking card — clickable, links to /progress */}
        <div className="app-card clickable" onClick={handleProgressClick}>
          <img src={app1} alt="Progress tracking" />
          <span>Progress Tracking</span>
          <p className="app-card-hint">View your stats →</p>
        </div>

       {/*  Workout Dashboard card → /workouts */}
        <div className="app-card featured clickable" onClick={() => handleCardClick('/workouts')}>
          <img src={app2} alt="Workout dashboard" />
          <span>Workout Dashboard</span>
          <p className="app-card-hint">Browse workouts →</p>
        </div>

        {/* Nutrition Insights — coming soon */}
        <div className="app-card">
          <img src={app3} alt="Nutrition insights" />
          <span>Nutrition Insights</span>
          <p className="app-card-hint coming-soon">Coming Soon</p>
        </div>

      </div>
    </section>
  );
}