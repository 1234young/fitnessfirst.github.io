import { useNavigate } from 'react-router-dom';
import './HowItWorks.css';
import rocketIcon   from '../../assets/rocket.svg';
import signupIcon   from '../../assets/signup.svg';
import programIcon  from '../../assets/workouts.svg';
import progressIcon from '../../assets/progress-tracker.svg';

// Steps config — icons are now the actual imported variables, not strings
const STEPS = [
  {
    number: 1,
    icon: signupIcon,    // variable, not 'signupIcon' string
    title: 'Sign Up',
    description: 'Create your free account in seconds and join hundreds of members already training.',
    action: 'register',
    label: 'Create Account',
  },
  {
    number: 2,
    icon: programIcon,   //  variable, not 'programIcon' string
    title: 'Choose Program',
    description: 'Browse Strength, HIIT, Fat Loss or Yoga programs tailored to your fitness goals.',
    action: '/programs',
    label: 'View Programs',
  },
  {
    number: 3,
    icon: rocketIcon,    //  variable, not 'rocketIcon' string
    title: 'Start Training',
    description: 'Access 48 expert-guided workouts with video tutorials and step-by-step instructions.',
    action: '/workouts',
    label: 'Start Training',
  },
  {
    number: 4,
    icon: progressIcon,  //  variable, not 'progressIcon' string
    title: 'Track Progress',
    description: 'Mark workouts complete, track your streak, and watch your fitness journey unfold.',
    action: '/progress',
    label: 'View Progress',
  },
];

export default function HowItWorks({ isLoggedIn, onOpenRegister }) {
  const navigate = useNavigate();

  const handleStepClick = (step) => {
    if (step.action === 'register') {
      // Step 1 — open register modal if not logged in
      // If already logged in → go straight to workouts
      if (isLoggedIn) {
        navigate('/workouts');
      } else {
        onOpenRegister();
      }
      return;
    }

    // Steps 3 and 4 are protected — check auth before navigating
    const protectedRoutes = ['/workouts', '/progress'];
    if (protectedRoutes.includes(step.action)) {
      if (isLoggedIn || !!localStorage.getItem('user')) {
        navigate(step.action);
      } else {
        // Not logged in → open register modal instead
        onOpenRegister();
      }
      return;
    }

    // /programs is public — navigate directly
    navigate(step.action);
  };

  return (
    <section className="how-it-works">

      {/* Section header */}
      <div className="hiw-header">
        <h2>How It Works</h2>
        <p className="hiw-subtitle">
          Getting started is simple. Follow these 4 steps and begin your transformation today.
        </p>
      </div>

      {/* Steps container */}
      <div className="hiw-steps">
        {STEPS.map((step, index) => (
          <div key={step.number} className="hiw-step-wrapper">

            {/* Step card — clickable */}
            <div
              className="hiw-step"
              onClick={() => handleStepClick(step)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleStepClick(step)}
            >
              {/* Number circle */}
              <div className="hiw-number">{step.number}</div>

              {/*  Always render as img since all icons are now SVG imports */}
              <div className="hiw-icon">
                <img src={step.icon} alt={step.title} className="hiw-svg-icon" />
              </div>

              {/* Text */}
              <h3 className="hiw-title">{step.title}</h3>
              <p className="hiw-description">{step.description}</p>

              {/* CTA label */}
              <span className="hiw-cta">{step.label} →</span>
            </div>

            {/* Connector line — hidden after last step */}
            {index < STEPS.length - 1 && (
              <div className="hiw-connector">
                <div className="hiw-line" />
                <div className="hiw-arrow">›</div>
              </div>
            )}

          </div>
        ))}
      </div>

    </section>
  );
}