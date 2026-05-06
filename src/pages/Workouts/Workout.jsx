import { useEffect, useState, useRef, useCallback } from "react";
import './Workout.css';

import strengthImg from '../../assets/strength.webp';
import fatLossImg  from '../../assets/fat-loss.webp';
import hiitImg     from '../../assets/hiit.webp';
import yogaImg     from '../../assets/yoga.webp';

const SECTIONS = [
  { key: 'Strength Training', image: strengthImg, label: 'Strength Training', subtitle: 'Build muscle and increase overall strength'   },
  { key: 'Fat Loss',          image: fatLossImg,  label: 'Fat Loss',          subtitle: 'Burn calories and shed body fat'              },
  { key: 'HIIT',              image: hiitImg,     label: 'HIIT',              subtitle: 'High-intensity intervals for maximum results' },
  { key: 'Yoga & Recovery',   image: yogaImg,     label: 'Yoga & Recovery',   subtitle: 'Restore, stretch, and recover'               },
];

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function SkeletonCard() {
  return (
    <div className="workout-card skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <div className="skeleton-box" />
    </div>
  );
}

//  WORKOUT MODE MODAL 
// Full-screen overlay that appears when user clicks "Start Workout". Contains:
//   1. Elapsed workout timer — counts up from 0
//   2. Set/rep/weight input — logs each set to the DB immediately
//   3. Rest timer — countdown between sets, starts automatically after each set
function WorkoutMode({ workout, onClose }) {
  const token = localStorage.getItem('token');

  // Elapsed workout timer 
  const [elapsed, setElapsed]     = useState(0);   // seconds since workout started
  const elapsedRef                = useRef(null);

  //  Set tracking 
  const [sets, setSets]           = useState([]);   // completed sets this session
  const [reps, setReps]           = useState('');
  const [weight, setWeight]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [flash, setFlash]         = useState('');

  // Rest timer, resting = true means the rest countdown is active
  // restRemaining counts down from REST_SECONDS to 0
  const REST_SECONDS              = 60;
  const [resting, setResting]     = useState(false);
  const [restRemaining, setRestRemaining] = useState(REST_SECONDS);
  const restRef                   = useRef(null);

  // Phase label, Shows "Workout" during active set and "Rest" during rest period
  const phase = resting ? 'Rest' : 'Workout';

  // Start elapsed timer on mount — clears on unmount
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  // Rest timer — starts when resting = true, stops at 0
  useEffect(() => {
    if (!resting) return;
    setRestRemaining(REST_SECONDS);
    restRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current);
          setResting(false);
          return REST_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [resting]);

  // Format seconds → MM:SS string e.g. 75 → "1:15"
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Flash feedback message — auto-clears after 2.5s
  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  };

  // Log a set — sends to /api/logs/:workoutId and adds to local list
  const handleLogSet = async () => {
    if (!reps || isNaN(reps) || Number(reps) <= 0) {
      showFlash('Enter a valid rep count first.');
      return;
    }
    setSaving(true);
    try {
      const setNumber = sets.length + 1;
      const res = await fetch(`/api/logs/${workout.id}`, {
        method:  'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body:    JSON.stringify({
          set_number: setNumber,
          reps:       Number(reps),
          weight:     Number(weight) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSets(prev => [...prev, { setNumber, reps: Number(reps), weight: Number(weight) || 0 }]);
        setReps('');
        setWeight('');
        showFlash(`Set ${setNumber} saved! Rest time starting…`);
        // Auto-start rest timer after each logged set
        setResting(true);
      } else {
        showFlash(data.message || 'Failed to save set.');
      }
    } catch {
      showFlash('Server error. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Skip rest — user can dismiss rest timer early and go straight to next set
  const skipRest = () => {
    clearInterval(restRef.current);
    setResting(false);
  };

  // Rest timer progress ring — SVG circle that depletes as time passes
  const RING_RADIUS  = 54;
  const RING_CIRCUM  = 2 * Math.PI * RING_RADIUS;
  const restProgress = restRemaining / REST_SECONDS; // 1 → 0

  return (
    <div className="wm-backdrop">
      <div className="wm-modal">

        {/*  Header  */}
        <div className="wm-header">
          <div>
            <h2 className="wm-title">{workout.name}</h2>
            <span className="wm-phase-badge" data-phase={phase}>{phase}</span>
          </div>
          <button className="wm-close" onClick={onClose} title="End workout">✕</button>
        </div>

        {/*  Elapsed timer */}
        <div className="wm-elapsed">
          <span className="wm-elapsed-label">Total time</span>
          <span className="wm-elapsed-time">{formatTime(elapsed)}</span>
        </div>

        {/*  Rest timer (shown during rest phase) */}
        {resting && (
          <div className="wm-rest">
            <p className="wm-rest-label">Rest — next set in</p>

            {/* SVG progress ring depletes as rest time counts down */}
            <div className="wm-ring-wrapper">
              <svg className="wm-ring" viewBox="0 0 120 120">
                {/* Background track */}
                <circle cx="60" cy="60" r={RING_RADIUS}
                  fill="none" stroke="#2a2a45" strokeWidth="8" />
                {/* Foreground arc — strokeDashoffset shrinks as time passes */}
                <circle cx="60" cy="60" r={RING_RADIUS}
                  fill="none" stroke="#e53e3e" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUM}
                  strokeDashoffset={RING_CIRCUM * (1 - restProgress)}
                  transform="rotate(-90 60 60)" />
                <text x="60" y="65" textAnchor="middle"
                  fontSize="22" fontWeight="800" fill="#fff">
                  {formatTime(restRemaining)}
                </text>
              </svg>
            </div>

            <button className="wm-skip-rest" onClick={skipRest}>
              Skip Rest →
            </button>
          </div>
        )}

        {/*  Set input (shown during active phase)  */}
        {!resting && (
          <div className="wm-inputs">
            <p className="wm-set-label">
              Set {sets.length + 1}
              {sets.length > 0 && (
                <span className="wm-prev-set">
                  {' '}— last: {sets[sets.length - 1].reps} reps
                  {sets[sets.length - 1].weight > 0
                    ? ` @ ${sets[sets.length - 1].weight}kg`
                    : ' (bodyweight)'}
                </span>
              )}
            </p>

            <div className="wm-input-row">
              <div className="wm-input-group">
                <label>Reps *</label>
                <input
                  type="number" min="1" placeholder="e.g. 12"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogSet()}
                  autoFocus
                />
              </div>
              <div className="wm-input-group">
                <label>Weight (kg)</label>
                <input
                  type="number" min="0" step="0.5" placeholder="0 = bodyweight"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogSet()}
                />
              </div>
            </div>

            <button
              className="wm-log-btn"
              onClick={handleLogSet}
              disabled={saving}
            >
              {saving ? 'Saving…' : `✓ Log Set ${sets.length + 1}`}
            </button>

            {flash && <p className="wm-flash">{flash}</p>}
          </div>
        )}

        {/*  Completed sets table  */}
        {sets.length > 0 && (
          <div className="wm-sets-section">
            <p className="wm-sets-heading">Completed Sets</p>
            <div className="wm-sets-table">
              <div className="wm-sets-row wm-sets-header">
                <span>Set</span><span>Reps</span><span>Weight</span>
              </div>
              {sets.map((s, i) => (
                <div className="wm-sets-row" key={i}>
                  <span>{s.setNumber}</span>
                  <span>{s.reps}</span>
                  <span>{s.weight > 0 ? `${s.weight} kg` : '—'}</span>
                </div>
              ))}
            </div>
            <p className="wm-sets-summary">
              {sets.length} {sets.length === 1 ? 'set' : 'sets'} completed
              {sets.reduce((sum, s) => sum + s.reps * s.weight, 0) > 0 &&
                ` · ${sets.reduce((sum, s) => sum + s.reps * s.weight, 0).toLocaleString()} kg total volume`
              }
            </p>
          </div>
        )}

        {/*  Finish workout button */}
        <button className="wm-finish-btn" onClick={onClose}>
           Finish Workout
        </button>

      </div>
    </div>
  );
}

