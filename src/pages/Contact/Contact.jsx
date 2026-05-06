import { useState } from 'react';
import "./Contact.css";

export default function Contact() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');

  // UI feedback
  const [status, setStatus]   = useState('');   // success or error message
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false); // disable button while sending

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page reload
    setStatus('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (data.success) {
        setIsError(false);
        setStatus(' Message sent successfully! We will get back to you soon.');

        // Clear the form after success
        setName('');
        setEmail('');
        setMessage('');

        // Clear the success message after 5 seconds
        setTimeout(() => setStatus(''), 5000);

      } else {
        setIsError(true);
        setStatus(data.message || 'Something went wrong. Try again.');
      }

    } catch (err) {
      console.error('Contact error:', err);
      setIsError(true);
      setStatus('Server error. Is your backend running?');
    } finally {
      setLoading(false); // always re-enable the button
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact-glass">
        <h2>Get In Touch</h2>
        <p>
          Ready to start your fitness journey?
          Reach out and let's build your strength together.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            placeholder="Your Message"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          {/* Disable button while request is in flight */}
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        {/* Show success or error feedback */}
        {status && (
          <p className={`contact-status ${isError ? 'error' : 'success'}`}>
            {status}
          </p>
        )}
      </div>
    </section>
  );
}