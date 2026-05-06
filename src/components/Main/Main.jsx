import './Main.css';
import fitnessImg from '../../assets/fitness-app-review.webp';


// Feature cards data — title, icon, description
// Replaces the plain checklist with rich cards
const FEATURES = [
  {
    icon: '🏅',
    title: 'Certified Trainers',
    description: 'Train under professionals who understand performance and safety.',
  },
  {
    icon: '🎯',
    title: 'Personalized Plans',
    description: 'Programs built around your goals, beginner or advanced.',
  },
  {
    icon: '📊',
    title: 'Track Your Progress',
    description: 'See your daily streak, weekly activity and full history.',
  },
  {
    icon: '🔬',
    title: 'Science Backed',
    description: 'Every workout is proven by research to deliver real results.',
  },
];

export default function Main() {
  return (
    <section className="why">
      <div className="why-container">

        {/*  LEFT — Text + Feature cards */}
        <div className="why-text">

          {/* Badge */}
          <span className="why-badge">Why Fitness First</span>

          {/* Short punchy headline */}
          <h2>
            Train Smarter.<br />
            <span className="why-highlight">Get Real Results.</span>
          </h2>

          {/* Short description — 2 lines max */}
          <p className="why-intro">
            Expert coaching, smart technology, and proven training systems,
            all in one place. Built for people who are serious about results.
          </p>

          {/* Feature cards — 2x2 grid */}
          <div className="why-features">
            {FEATURES.map((feature, i) => (
              <div className="why-feature-card" key={i}>
                <span className="feature-icon">{feature.icon}</span>
                <div>
                  <p className="feature-title">{feature.title}</p>
                  <p className="feature-desc">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/*RIGHT — Image with stat overlay */}
        <div className="why-image">
          <img src={fitnessImg} alt="Fitness First App" />

          {/* Floating stat cards overlaid on the image */}
          <div className="why-stat top-left">
            <span className="stat-num">48+</span>
            <span className="stat-lbl">Workouts</span>
          </div>

          <div className="why-stat bottom-right">
            <span className="stat-num">500+</span>
            <span className="stat-lbl">Members</span>
          </div>

          <div className="why-stat bottom-left">
            <span className="stat-num">4</span>
            <span className="stat-lbl">Programs</span>
          </div>

        </div>

      </div>
    </section>
  );
}