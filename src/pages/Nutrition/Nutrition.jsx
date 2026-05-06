import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import './Nutrition.css';

// Helpers kept at module level so they never get recreated on re-renders
const token = () => localStorage.getItem('token');
const auth  = (extra = {}) => ({ ...extra, Authorization: `Bearer ${token()}` });

// Each macro gets a unique color used across summary cards and meal rows
const MACRO_COLORS = {
  protein: '#2645f1',
  carbs:   '#f59e0b',
  fats:    '#e53e3e',
};

// Converts a value + goal into a 0–100 percentage for the progress bar.
// Math.min caps it at 100 so the bar never overflows its container.
const bar = (val, goal) => Math.min((val / (goal || 1)) * 100, 100);

// Rounds to 1 decimal place — used for protein/carbs/fats display
const fmt = (n) => Number(n || 0).toFixed(1);

export default function Nutrition() {
  const navigate = useNavigate();

  const [meals,   setMeals]   = useState([]);
  const [weekly,  setWeekly]  = useState([]);
  const [goals,   setGoals]   = useState({
    calorie_goal: 2000, protein_goal: 150,
    carbs_goal: 250,    fats_goal: 65,
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Form fields for manual meal entry
  const [form, setForm] = useState({
    meal_name: '', calories: '', protein: '', carbs: '', fats: '',
  });
  const [saving, setSaving] = useState(false);
  const [flash,  setFlash]  = useState('');

  // Food search state — query is the input, results come from Open Food Facts
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

  // editGoals toggles the goal editor panel open/closed
  const [editGoals,    setEditGoals]    = useState(false);
  const [goalForm,     setGoalForm]     = useState({});
  const [savingGoals,  setSavingGoals]  = useState(false);

  useEffect(() => {
    if (!token()) { navigate('/'); return; }
    fetchAll();
  }, []);

  // Fetches today's meals, 7-day history, and user goals simultaneously.
  // Promise.all fires all three requests at once — faster than awaiting each.
  const fetchAll = async () => {
    try {
      const [todayRes, weekRes, goalsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/nutrition/today`,  { headers: auth() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/nutrition/weekly`, { headers: auth() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/nutrition/goals`,  { headers: auth() }),
      ]);
      const [t, w, g] = await Promise.all([
        todayRes.json(), weekRes.json(), goalsRes.json(),
      ]);
      if (t.success) setMeals(t.meals);
      if (w.success) setWeekly(w.weekly);
      if (g.success) {
        setGoals(g.goals);
        // Seed the goal editor form with existing values
        setGoalForm(g.goals);
      }
    } catch {
      setError('Server error. Is your backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Searches Open Food Facts — a free public food database, no API key needed.
  // Returns up to 6 products, map only the fields we need and filter out
  // items with no name so the results list stays clean.
  const handleSearch = async () => {
  if (!query.trim()) return;
  setSearching(true);
  setResults([]);
  try {
    const res  = await fetch(
      `${import.meta.env.VITE_API_URL}/api/nutrition/search?q=${encodeURIComponent(query)}`,
      { headers: auth() }
    );
    const data = await res.json();
    if (data.success) {
      setResults(data.items);
    } else {
      showFlash('No results found. Enter details manually.');
    }
  } catch {
    showFlash('Search failed. Enter details manually.');
  } finally {
    setSearching(false);
  }
};

  // When a search result is clicked, copy its values into the manual form
  // so the user can review/adjust before logging. Then clear the results list.
  const selectResult = (item) => {
    setForm({
      meal_name: item.name,
      calories:  item.calories,
      protein:   item.protein,
      carbs:     item.carbs,
      fats:      item.fats,
    });
    setResults([]);
    setQuery('');
  };

  // Flash shows a short feedback message then auto-hides after 3 seconds
  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 4000);
  };

  const handleLog = async () => {
    if (!form.meal_name.trim()) { showFlash('Enter a meal name.'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/nutrition`, {
        method:  'POST',
        headers: auth({ 'Content-Type': 'application/json' }),
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ meal_name: '', calories: '', protein: '', carbs: '', fats: '' });
        fetchAll(); // re-fetch so totals and chart update immediately
        showFlash('Meal logged!');
      } else {
        showFlash(data.message || 'Failed to log meal.');
      }
    } catch {
      showFlash('Server error.');
    } finally {
      setSaving(false);
    }
  };

  // Removes a meal from local state immediately (optimistic) without waiting
  // for a re-fetch — makes the UI feel instant
  const handleDelete = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/nutrition/${id}`, { method: 'DELETE', headers: auth() });
      setMeals(prev => prev.filter(m => m.id !== id));
    } catch {
      showFlash('Could not delete meal.');
    }
  };

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/nutrition/goals`, {
        method:  'POST',
        headers: auth({ 'Content-Type': 'application/json' }),
        body:    JSON.stringify(goalForm),
      });
      const data = await res.json();
      if (data.success) {
        setGoals(goalForm);  // update live goals so progress bars recalculate
        setEditGoals(false);
        showFlash('Goals saved!');
      }
    } catch {
      showFlash('Could not save goals.');
    } finally {
      setSavingGoals(false);
    }
  };

  // Derive today's totals by summing every meal's nutrients.
  // reduce starts from 0 for each field and accumulates across all meals.
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories),
      protein:  acc.protein  + Number(m.protein),
      carbs:    acc.carbs    + Number(m.carbs),
      fats:     acc.fats     + Number(m.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  // Build last 7 days array with labels and calorie values.
  // For each day we look up a matching row in the weekly DB response.
  // Days with no logged meals default to 0.
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // 6 days ago → today
    const date  = d.toISOString().split('T')[0]; // "2026-04-11"
    const label = d.toLocaleDateString('en-US', { weekday: 'short' }); // "Fri"
    const match = weekly.find(w => w.day === date);
    return { date, label, calories: match ? Number(match.total_calories) : 0 };
  });

  // maxCal is used to scale bar heights proportionally.
  // || 1 prevents division by zero when all days have 0 calories.
  const maxCal = Math.max(...last7.map(d => d.calories), 1);

  if (loading) return <section className="nt-page"><p className="nt-loading">Loading nutrition data…</p></section>;
  if (error)   return <section className="nt-page"><p className="nt-error">⚠️ {error}</p></section>;

  return (
    <section className="nt-page">
      <div className="nt-container">

        {/* Header */}
        <div className="nt-header">
          <div>
            <h1 className="nt-title"> Nutrition Tracker</h1>
            <p className="nt-subtitle">Log meals and track your daily macros</p>
          </div>
          <div className="nt-header-actions">
            <button className="nt-goals-btn" onClick={() => setEditGoals(prev => !prev)}>
              {editGoals ? 'Cancel' : '⚙️ Goals'}
            </button>
            <button className="nt-back-btn" onClick={() => navigate('/')}>← Home</button>
          </div>
        </div>

        {flash && <div className="nt-flash">{flash}</div>}

        {/* Goal editor — only mounts when editGoals is true */}
        {editGoals && (
          <div className="nt-goals-editor">
            <h3 className="nt-goals-title">Daily Goals</h3>
            <div className="nt-goals-grid">
              {[
                { key: 'calorie_goal', label: 'Calories (kcal)' },
                { key: 'protein_goal', label: 'Protein (g)'     },
                { key: 'carbs_goal',   label: 'Carbs (g)'       },
                { key: 'fats_goal',    label: 'Fats (g)'        },
              ].map(({ key, label }) => (
                <div className="nt-goal-field" key={key}>
                  <label>{label}</label>
                  <input
                    type="number" min="0"
                    value={goalForm[key] || ''}
                    // Spread-update only the changed key, keep others intact
                    onChange={e => setGoalForm(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button className="nt-save-goals-btn" onClick={handleSaveGoals} disabled={savingGoals}>
              {savingGoals ? 'Saving…' : 'Save Goals'}
            </button>
          </div>
        )}

        {/* Summary cards — one per macro + calories.
            Defined as an array so adding a new nutrient only requires
            one entry here rather than duplicating JSX four times. */}
        <div className="nt-summary-grid">
          {[
            { label: 'Calories', val: Math.round(totals.calories), goal: goals.calorie_goal, unit: 'kcal', color: '#e53e3e' },
            { label: 'Protein',  val: fmt(totals.protein),         goal: goals.protein_goal, unit: 'g',    color: MACRO_COLORS.protein },
            { label: 'Carbs',    val: fmt(totals.carbs),           goal: goals.carbs_goal,   unit: 'g',    color: MACRO_COLORS.carbs   },
            { label: 'Fats',     val: fmt(totals.fats),            goal: goals.fats_goal,    unit: 'g',    color: MACRO_COLORS.fats    },
          ].map(({ label, val, goal, unit, color }) => (
            <div className="nt-summary-card" key={label}>
              <p className="nt-summary-label">{label}</p>
              <p className="nt-summary-value" style={{ color }}>
                {val}<span className="nt-summary-unit"> {unit}</span>
              </p>
              <p className="nt-summary-goal">Goal: {goal} {unit}</p>
              <div className="nt-progress-track">
                {/* bar() caps at 100 so the fill never exceeds the track width */}
                <div
                  className="nt-progress-fill"
                  style={{ width: `${bar(val, goal)}%`, background: color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Food search — uses Open Food Facts (free, no API key needed) */}
        <div className="nt-search-section">
          <h3 className="nt-section-title">Search Food</h3>
          <div className="nt-search-row">
            <input
              className="nt-search-input"
              placeholder="e.g. chicken breast, banana, oats…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="nt-search-btn" onClick={handleSearch} disabled={searching}>
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {/* Search results — clicking one fills the form below */}
          {results.length > 0 && (
            <div className="nt-results">
              {results.map((item, i) => (
                <button className="nt-result-item" key={i} onClick={() => selectResult(item)}>
                  <span className="nt-result-name">{item.name}</span>
                  <span className="nt-result-macros">
                    {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fats}g F
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual log form — also receives values from selectResult() above */}
        <div className="nt-form-section">
          <h3 className="nt-section-title">Log a Meal</h3>
          <div className="nt-form-grid">
            <div className="nt-form-field full">
              <label>Meal name *</label>
              <input
                type="text" placeholder="e.g. Grilled chicken"
                value={form.meal_name}
                onChange={e => setForm(p => ({ ...p, meal_name: e.target.value }))}
              />
            </div>
            {[
              { key: 'calories', label: 'Calories (kcal)', ph: '350' },
              { key: 'protein',  label: 'Protein (g)',     ph: '30'  },
              { key: 'carbs',    label: 'Carbs (g)',       ph: '45'  },
              { key: 'fats',     label: 'Fats (g)',        ph: '10'  },
            ].map(({ key, label, ph }) => (
              <div className="nt-form-field" key={key}>
                <label>{label}</label>
                <input
                  type="number" min="0" step="0.1" placeholder={ph}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <button className="nt-log-btn" onClick={handleLog} disabled={saving}>
            {saving ? 'Saving…' : '+ Log Meal'}
          </button>
        </div>

        {/* Today's meals list */}
        <div className="nt-meals-section">
          <h3 className="nt-section-title">Today's Meals</h3>
          {meals.length === 0 ? (
            <p className="nt-empty">No meals logged today. Add your first meal above.</p>
          ) : (
            <div className="nt-meals-list">
              {meals.map(meal => (
                <div className="nt-meal-row" key={meal.id}>
                  <div className="nt-meal-info">
                    <p className="nt-meal-name">{meal.meal_name}</p>
                    <div className="nt-meal-macros">
                      <span style={{ color: '#e53e3e'            }}>{Math.round(meal.calories)} kcal</span>
                      <span style={{ color: MACRO_COLORS.protein   }}>{fmt(meal.protein)}g protein</span>
                      <span style={{ color: MACRO_COLORS.carbs     }}>{fmt(meal.carbs)}g carbs</span>
                      <span style={{ color: MACRO_COLORS.fats      }}>{fmt(meal.fats)}g fats</span>
                    </div>
                  </div>
                  <div className="nt-meal-right">
                    <span className="nt-meal-time">
                      {/* Format DB timestamp to readable time e.g. "08:30 AM" */}
                      {new Date(meal.logged_at).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <button className="nt-delete-btn" onClick={() => handleDelete(meal.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7-day calorie bar chart */}
        <div className="nt-chart-section">
          <h3 className="nt-section-title">Calories — Last 7 Days</h3>
          <div className="nt-bar-chart">
            {last7.map((day, i) => (
              <div className="nt-bar-col" key={i}>
                <span className="nt-bar-count">
                  {day.calories > 0 ? Math.round(day.calories) : ''}
                </span>
                <div className="nt-bar-wrapper">
                  {/* Bar height is proportional to the highest day's calories.
                      e.g. if max is 2000 and today is 1000 → height is 50% */}
                  <div
                    className={`nt-bar ${day.calories > 0 ? 'active' : ''}`}
                    style={{ height: `${(day.calories / maxCal) * 100}%` }}
                  />
                  {/* Dashed goal line — positioned as a % of the chart height
                      so it always aligns with the goal value on the scale */}
                  <div
                    className="nt-goal-line"
                    style={{ bottom: `${(goals.calorie_goal / maxCal) * 100}%` }}
                  />
                </div>
                <span className="nt-bar-label">{day.label}</span>
              </div>
            ))}
          </div>
          <p className="nt-chart-legend">
            <span className="nt-legend-dot" style={{ background: '#e53e3e' }} />
            Calories logged
            <span className="nt-legend-dot" style={{ background: '#f59e0b', marginLeft: 12 }} />
            Daily goal ({goals.calorie_goal} kcal)
          </p>
        </div>

      </div>
    </section>
  );
}
