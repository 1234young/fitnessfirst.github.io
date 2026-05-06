import './Pricing.css';
import { useEffect } from "react";


export default function Pricing() {
   useEffect(() => {
    const cards = document.querySelectorAll(".pricing-card");

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("show");
            }, index * 120); // stagger
          }
        });
      },
      { threshold: 0.2 }
    );

    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);
  return (
    <section className="pricing">
      <div className="pricing-header">
        <h2>Membership Plans</h2>
        <p>Simple, transparent pricing. No hidden fees.</p>
      </div>

      <div className="pricing-grid">
        {/* Basic */}
        <div className="pricing-card">
          <h3>Basic</h3>
          <p className="price">$19<span>/month</span></p>
          <ul>
            <li>Access to gym equipment</li>
            <li>1 group class per week</li>
            <li>Locker room access</li>
          </ul>
          <button className="pricing-btn">Get Started</button>
        </div>

        {/* Popular */}
        <div className="pricing-card popular">
          <span className="badge">Most Popular</span>
          <h3>Standard</h3>
          <p className="price">$39<span>/month</span></p>
          <ul>
            <li>Everything in Basic</li>
            <li>Unlimited group classes</li>
            <li>1 personal training session/month</li>
          </ul>
          <button className="pricing-btn primary">Join Now</button>
        </div>

        {/* Premium */}
        <div className="pricing-card">
          <h3>Premium</h3>
          <p className="price">$59<span>/month</span></p>
          <ul>
            <li>Everything in Standard</li>
            <li>Weekly personal training</li>
            <li>Nutrition & recovery support</li>
          </ul>
          <button className="pricing-btn">Go Premium</button>
        </div>
      </div>
    </section>
  );
}