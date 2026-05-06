import { useEffect, useRef } from 'react';
import './Stats.css';
import strengthImg from '../../assets/strength.webp';
import clockImg    from '../../assets/clock.webp';
import memberImg   from '../../assets/members.webp';
import starImg     from '../../assets/star.webp';

// Stats data — defined outside the component so it never gets recreated.
// target      — the final number the count-up animates to
// suffix      — text appended after the number (e.g. "+" or "k+" or "/7")
// isDecimal   — whether to show one decimal place (used for 4.9)
// accentColor — the unique color for each card's top border and number
const STATS = [
  {
    img:         strengthImg,
    alt:         'Strength icon',
    target:      500,
    suffix:      '+',
    isDecimal:   false,
    label:       'Workouts',
    desc:        'Across 4 categories for every fitness level.',
    accentColor: '#e53e3e',
    glowColor:   'rgba(229, 62, 62, 0.25)',
    iconBg:      'rgba(229, 62, 62, 0.12)',
  },
  {
    img:         memberImg,
    alt:         'Members icon',
    target:      10,
    suffix:      'k+',
    isDecimal:   false,
    label:       'Members',
    desc:        'Active users training with our platform.',
    accentColor: '#2979FF',
    glowColor:   'rgba(41, 121, 255, 0.25)',
    iconBg:      'rgba(41, 121, 255, 0.12)',
  },
  {
    img:         clockImg,
    alt:         'Clock icon',
    target:      24,
    suffix:      '/7',
    isDecimal:   false,
    label:       'Access',
    desc:        'Train anytime, anywhere, on any device.',
    accentColor: '#10b981',
    glowColor:   'rgba(16, 185, 129, 0.25)',
    iconBg:      'rgba(16, 185, 129, 0.12)',
  },
  {
    img:         starImg,
    alt:         'Star icon',
    target:      4.9,
    suffix:      '',
    isDecimal:   true,
    label:       'Rating',
    desc:        'Based on verified member reviews',
    accentColor: '#f59e0b',
    glowColor:   'rgba(245, 158, 11, 0.25)',
    iconBg:      'rgba(245, 158, 11, 0.12)',
  },
];

export default function Stats() {
  const sectionRef = useRef(null);
  const animated   = useRef(false); // prevents re-running animation if component re-renders

  useEffect(() => {
    // IntersectionObserver watches when the stats section scrolls into view.
    // Once it's 20% visible, the count-up starts. The 'animated' ref prevents
    // it from restarting if the user scrolls away and back.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          runCountUp();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const runCountUp = () => {
    const numberEls = document.querySelectorAll('.stat-number[data-target]');

    numberEls.forEach((el) => {
      const target    = parseFloat(el.dataset.target);
      const suffix    = el.dataset.suffix;
      const isDecimal = el.dataset.decimal === 'true';
      const duration  = 2000; // total animation time in ms
      const steps     = 50;   // number of increments
      const increment = target / steps;
      let   current   = 0;
      let   count     = 0;

      const timer = setInterval(() => {
        count++;
        current = Math.min(current + increment, target);
        // Format: 1 decimal place for rating, integer for everything else
        el.textContent = (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
        if (count >= steps) clearInterval(timer);
      }, duration / steps);
    });
  };

  return (
    <section className="stats" ref={sectionRef}>

      <div className="stats-header">
        <p className="stats-eyebrow">By the numbers</p>
        <h2 className="stats-title">Why members choose us?</h2>
      </div>

      <div className="stats-container">
        {STATS.map((stat) => (
          <div
            className="stat-card"
            key={stat.label}
            style={{
              borderTopColor: stat.accentColor,
              '--glow-color':  stat.glowColor,
            }}
          >
            {/* Icon — same images as before, wrapped in a colored background circle */}
            <div className="stat-icon-wrapper" style={{ background: stat.iconBg }}>
              <img src={stat.img} alt={stat.alt} className="stat-icon-img" />
            </div>

            {/* Count-up number — data attributes read by the JS animation */}
            <h2
              className="stat-number"
              data-target={stat.target}
              data-suffix={stat.suffix}
              data-decimal={stat.isDecimal}
              style={{ color: stat.accentColor }}
            >
              0{stat.suffix}
            </h2>

            <p className="stat-label">{stat.label}</p>
            <p className="stat-desc">{stat.desc}</p>
          </div>
        ))}
      </div>

    </section>
  );
}
