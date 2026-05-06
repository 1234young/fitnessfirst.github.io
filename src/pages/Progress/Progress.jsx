import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Progress.css';
import progressIcon from '../../assets/progress-tracker.svg';

export default function Progress() {
  const navigate = useNavigate();

  const [stats, setStats]           = useState(null);       // data from /api/progress/stats
  const [logSummary, setLogSummary] = useState(null);       // data from /api/logs/summary
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }

      try {
        // Fetch both endpoints simultaneously with Promise.all —
        // faster than awaiting them one at a time since they are independent.
        // progressRes → workout completions (Mark as Complete button data)
        // logsRes     → set-by-set log data (Log Session button data)
        const [progressRes, logsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/progress/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/logs/summary`,   { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const progressData = await progressRes.json();
        const logsData     = await logsRes.json();

        if (progressData.success) {
          setStats(progressData.stats);
        } else {
          setError(progressData.message || 'Failed to load progress.');
        }

        // logSummary is optional — if it fails we just don't show the log section
        if (logsData.success) {
          setLogSummary(logsData.summary);
        }

      } catch (err) {
        setError('Server error. Is your backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="progress-page">
        <div className="progress-loading">Loading your progress…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="progress-page">
        <div className="progress-error">⚠️ {error}</div>
      </section>
    );
  }

  // Build last 7 days labels (Mon, Tue etc.) and match with DB data.
  // This shows 0 for days with no workout completions.
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // go back 6 days from today
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }), // e.g. "Mon"
      date:  d.toISOString().split('T')[0],                        // e.g. "2026-04-03"
      count: 0                                                      // overwritten below if DB has data
    };
  });

  // Fill in actual completion counts from DB into the 7-day array
  stats.weeklyData.forEach(({ day, count }) => {
    const match = last7Days.find(d => d.date === day);
    if (match) match.count = count;
  });

  // Find max count for scaling the bar chart bars.
  // || 1 prevents division by zero if all days have 0 completions.
  const maxCount = Math.max(...last7Days.map(d => d.count)) || 1;

  // Build last 7 days for the SETS bar chart from logSummary.weeklyData.
  // Same pattern as above but sourced from workout_logs instead of progress.
  const last7DaysSets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date:  d.toISOString().split('T')[0],
      count: 0
    };
  });

  // Fill in set counts from logSummary if it loaded successfully
  if (logSummary?.weeklyData) {
    logSummary.weeklyData.forEach(({ day, count }) => {
      const match = last7DaysSets.find(d => d.date === day);
      if (match) match.count = count;
    });
  }

  const maxSetCount = Math.max(...last7DaysSets.map(d => d.count)) || 1;

  return (
    <section className="progress-page">
      <div className="progress-container">

        {/* ── Header ── */}
        <div className="progress-header">
          <h1>
            <img src={progressIcon} alt="Progress" className="nav-avatar-icon" />
            My Progress
          </h1>
          <button className="back-btn" onClick={() => navigate('/workouts')}>
            ← Back to Workouts
          </button>
        </div>

        {/*  WORKOUT COMPLETION STAT CARDS */}
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Workouts</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.streak}</span>
            <span className="stat-label">🔥 Day Streak</span>
          </div>
          <div className="stat-card">
            {/* Count completions this week only by summing the 7-day array */}
            <span className="stat-number">
              {last7Days.reduce((sum, d) => sum + d.count, 0)}
            </span>
            <span className="stat-label">This Week</span>
          </div>
        </div>

        {/* WORKOUT LOG STAT CARDS (only shown if user has logged sets) */}
        {logSummary && (
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-number">{logSummary.totalSets}</span>
              <span className="stat-label">💪 Total Sets Logged</span>
            </div>
            <div className="stat-card">
              {/* toLocaleString adds thousand separators e.g. 12345 → "12,345" */}
              <span className="stat-number">
                {Number(logSummary.totalVolume).toLocaleString()} kg
              </span>
              <span className="stat-label">🏋️ Total Volume Lifted</span>
            </div>
            <div className="stat-card">
              {/* Sets logged this week from the sets bar chart data */}
              <span className="stat-number">
                {last7DaysSets.reduce((sum, d) => sum + d.count, 0)}
              </span>
              <span className="stat-label"> Sets This Week</span>
            </div>
          </div>
        )}

        {/*  LAST 7 DAYS COMPLETION BAR CHART  */}
        <div className="progress-card">
          <h3>Workouts Completed — Last 7 Days</h3>
          <div className="bar-chart">
            {last7Days.map((day, i) => (
              <div className="bar-col" key={i}>
                <span className="bar-count">{day.count > 0 ? day.count : ''}</span>
                <div className="bar-wrapper">
                  {/* Bar height is proportional to max count.
                      e.g. if max is 4 and this day has 2 → height is 50% */}
                  <div
                    className={`bar ${day.count > 0 ? 'active' : ''}`}
                    style={{ height: `${(day.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LAST 7 DAYS SETS BAR CHART (only shown if user has logged sets)*/}
        {logSummary && (
          <div className="progress-card">
            <h3>Sets Logged — Last 7 Days</h3>
            <div className="bar-chart">
              {last7DaysSets.map((day, i) => (
                <div className="bar-col" key={i}>
                  <span className="bar-count">{day.count > 0 ? day.count : ''}</span>
                  <div className="bar-wrapper">
                    <div
                      className={`bar sets-bar ${day.count > 0 ? 'active' : ''}`}
                      style={{ height: `${(day.count / maxSetCount) * 100}%` }}
                    />
                  </div>
                  <span className="bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT SETS LOGGED  */}
        {logSummary?.recentSets?.length > 0 && (
          <div className="progress-card">
            <h3>Recent Sets Logged</h3>
            <ul className="history-list">
              {logSummary.recentSets.map(item => (
                <li key={item.id} className="history-item">
                  <div className="history-left">
                    <span className="history-icon">🏋️</span>
                    <div>
                      <p className="history-name">{item.workout_name}</p>
                      {/* Show set number, reps, and weight — or "bodyweight" if weight is 0 */}
                      <p className="history-category">
                        Set {item.set_number} — {item.reps} reps
                        {item.weight > 0 ? ` @ ${item.weight} kg` : ' (bodyweight)'}
                      </p>
                    </div>
                  </div>
                  <span className="history-date">
                    {new Date(item.logged_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* WORKOUT COMPLETION HISTORY */}
        <div className="progress-card">
          <h3>Recent Completions</h3>

          {stats.history.length === 0 ? (
            <p className="no-history">
              No workouts completed yet. Go mark some as done!
            </p>
          ) : (
            <ul className="history-list">
              {stats.history.map(item => (
                <li key={item.id} className="history-item">
                  <div className="history-left">
                    <span className="history-icon">✅</span>
                    <div>
                      <p className="history-name">{item.workout_name}</p>
                      <p className="history-category">{item.category}</p>
                    </div>
                  </div>
                  <span className="history-date">
                    {/* Format: "Apr 3, 2026" */}
                    {new Date(item.completed_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </section>
  );
}
