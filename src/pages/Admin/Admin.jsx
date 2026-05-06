import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

import overviewIcon    from '../../assets/progress-tracker.svg';
import workoutsIcon    from '../../assets/workouts.svg';
import usersIcon       from '../../assets/users.svg';
import completionsIcon from '../../assets/complete.svg';
import reviewsIcon     from '../../assets/reviews.svg';
import bookingsIcon    from '../../assets/booking.svg';

const CATEGORIES = ['Strength Training', 'Fat Loss', 'HIIT', 'Yoga & Recovery'];

const EMPTY_FORM = {
  name: '', description: '', significance: '',
  video: '', category: 'Strength Training', steps: ''
};

const TABS = [
  { key: 'overview',    label: 'Overview',    icon: overviewIcon    },
  { key: 'workouts',    label: 'Workouts',    icon: workoutsIcon    },
  { key: 'users',       label: 'Users',       icon: usersIcon       },
  { key: 'completions', label: 'Completions', icon: completionsIcon },
  { key: 'reviews',     label: 'Reviews',     icon: reviewsIcon     },
  { key: 'bookings',    label: 'Bookings',    icon: bookingsIcon    },
  { key: 'blog',        label: 'Blog',        icon: workoutsIcon    },
];

const BLOG_CATEGORIES = ['General', 'Nutrition', 'Training', 'Mindset', 'Recovery'];
const EMPTY_POST = {
  title: '', content: '', category: 'General',
  cover_image: '', author: 'FitnessFirst Team'
};