//  COMPLETE BUTTON 
function CompleteButton({ workoutId }) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleComplete = async () => {
    if (loading || completed) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/progress/${workoutId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCompleted(true);
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`complete-btn ${completed ? 'done' : ''}`}
      onClick={handleComplete}
      disabled={loading || completed}
    >
      {completed ? '✅ Completed!' : loading ? 'Saving…' : '🏁 Mark as Complete'}
    </button>
  );
}

//  HEART BUTTON 
function HeartButton({ workoutId, initialFavourited }) {
  const [favourited, setFavourited] = useState(initialFavourited);
  const [loading, setLoading]       = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    setFavourited(prev => !prev);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/favourites/${workoutId}`, {
        method:  favourited ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Favourite toggle error:', err);
      setFavourited(prev => !prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`heart-btn ${favourited ? 'favourited' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={favourited ? 'Remove from favourites' : 'Add to favourites'}
    >
      {favourited ? '❤️' : '🤍'}
    </button>
  );
}

//  WORKOUT VIDEO 
function WorkoutVideo({ workout, videoData }) {
  const [playing, setPlaying] = useState(false);

  if (!videoData)        return <div className="video-placeholder shimmer">Finding video…</div>;
  if (videoData.error)   return <div className="video-placeholder error">No video found for this workout.</div>;

  const videoId   = videoData.embedUrl?.split('/embed/')[1]?.split('?')[0];
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="workout-video">
      {playing ? (
        <iframe width="100%" height="215"
          src={`${videoData.embedUrl}?autoplay=1`}
          title={videoData.title || workout.name}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen />
      ) : (
        <div className="video-thumbnail" onClick={() => setPlaying(true)}>
          <img src={thumbnail} alt={videoData.title || workout.name} />
          <div className="play-btn">▶</div>
        </div>
      )}
      {videoData.channel && <p className="video-credit">📺 {videoData.channel}</p>}
    </div>
  );
}

