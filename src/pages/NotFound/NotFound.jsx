import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <section className="notfound-page">

      {/* Floating background orbs — purely decorative, animated via CSS */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="notfound-content">

        {/* Glitch 404 — data-text is read by CSS ::before and ::after pseudo-elements
            to create two slightly offset copies of the text with different clip-paths,
            producing the RGB-split glitch animation effect */}
        <h1 className="glitch" data-text="404">404</h1>

        <div className="notfound-divider" />

        <h2 className="notfound-title">Page Not Found</h2>

        <p className="notfound-message">
          Looks like this page skipped leg day and disappeared.
          <br />
          Let's get you back on track.
        </p>

        <div className="notfound-actions">
          <button
            className="notfound-btn primary"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
          <button
            className="notfound-btn secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>

      </div>
    </section>
  );
}
