import { useState } from 'react';
import './FAQ.css';


// FAQ data — all questions and answers in one place
// Easy to add/remove/edit without touching the component logic
const FAQS = [
  {
    id: 1,
    question: 'What equipment do I need?',
    answer: 'Most of our workouts require little to no equipment. Bodyweight exercises, resistance bands, and basic dumbbells cover the majority of our programs. Some strength training workouts may require a barbell or gym access, but we always provide equipment-free alternatives.',
  },
  {
    id: 2,
    question: 'Can beginners join?',
    answer: 'Absolutely! Fitness First is designed for all fitness levels. Every workout includes a significance badge (Beginner, Intermediate, Advanced) so you always know what to expect. Our Yoga & Recovery and Fat Loss programs are perfect starting points for beginners.',
  },
  {
    id: 3,
    question: 'How do I track my progress?',
    answer: 'Once logged in, click the "Mark as Complete" button on any workout card. Your completions are saved to your personal progress page which shows your total workouts, current daily streak, weekly activity chart, and full completion history.',
  },
  {
    id: 4,
    question: 'Can I use it on my phone?',
    answer: 'Yes! Fitness First is fully responsive and works smoothly on any device; phone, tablet or desktop. You can browse workouts, watch video tutorials, mark completions, and track your progress all from your mobile browser with no app download required.',
  },
];


// FAQItem — single accordion item
// openId — the id of the currently open item
// onToggle — called when this item is clicked
function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div
      className={`faq-item ${isOpen ? 'open' : ''}`}
      onClick={onToggle}
    >
      {/* Question row — always visible */}
      <div className="faq-question">
        <span className="faq-q-text">{faq.question}</span>

        {/* Rotating arrow icon — points down when closed, up when open */}
        <span className={`faq-arrow ${isOpen ? 'rotated' : ''}`}>›</span>
      </div>

      {/* Answer — only visible when open
          max-height animation trick:
          closed = max-height: 0 (hidden)
          open   = max-height: 300px (visible)
          CSS transition handles the smooth slide */}
      <div className={`faq-answer ${isOpen ? 'visible' : ''}`}>
        <p>{faq.answer}</p>
      </div>
    </div>
  );
}


// Main FAQ component
export default function FAQ() {
  // openId tracks which FAQ is currently expanded
  // null = all closed, number = that FAQ is open
  // Only one FAQ can be open at a time
  const [openId, setOpenId] = useState(null);

  const handleToggle = (id) => {
    // If clicking the already-open item → close it (set to null)
    // If clicking a different item → open it (set to its id)
    setOpenId(prev => prev === id ? null : id);
  };

  return (
    <section className="faq-section">

      {/* Section header */}
      <div className="faq-header">
        <h2>Frequently Asked Questions</h2>
        <p className="faq-subtitle">
          Everything you need to know before getting started.
        </p>
      </div>

      {/* FAQ accordion list */}
      <div className="faq-list">
        {FAQS.map(faq => (
          <FAQItem
            key={faq.id}
            faq={faq}
            isOpen={openId === faq.id}
            onToggle={() => handleToggle(faq.id)}
          />
        ))}
      </div>

    </section>
  );
}