export default function Admin() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

  const [stats, setStats]             = useState(null);
  const [users, setUsers]             = useState([]);
  const [workouts, setWorkouts]       = useState([]);
  const [completions, setCompletions] = useState([]);
  const [reviews, setReviews]         = useState([]);
  const [bookings, setBookings]       = useState([]);
  const [blogPosts, setBlogPosts]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState('overview');

  // Workout form state
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [isAdding, setIsAdding]             = useState(false);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [formMsg, setFormMsg]               = useState('');
  const [formError, setFormError]           = useState(false);

  // Blog form state
  const [blogForm, setBlogForm]         = useState(EMPTY_POST);
  const [editingPost, setEditingPost]   = useState(null);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [blogMsg, setBlogMsg]           = useState('');
  const [blogMsgError, setBlogMsgError] = useState(false);
  const [blogToast, setBlogToast]       = useState('');

  // Booking inline confirm + toast
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast]                     = useState('');

  const showToast     = (msg) => { setToast(msg);     setTimeout(() => setToast(''), 3000);     };
  const showBlogToast = (msg) => { setBlogToast(msg); setTimeout(() => setBlogToast(''), 3000); };

  const authHeaders = (extra = {}) => ({
    ...extra,
    Authorization: `Bearer ${token}`
  });

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      //  7 fetches fired simultaneously 
      // All 7 MUST be destructured on the left — missing any one causes
      // that response to be lost, making its .json() call crash below.
      const [
        statsRes,
        usersRes,
        workoutsRes,
        completionsRes,
        reviewsRes,
        bookingsRes,
        blogRes,        
      ] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`,        { headers: authHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`,        { headers: authHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/workouts`,     { headers: authHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/completions`,  { headers: authHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/testimonials`, { headers: authHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/bookings`,           { headers: authHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/blog`,         { headers: authHeaders() }),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        navigate('/');
        return;
      }

      //  7 .json() calls — count must match exactly 
      const [s, u, w, c, r, b, bl] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        workoutsRes.json(),
        completionsRes.json(),
        reviewsRes.json(),
        bookingsRes.json(),
        blogRes.json(),  
      ]);

      if (s.success)  setStats(s.stats);
      if (u.success)  setUsers(u.users);
      if (w.success)  setWorkouts(w.workouts);
      if (c.success)  setCompletions(c.completions);
      if (r.success)  setReviews(r.testimonials);
      if (b.success)  setBookings(b.bookings);
      if (bl.success) setBlogPosts(bl.posts);

    } catch (err) {
      console.error('fetchAll error:', err);
      setError('Server error. Is your backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Workout handlers 
  const openAddForm = () => {
    setForm(EMPTY_FORM); setIsAdding(true);
    setEditingWorkout(null); setFormMsg(''); setFormError(false);
  };

  const openEditForm = (workout) => {
    setForm({
      name:         workout.name         || '',
      description:  workout.description  || '',
      significance: workout.significance || '',
      video:        workout.video        || '',
      category:     workout.category     || 'Strength Training',
      steps:        workout.steps        || '',
    });
    setEditingWorkout(workout); setIsAdding(false); setFormMsg(''); setFormError(false);
  };

  const closeForm = () => {
    setIsAdding(false); setEditingWorkout(null); setFormMsg(''); setFormError(false);
  };

  const handleAdd = async () => {
    if (!form.name || !form.category) {
      setFormError(true); setFormMsg('Name and category are required.'); return;
    }
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/workouts`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setFormError(false); setFormMsg(' Workout Added Successfully!');
        fetchAll(); setTimeout(() => closeForm(), 2000);
      } else { setFormError(true); setFormMsg(data.message || 'Failed to add workout.'); }
    } catch { setFormError(true); setFormMsg('Server error.'); }
  };

  const handleEdit = async () => {
    if (!form.name || !form.category) {
      setFormError(true); setFormMsg('Name and category are required.'); return;
    }
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/workouts/${editingWorkout.id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setFormError(false); setFormMsg(' Workout Updated Successfully!');
        fetchAll(); setTimeout(() => closeForm(), 2000);
      } else { setFormError(true); setFormMsg(data.message || 'Failed to update workout.'); }
    } catch { setFormError(true); setFormMsg('Server error.'); }
  };

  const handleDelete = async (workout) => {
    if (!window.confirm(`Delete "${workout.name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`/api/admin/workouts/${workout.id}`, {
        method: 'DELETE', headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) fetchAll();
    } catch { alert('Server error. Could not delete workout.'); }
  };

  // Review handlers 
  const handleReviewAction = async (id, approved) => {
    try {
      const res  = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ approved })
      });
      const data = await res.json();
      if (data.success) fetchAll();
    } catch { alert('Server error. Could not update review.'); }
  };

  //  Booking handlers 
  const handleBookingStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) fetchAll();
    } catch { alert('Server error. Could not update booking.'); }
  };

  const handleBookingDeleteConfirmed = async (id) => {
    try {
      const res  = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE', headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteId(null);
        fetchAll();
        showToast('Booking deleted successfully');
      } else { alert(data.message || 'Could not delete booking.'); }
    } catch { alert('Server error. Could not delete booking.'); }
  };

  //  Blog handlers 

  const handleAddPost = async () => {
    if (!blogForm.title || !blogForm.content) {
      setBlogMsgError(true); setBlogMsg('Title and content are required.'); return;
    }
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/blog`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(blogForm)
      });
      const data = await res.json();
      if (data.success) {
        setBlogMsgError(false); setBlogMsg(' Post Published Sucessfully!');
        fetchAll();
        setTimeout(() => { setIsAddingPost(false); setBlogMsg(''); }, 1800);
      } else { setBlogMsgError(true); setBlogMsg(data.message || 'Failed.'); }
    } catch { setBlogMsgError(true); setBlogMsg('Server error.'); }
  };

  const handleEditPost = async () => {
    if (!blogForm.title || !blogForm.content) {
      setBlogMsgError(true); setBlogMsg('Title and content are required.'); return;
    }
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/blog/${editingPost.id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(blogForm)
      });
      const data = await res.json();
      if (data.success) {
        setBlogMsgError(false); setBlogMsg(' Post Updated Successfully!');
        fetchAll();
        setTimeout(() => { setEditingPost(null); setBlogMsg(''); }, 1800);
      } else { setBlogMsgError(true); setBlogMsg(data.message || 'Failed.'); }
    } catch { setBlogMsgError(true); setBlogMsg('Server error.'); }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res  = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE', headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) { fetchAll(); showBlogToast('Post deleted successfully'); }
    } catch { alert('Server error.'); }
  };

  // Early returns 

  if (loading) {
    return (
      <section className="admin-page">
        <div className="admin-loading">Loading admin dashboard…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <div className="admin-error">⚠️ {error}</div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-container">

        {toast && <div className="admin-toast">🗑️ {toast}</div>}

        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button className="admin-back-btn" onClick={() => navigate('/')}>← Back to Site</button>
        </div>

        <div className="admin-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <img src={tab.icon} alt={tab.label} className="tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>

        {/*  OVERVIEW  */}
        {activeTab === 'overview' && stats && (
          <div className="admin-overview">
            <div className="admin-stat-cards">
              <div className="admin-stat-card">
                <img src={usersIcon} alt="Users" className="stat-card-icon" />
                <span className="admin-stat-number">{stats.totalUsers}</span>
                <span className="admin-stat-label">Total Users</span>
              </div>
              <div className="admin-stat-card">
                <img src={workoutsIcon} alt="Workouts" className="stat-card-icon" />
                <span className="admin-stat-number">{stats.totalWorkouts}</span>
                <span className="admin-stat-label">Total Workouts</span>
              </div>
              <div className="admin-stat-card">
                <img src={completionsIcon} alt="Completions" className="stat-card-icon" />
                <span className="admin-stat-number">{stats.totalCompletions}</span>
                <span className="admin-stat-label">Completions</span>
              </div>
              <div className="admin-stat-card">
                <img src={overviewIcon} alt="Favourites" className="stat-card-icon" />
                <span className="admin-stat-number">{stats.totalFavourites}</span>
                <span className="admin-stat-label">Favourites</span>
              </div>
            </div>
          </div>
        )}

        {/*  WORKOUTS */}
        {activeTab === 'workouts' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>
                <img src={workoutsIcon} alt="Workouts" className="section-title-icon" />
                Manage Workouts
              </h2>
              <button className="admin-add-btn" onClick={openAddForm}>➕ Add Workout</button>
            </div>

            {(isAdding || editingWorkout) && (
              <div className="admin-form">
                <h3>{isAdding ? '➕ Add New Workout' : `✏️ Edit: ${editingWorkout.name}`}</h3>
                <label>Name *</label>
                <input type="text" placeholder="Workout name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
                <label>Category *</label>
                <select value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <label>Significance Badge</label>
                <input type="text" placeholder="e.g. Intermediate, Beginner"
                  value={form.significance}
                  onChange={e => setForm({ ...form, significance: e.target.value })} />
                <label>Description</label>
                <textarea placeholder="Brief description" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                <label>Steps (comma separated)</label>
                <textarea placeholder="Warm up, Do 3 sets, Cool down" value={form.steps}
                  onChange={e => setForm({ ...form, steps: e.target.value })} rows={3} />
                <label>Video Embed URL</label>
                <input type="text" placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  value={form.video}
                  onChange={e => setForm({ ...form, video: e.target.value })} />
                {formMsg && (
                  <p className={`form-msg ${formError ? 'error' : 'success'}`}>{formMsg}</p>
                )}
                <div className="form-actions">
                  <button className="form-save-btn" onClick={isAdding ? handleAdd : handleEdit}>
                    {isAdding ? 'Add Workout' : 'Save Changes'}
                  </button>
                  <button className="form-cancel-btn" onClick={closeForm}>Cancel</button>
                </div>
              </div>
            )}

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Category</th><th>Significance</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {workouts.map(workout => (
                    <tr key={workout.id}>
                      <td>{workout.id}</td>
                      <td>{workout.name}</td>
                      <td><span className="category-badge">{workout.category}</span></td>
                      <td>{workout.significance || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="edit-btn" onClick={() => openEditForm(workout)}>✏️ Edit</button>
                          <button className="delete-btn" onClick={() => handleDelete(workout)}>🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS  */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>
              <img src={usersIcon} alt="Users" className="section-title-icon" />
              Registered Users
            </h2>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '—'}</td>
                      <td><span className={`role-badge-admin ${user.role}`}>{user.role}</span></td>
                      <td>{new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPLETIONS  */}
        {activeTab === 'completions' && (
          <div className="admin-section">
            <h2>
              <img src={completionsIcon} alt="Completions" className="section-title-icon" />
              Recent Completions
            </h2>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Workout</th><th>Category</th><th>Completed At</th></tr>
                </thead>
                <tbody>
                  {completions.map(item => (
                    <tr key={item.id}>
                      <td>{item.first_name} {item.last_name}</td>
                      <td>{item.email}</td>
                      <td>{item.workout_name}</td>
                      <td><span className="category-badge">{item.category}</span></td>
                      <td>{new Date(item.completed_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/*  REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="admin-section">
            <h2>
              <img src={reviewsIcon} alt="Reviews" className="section-title-icon" />
              Member Reviews
            </h2>
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews submitted yet.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Member</th><th>Rating</th><th>Review</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => (
                      <tr key={review.id}>
                        <td>{review.first_name} {review.last_name}</td>
                        <td>
                          <span className="review-stars">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                        </td>
                        <td className="review-text-cell">
                          {review.review.length > 80 ? `${review.review.substring(0, 80)}…` : review.review}
                        </td>
                        <td>{new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}</td>
                        <td>
                          <span className={`review-status ${review.approved ? 'approved' : 'pending'}`}>
                            {review.approved ? '✅ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            {!review.approved && (
                              <button className="approve-btn" onClick={() => handleReviewAction(review.id, 1)}>
                                ✅ Approve
                              </button>
                            )}
                            {review.approved === 1 && (
                              <button className="reject-btn" onClick={() => handleReviewAction(review.id, 0)}>
                                ✕ Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/*  BOOKINGS  */}
        {activeTab === 'bookings' && (
          <div className="admin-section">
            <h2>
              <img src={bookingsIcon} alt="Bookings" className="section-title-icon" />
              Session Bookings
            </h2>
            {bookings.length === 0 ? (
              <p className="no-reviews">No bookings submitted yet.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Trainer</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking.id}>
                        <td>{booking.name}</td>
                        <td>{booking.email}</td>
                        <td><span className="category-badge">{booking.trainer}</span></td>
                        <td className="review-text-cell">
                          {booking.message.length > 60 ? `${booking.message.substring(0, 60)}…` : booking.message}
                        </td>
                        <td>{new Date(booking.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}</td>
                        <td>
                          <span className={`review-status ${booking.status}`}>
                            {booking.status === 'approved' && '✅ Approved'}
                            {booking.status === 'rejected' && '❌ Rejected'}
                            {booking.status === 'pending'  && '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            {booking.status !== 'approved' && (
                              <button className="approve-btn"
                                onClick={() => handleBookingStatus(booking.id, 'approved')}>
                                ✅ Approve
                              </button>
                            )}
                            {booking.status !== 'rejected' && (
                              <button className="reject-btn"
                                onClick={() => handleBookingStatus(booking.id, 'rejected')}>
                                ✕ Reject
                              </button>
                            )}
                            {confirmDeleteId === booking.id ? (
                              <div className="inline-confirm">
                                <span className="inline-confirm-text">Sure?</span>
                                <button className="inline-confirm-yes"
                                  onClick={() => handleBookingDeleteConfirmed(booking.id)}>
                                  Delete
                                </button>
                                <button className="inline-confirm-no"
                                  onClick={() => setConfirmDeleteId(null)}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button className="delete-btn"
                                onClick={() => setConfirmDeleteId(booking.id)}>
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/*  BLOG  */}
        {activeTab === 'blog' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2> Blog Posts</h2>
              <button className="admin-add-btn" onClick={() => {
                setBlogForm(EMPTY_POST); setIsAddingPost(true);
                setEditingPost(null); setBlogMsg('');
              }}>
                ➕ New Post
              </button>
            </div>

            {blogToast && <div className="admin-toast">🗑️ {blogToast}</div>}

            {(isAddingPost || editingPost) && (
              <div className="admin-form">
                <h3>{isAddingPost ? '➕ New Post' : `✏️ Edit: ${editingPost.title}`}</h3>

                <label>Title *</label>
                <input type="text" placeholder="Post title" value={blogForm.title}
                  onChange={e => setBlogForm({ ...blogForm, title: e.target.value })} />

                <label>Category</label>
                <select value={blogForm.category}
                  onChange={e => setBlogForm({ ...blogForm, category: e.target.value })}>
                  {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label>Author</label>
                <input type="text" placeholder="Author name" value={blogForm.author}
                  onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} />

                <label>Cover Image URL</label>
                <input type="text" placeholder="https://example.com/image.jpg"
                  value={blogForm.cover_image}
                  onChange={e => setBlogForm({ ...blogForm, cover_image: e.target.value })} />

                <label>Content *</label>
                <textarea rows={6} placeholder="Write your article here…"
                  value={blogForm.content}
                  onChange={e => setBlogForm({ ...blogForm, content: e.target.value })} />

                {blogMsg && (
                  <p className={`form-msg ${blogMsgError ? 'error' : 'success'}`}>{blogMsg}</p>
                )}

                <div className="form-actions">
                  <button className="form-save-btn"
                    onClick={isAddingPost ? handleAddPost : handleEditPost}>
                    {isAddingPost ? 'Publish Post' : 'Save Changes'}
                  </button>
                  <button className="form-cancel-btn"
                    onClick={() => { setIsAddingPost(false); setEditingPost(null); setBlogMsg(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {blogPosts.length === 0 ? (
              <p className="no-reviews">No posts yet. Click "New Post" to publish your first article.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Title</th><th>Category</th><th>Author</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {blogPosts.map(post => (
                      <tr key={post.id}>
                        <td>{post.title}</td>
                        <td><span className="category-badge">{post.category}</span></td>
                        <td>{post.author}</td>
                        <td>{new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}</td>
                        <td>
                          <div className="action-btns">
                            <button className="edit-btn" onClick={() => {
                              setBlogForm({
                                title:       post.title,
                                content:     post.content,
                                category:    post.category,
                                cover_image: post.cover_image || '',
                                author:      post.author,
                              });
                              setEditingPost(post); setIsAddingPost(false); setBlogMsg('');
                            }}>✏️ Edit</button>
                            <button className="delete-btn" onClick={() => handleDeletePost(post.id)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
