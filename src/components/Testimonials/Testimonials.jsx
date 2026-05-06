import { useEffect, useState } from 'react';
import './Testimonials.css';


// StarRating — renders filled/empty stars
function StarRating({ rating, interactive = false, onSelect }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : 'empty'} ${interactive ? 'clickable' : ''}`}
          onClick={() => interactive && onSelect && onSelect(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}


// Avatar — shows initials circle e.g. "Mike Young" → "MY"
function Avatar({ firstName, lastName }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return <div className="testimonial-avatar">{initials}</div>;
}


// TestimonialCard — single review card─
function TestimonialCard({ testimonial }) {
  return (
    <div className="testimonial-card">
      {/* Top row — avatar + name + stars */}
      <div className="testimonial-top">
        <Avatar firstName={testimonial.first_name} lastName={testimonial.last_name} />
        <div className="testimonial-meta">
          <p className="testimonial-name">
            {testimonial.first_name} {testimonial.last_name}
          </p>
          <StarRating rating={testimonial.rating} />
        </div>
      </div>

      {/* Review quote */}
      <p className="testimonial-review">"{testimonial.review}"</p>

      {/* Date */}
      <p className="testimonial-date">
        {new Date(testimonial.created_at).toLocaleDateString('en-US', {
          month: 'long', year: 'numeric'
        })}
      </p>
    </div>
  );
}


// SubmitForm — modal form for logged-in users to submit a testimonial
function SubmitForm({ onClose, onSubmitted }) {
  const [rating, setRating]   = useState(5);
  const [review, setReview]   = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!review.trim() || review.trim().length < 10) {
      setIsError(true);
      setMessage('Please write at least 10 characters.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, review })
      });

      const data = await res.json();

      if (data.success) {
        setIsError(false);
        setMessage(' Thank you! Your review will appear after approval.');
        // Tell parent to refresh testimonials
        setTimeout(() => {
          onSubmitted();
          onClose();
        }, 2000);
      } else {
        setIsError(true);
        setMessage(data.message || 'Submission failed. Try again.');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Server error. Is your backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop — clicking outside closes form
    <div className="form-backdrop" onClick={onClose}>
      <div className="submit-form" onClick={e => e.stopPropagation()}>
        <h3>Share Your Experience</h3>
        <p className="form-subtitle">Your review helps others start their fitness journey</p>

        {/* Star picker */}
        <label className="form-label">Your Rating</label>
        <StarRating rating={rating} interactive onSelect={setRating} />

        {/* Review text */}
        <label className="form-label">Your Review</label>
        <textarea
          className="review-input"
          placeholder="Tell us about your experience with Fitness First…"
          value={review}
          onChange={e => setReview(e.target.value)}
          rows={4}
          maxLength={300}
        />
        <p className="char-count">{review.length}/300</p>

        {/* Feedback message */}
        {message && (
          <p className={`form-feedback ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}

        {/* Buttons */}
        <div className="form-btns">
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


// Main Testimonials component
export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);

  // Check if user is logged in to show/hide submit button
  const isLoggedIn = !!localStorage.getItem('user');

  const fetchTestimonials = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/testimonials`);
      const data = await res.json();
      if (data.success) setTestimonials(data.testimonials);
    } catch (err) {
      console.error('Fetch testimonials error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchTestimonials();
  }, []);

  return (
    <section className="testimonials-section">

      {/* Section header */}
      <div className="testimonials-header">
        <h2>What Our Members Say</h2>
        <p className="testimonials-subtitle">
          Real results from real people. Join hundreds of members transforming their lives.
        </p>

        {/* Only logged-in users can submit a review */}
        {isLoggedIn && (
          <button
            className="write-review-btn"
            onClick={() => setShowForm(true)}
          >
            ✍️ Write a Review
          </button>
        )}
      </div>

      {/* Submit form modal */}
      {showForm && (
        <SubmitForm
          onClose={() => setShowForm(false)}
          onSubmitted={fetchTestimonials}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="testimonials-loading">Loading reviews…</div>
      )}

      {/* Empty state */}
      {!loading && testimonials.length === 0 && (
        <div className="testimonials-empty">
          <p>No reviews yet. Be the first to share your experience! </p>
        </div>
      )}

      {/* Cards grid — 3 per row */}
      {!loading && testimonials.length > 0 && (
        <div className="testimonials-grid">
          {testimonials.map(t => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      )}

    </section>
  );
}