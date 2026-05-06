import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookingHistory.css';

// STATUS_STYLES is a lookup object — instead of writing if/else for every status,
// just do STATUS_STYLES[b.status] and get the color, background, and label in one go.
// e.g. STATUS_STYLES['approved'] → { color: '#10b981', bg: '#d1fae5', label: '✅ Approved' }
const STATUS_STYLES = {
  pending:  { color: '#f59e0b', bg: '#fef3c7', label: '⏳ Pending'  },
  approved: { color: '#10b981', bg: '#d1fae5', label: '✅ Approved' },
  rejected: { color: '#ef4444', bg: '#fee2e2', label: '❌ Rejected' },
};

export default function BookingHistory() {
  const navigate = useNavigate();

  const [bookings, setBookings]         = useState([]);   // list of user's bookings from DB
  const [loading, setLoading]           = useState(true); // true while fetching from backend
  const [error, setError]               = useState('');   // error message if fetch fails

  // rescheduleId tracks WHICH booking card is currently showing the reschedule form.
  // Only one card can be in "reschedule mode" at a time.
  const [rescheduleId, setRescheduleId] = useState(null);

  // newMessage holds the textarea value inside the reschedule form.
  // Pre-filled with the booking's existing message when the user clicks Reschedule.
  const [newMessage, setNewMessage]     = useState('');

  // successMsg shows a green banner after cancel or reschedule succeeds.
  // Auto-clears after 3.5 seconds via the flash() helper below.
  const [successMsg, setSuccessMsg]     = useState('');

  // Read token once at component level — reused in every fetch call below
  const token = localStorage.getItem('token');

  // useEffect with empty [] runs ONCE when the component first mounts.
  // Guards against unauthenticated access: if no token, redirect to home immediately.
  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchBookings();
  }, []);

  // Fetches only THIS user's bookings from /api/bookings/mine.
  // The backend reads the JWT token to identify the user and filters by user_id.
  // Defined as a named function (not inline in useEffect) so it can be called
  // again after reschedule to refresh the list without a full page reload.
  const fetchBookings = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
      else setError(data.message || 'Failed to load bookings.');
    } catch {
      setError('Server error. Is your backend running?');
    } finally {
      // finally always runs — turns off the loading spinner whether fetch
      // succeeded or failed, so the user never sees a stuck loading screen
      setLoading(false);
    }
  };

  // Sends DELETE /api/bookings/:id/cancel to the backend.
  // window.confirm() blocks until the user clicks OK or Cancel in the browser dialog —
  // if they click Cancel, return early and do nothing.
  // On success,  use .filter() to remove the cancelled booking from local state, immediately so the UI updates without needing another fetch.
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${id}/cancel`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter out the deleted booking from the local array.
        // prev is the current bookings array; we return a new array without the cancelled one.
        setBookings(prev => prev.filter(b => b.id !== id));
        flash('Booking cancelled.');
      } else {
        alert(data.message);
      }
    } catch {
      alert('Server error.');
    }
  };

  // Sends PATCH /api/bookings/:id/reschedule with the updated message.
  // The backend resets the status back to 'pending' so the admin re-reviews it.
  // After success: closes the inline form, clears the textarea, and re-fetches
  // the full bookings list so the updated message and status show immediately.
  const handleReschedule = async (id) => {
    // Guard: don't send an empty message
    if (!newMessage.trim()) return;
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      const data = await res.json();
      if (data.success) {
        setRescheduleId(null); // close the inline form
        setNewMessage('');     // clear the textarea
        fetchBookings();       // re-fetch so updated message + status appear
        flash('Booking updated. Awaiting re-approval.');
      } else {
        alert(data.message);
      }
    } catch {
      alert('Server error.');
    }
  };

  // flash() shows a temporary success banner for 3.5 seconds then hides it.
  // setTimeout returns a timer ID but we don't need to cancel it here —
  // the worst case is the banner disappears 3.5s after the last action.
  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Early returns for loading and error states —
  // these render a minimal UI before the full component tree is built
  if (loading) return <section className="bh-page"><p className="bh-loading">Loading your bookings…</p></section>;
  if (error)   return <section className="bh-page"><p className="bh-error">⚠️ {error}</p></section>;

  return (
    <section className="bh-page">
      <div className="bh-container">

        <div className="bh-header">
          <h1> My Bookings</h1>
          <button className="bh-back-btn" onClick={() => navigate('/trainers')}>
            ← Back to Trainers
          </button>
        </div>

        {/* Flash banner — only mounts when successMsg is a non-empty string */}
        {successMsg && <div className="bh-success">{successMsg}</div>}

        {/* If the user has no bookings, show an empty state with a CTA button.
            Otherwise map over the bookings array and render one card per booking. */}
        {bookings.length === 0 ? (
          <div className="bh-empty">
            <p>You have no bookings yet.</p>
            <button className="bh-book-btn" onClick={() => navigate('/trainers')}>
              Book a Trainer
            </button>
          </div>
        ) : (
          <div className="bh-list">
            {bookings.map(b => {

              // Look up the style for this booking's status.
              // If b.status is somehow not in STATUS_STYLES (e.g. a new DB value),
              // fall back to the 'pending' style so the UI never breaks.
              const s = STATUS_STYLES[b.status] || STATUS_STYLES.pending;

              return (
                <div className="bh-card" key={b.id}>

                  <div className="bh-card-top">
                    <div>
                      <h3 className="bh-trainer">{b.trainer}</h3>
                      <p className="bh-date">
                        {/* toLocaleDateString formats the raw DB timestamp
                            e.g. "2026-04-03T00:00:00.000Z" → "April 3, 2026" */}
                        📅 {new Date(b.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                      <p className="bh-message">💬 {b.message}</p>
                    </div>

                    {/* Status badge — inline styles applied dynamically from STATUS_STYLES
                        so each status gets its own unique color without extra CSS classes */}
                    <span
                      className="bh-status"
                      style={{ color: s.color, background: s.bg }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Conditional rendering: if THIS card's id matches rescheduleId,
                      show the inline reschedule form instead of the action buttons.
                      This means only one card is ever in "edit mode" at a time. */}
                  {rescheduleId === b.id ? (
                    <div className="bh-reschedule-form">
                      <textarea
                        placeholder="Describe your new preferred schedule…"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <div className="bh-reschedule-actions">
                        <button
                          className="bh-confirm-btn"
                          onClick={() => handleReschedule(b.id)}
                        >
                          Confirm
                        </button>
                        {/* Discard closes the form and resets the textarea
                            without sending anything to the backend */}
                        <button
                          className="bh-cancel-btn"
                          onClick={() => { setRescheduleId(null); setNewMessage(''); }}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Default view: show Reschedule and Cancel buttons.
                    // Clicking Reschedule sets rescheduleId to this card's id AND
                    // pre-fills the textarea with the existing message so the user
                    // can edit it rather than rewrite from scratch.
                    <div className="bh-card-actions">
                      <button
                        className="bh-reschedule-btn"
                        onClick={() => { setRescheduleId(b.id); setNewMessage(b.message); }}
                      >
                        🔄 Reschedule
                      </button>
                      <button
                        className="bh-cancel-btn"
                        onClick={() => handleCancel(b.id)}
                      >
                        🗑 Cancel
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