//  LOG SESSION (inline quick logger — kept for backwards compat) 
function LogSession({ workoutId }) {
  const [open, setOpen]     = useState(false);
  const [sets, setSets]     = useState([]);
  const [reps, setReps]     = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash]   = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };

  const handleLogSet = async () => {
    if (!reps || isNaN(reps) || Number(reps) <= 0) { showFlash('Enter a valid rep count.'); return; }
    setSaving(true);
    try {
      const token     = localStorage.getItem('token');
      const setNumber = sets.length + 1;
      const res  = await fetch(`/api/logs/${workoutId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ set_number: setNumber, reps: Number(reps), weight: Number(weight) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setSets(prev => [...prev, { setNumber, reps: Number(reps), weight: Number(weight) || 0 }]);
        setReps(''); setWeight('');
        showFlash(`Set ${setNumber} saved! ✅`);
      } else { showFlash(data.message || 'Failed to save set.'); }
    } catch { showFlash('Server error.'); }
    finally { setSaving(false); }
  };

  const handleFinish = () => { setOpen(false); setSets([]); setReps(''); setWeight(''); };

  return (
    <div className="log-session">
      {!open ? (
        <button className="log-open-btn" onClick={() => setOpen(true)}> Log Session</button>
      ) : (
        <div className="log-tracker">
          <div className="log-tracker-header">
            <span className="log-tracker-title"> Live Session Tracker</span>
            <button className="log-finish-btn" onClick={handleFinish}>Finish Session</button>
          </div>
          {sets.length > 0 && (
            <div className="log-sets-table">
              <div className="log-sets-row log-sets-heading"><span>Set</span><span>Reps</span><span>Weight (kg)</span></div>
              {sets.map((s, i) => (
                <div className="log-sets-row" key={i}>
                  <span>{s.setNumber}</span><span>{s.reps}</span>
                  <span>{s.weight > 0 ? `${s.weight} kg` : '—'}</span>
                </div>
              ))}
            </div>
          )}
          <div className="log-input-row">
            <div className="log-input-group">
              <label>Reps *</label>
              <input type="number" min="1" placeholder="e.g. 12" value={reps} onChange={e => setReps(e.target.value)} />
            </div>
            <div className="log-input-group">
              <label>Weight (kg)</label>
              <input type="number" min="0" step="0.5" placeholder="0 = bodyweight" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <button className="log-set-btn" onClick={handleLogSet} disabled={saving}>
              {saving ? 'Saving…' : `+ Log Set ${sets.length + 1}`}
            </button>
          </div>
          {flash && <p className="log-flash">{flash}</p>}
        </div>
      )}
    </div>
  );
}

// WORKOUT CARD
function WorkoutCard({ workout, videoData, favouriteIds }) {
  // activeWorkout holds the workout object passed to WorkoutMode.
  // null = modal closed, object = modal open for that workout.
  const [activeWorkout, setActiveWorkout] = useState(null);

  return (
    <>
      <article className="workout-card">
        <div className="card-header">
          <h3 className="card-title">{workout.name}</h3>
          <div className="card-header-right">
            <HeartButton workoutId={workout.id} initialFavourited={favouriteIds.includes(workout.id)} />
            <span className="card-date">
              {new Date(workout.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {workout.significance && <span className="significance-badge">{workout.significance}</span>}
        {workout.description  && <p className="workout-description">{workout.description}</p>}

        {workout.steps?.length > 0 && (
          <div className="workout-steps">
            <p className="steps-label">How to do it</p>
            <ol>{workout.steps.map((step, idx) => <li key={idx}>{step}</li>)}</ol>
          </div>
        )}

        {/* Start Workout button — opens the full-screen WorkoutMode modal */}
        <button
          className="start-workout-btn"
          onClick={() => setActiveWorkout(workout)}
        >
          ▶ Start Workout
        </button>

        <CompleteButton workoutId={workout.id} />
        <LogSession workoutId={workout.id} />
        <WorkoutVideo workout={workout} videoData={videoData} />
      </article>

      {/* WorkoutMode modal — rendered outside the card so it can be full-screen.
          Only mounts when activeWorkout is set for this card. */}
      {activeWorkout && (
        <WorkoutMode
          workout={activeWorkout}
          onClose={() => setActiveWorkout(null)}
        />
      )}
    </>
  );
}

//  MAIN WORKOUT PAGE 
export default function Workout() {
  const [workouts, setWorkouts]         = useState([]);
  const [videoMap, setVideoMap]         = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [favouriteIds, setFavouriteIds] = useState([]);

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workouts`, { headers: authHeaders() });

        if (res.status === 401) { setError('Session expired. Please log in again.'); setLoading(false); return; }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load workouts.');

        const fetchedWorkouts = data.workouts;
        setWorkouts(fetchedWorkouts);

        const favRes  = await fetch(`${import.meta.env.VITE_API_URL}/api/favourites`, { headers: authHeaders() });
        const favData = await favRes.json();
        if (favData.success) setFavouriteIds(favData.favourites);

        const initialMap = {};
        const missing    = [];
        fetchedWorkouts.forEach(w => {
          if (w.video) initialMap[w.id] = { embedUrl: w.video, title: w.name };
          else missing.push({ id: w.id, name: w.name });
        });

        setVideoMap(initialMap);
        setLoading(false);

        if (missing.length > 0) {
          const batchRes  = await fetch(`${import.meta.env.VITE_API_URL}/api/youtube/batch-search`, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ workouts: missing }),
          });
          const batchData = await batchRes.json();
          if (batchData.success) {
            const newMap = { ...initialMap };
            batchData.results.forEach(({ id, video }) => {
              newMap[id] = video || { error: true };
              if (video) {
                fetch(`${import.meta.env.VITE_API_URL}/api/workouts/${id}/video`, {
                  method: 'PATCH',
                  headers: authHeaders({ 'Content-Type': 'application/json' }),
                  body: JSON.stringify({ video: video.embedUrl }),
                }).catch(err => console.warn('Cache failed:', err));
              }
            });
            setVideoMap(newMap);
          }
        }
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError('Could not connect to server. Please try again.');
        setLoading(false);
      }
    };
    fetchEverything();
  }, []);

  if (loading) {
    return (
      <section className="workout-page">
        <div className="page-hero"><h1>All Workouts.</h1><p className="subtitle">Fetching the latest workouts for you…</p></div>
        {SECTIONS.map(section => (
          <div key={section.key} className="workout-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-title-row">
                  <img src={section.image} alt={section.label} className="section-icon-img" />
                  <h2 className="section-title">{section.label}</h2>
                </div>
                <p className="section-subtitle">{section.subtitle}</p>
              </div>
            </div>
            <div className="workouts-grid">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section className="workout-page">
        <div className="state-box error-box"><span className="state-icon">⚠️</span><p>{error}</p></div>
      </section>
    );
  }

  if (workouts.length === 0) {
    return (
      <section className="workout-page">
        <div className="page-hero"><h1>All Workouts.</h1></div>
        <div className="state-box"><span className="state-icon">🏋️</span><p>No workouts found. Check back soon!</p></div>
      </section>
    );
  }

  const grouped = workouts.reduce((acc, workout) => {
    const cat = workout.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(workout);
    return acc;
  }, {});

  return (
    <div className="workout-page">
      <div className="page-hero">
        <h1>All Workouts.</h1>
        <p className="subtitle">Build strength and confidence, one rep at a time.</p>
      </div>

      {SECTIONS.map(section => {
        const sectionWorkouts = grouped[section.key] || [];
        if (sectionWorkouts.length === 0) return null;
        return (
          <section key={section.key} className="workout-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-title-row">
                  <img src={section.image} alt={section.label} className="section-icon-img" />
                  <h2 className="section-title">{section.label}</h2>
                </div>
                <p className="section-subtitle">{section.subtitle}</p>
              </div>
              <span className="section-count">{sectionWorkouts.length} workouts</span>
            </div>
            <div className="workouts-grid">
              {sectionWorkouts.map(workout => (
                <WorkoutCard key={workout.id} workout={workout} videoData={videoMap[workout.id]} favouriteIds={favouriteIds} />
              ))}
            </div>
          </section>
        );
      })}

      {grouped['Other']?.length > 0 && (
        <section className="workout-section">
          <div className="section-header">
            <div className="section-header-left">
              <div className="section-title-row"><h2 className="section-title">Other</h2></div>
              <p className="section-subtitle">More workouts to explore</p>
            </div>
            <span className="section-count">{grouped['Other'].length} workouts</span>
          </div>
          <div className="workouts-grid">
            {grouped['Other'].map(workout => (
              <WorkoutCard key={workout.id} workout={workout} videoData={videoMap[workout.id]} favouriteIds={favouriteIds} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
