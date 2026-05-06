import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]         = useState('');
  const avatarInputRef = useRef(null); // ref to trigger hidden file input on avatar click

  // Progress photos state
  const [photos, setPhotos]           = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError]   = useState('');
  const [caption, setCaption]         = useState('');
  const [lightbox, setLightbox]       = useState(null); // URL of photo shown in lightbox
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchProfile();
    fetchPhotos();
  }, []);

  //  Fetch profile 
  const fetchProfile = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
      else setError(data.message || 'Failed to load profile.');
    } catch {
      setError('Server error. Is your backend running?');
    } finally {
      setLoading(false);
    }
  };

  //  Fetch progress photos 
  const fetchPhotos = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/progress-photos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPhotos(data.photos);
    } catch (err) {
      console.error('Photo fetch error:', err);
    }
  };

  //  Avatar upload 
  // Called when the user selects a file from the hidden avatar file input.
  // Sends as multipart/form-data — multer on the backend handles the rest.
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side size guard before sending to server
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB.');
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');

    const formData = new FormData();
    formData.append('avatar', file); // key must match uploadAvatar.single('avatar') in backend

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type manually — browser sets it with boundary for multipart
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Update local user state so new avatar shows immediately without re-fetching
        setUser(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        // Also update localStorage so Navbar and other components see the new avatar
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, avatarUrl: data.avatarUrl }));
      } else {
        setAvatarError(data.message || 'Upload failed.');
      }
    } catch {
      setAvatarError('Server error. Try again.');
    } finally {
      setAvatarUploading(false);
      e.target.value = ''; // reset input so same file can be re-uploaded
    }
  };

  //  Progress photo upload 
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5MB.');
      return;
    }

    setPhotoUploading(true);
    setPhotoError('');

    const formData = new FormData();
    formData.append('photo', file);
    if (caption.trim()) formData.append('caption', caption.trim());

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/progress-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setCaption('');
        fetchPhotos(); // refresh gallery
      } else {
        setPhotoError(data.message || 'Upload failed.');
      }
    } catch {
      setPhotoError('Server error. Try again.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  //  Delete progress photo 
  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      const res  = await fetch(`/api/upload/progress-photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Remove from local state immediately — no need to re-fetch
        setPhotos(prev => prev.filter(p => p.id !== id));
        if (lightbox) setLightbox(null); // close lightbox if open
      }
    } catch {
      alert('Server error. Could not delete photo.');
    }
  };

  //  Role badge 
  const roleBadgeClass = {
    admin:   'badge-admin',
    trainer: 'badge-trainer',
    trainee: 'badge-trainee',
  }[user?.role] || 'badge-trainee';

  if (loading) return <section className="profile-page"><div className="profile-loading">Loading your profile…</div></section>;
  if (error)   return <section className="profile-page"><div className="profile-error">⚠️ {error}</div></section>;

  return (
    <section className="profile-page">
      <div className="profile-card">

        {/*  AVATAR 
            Clicking the avatar triggers the hidden file input.
            Shows the uploaded image if available, otherwise initials. */}
        <div
          className="profile-avatar"
          onClick={() => avatarInputRef.current?.click()}
          title="Click to change profile picture"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Profile" className="avatar-img" />
          ) : (
            <span className="avatar-initials">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          )}

          {/* Camera overlay shown on hover */}
          <div className="avatar-overlay">
            {avatarUploading ? '⏳' : '📷'}
          </div>
        </div>

        {/* Hidden file input — triggered by clicking avatar div above */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />

        {avatarError && <p className="upload-error">{avatarError}</p>}

        <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
        <span className={`role-badge ${roleBadgeClass}`}>{user.role}</span>

        {/*  PROFILE DETAILS  */}
        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label"> Email</span>
            <span className="profile-value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">📞 Phone</span>
            <span className="profile-value">{user.phone || 'Not provided'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className="profile-value">{user.role}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">📅 Member Since</span>
            <span className="profile-value">
              {new Date(user.memberSince).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/*  PROGRESS PHOTOS  */}
        <div className="progress-photos-section">
          <div className="progress-photos-header">
            <h3 className="progress-photos-title"> Progress Photos</h3>
            <button
              className="add-photo-btn"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
            >
              {photoUploading ? ' Uploading…' : '+ Add Photo'}
            </button>
          </div>

          {/* Optional caption input shown above the file picker */}
          <input
            type="text"
            className="caption-input"
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={100}
          />

          {/* Hidden file input for progress photos */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />

          {photoError && <p className="upload-error">{photoError}</p>}

          {/* Photo grid — empty state or photo thumbnails */}
          {photos.length === 0 ? (
            <div className="photos-empty">
              <p>No progress photos yet.</p>
              <p>Upload your first one to start tracking your journey!</p>
            </div>
          ) : (
            <div className="photos-grid">
              {photos.map(photo => (
                <div className="photo-thumb" key={photo.id}>
                  {/* Clicking thumbnail opens lightbox */}
                  <img
                    src={photo.image_url}
                    alt={photo.caption || 'Progress photo'}
                    loading="lazy"
                    decoding="async"
                    onClick={() => setLightbox(photo)}
                  />
                  {/* Delete button overlaid on each thumbnail */}
                  <button
                    className="photo-delete-btn"
                    onClick={() => handleDeletePhoto(photo.id)}
                    title="Delete photo"
                  >
                    ✕
                  </button>
                  {photo.caption && (
                    <p className="photo-caption">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/*  LIGHTBOX 
            Clicking a thumbnail opens this full-screen overlay.
            Clicking the backdrop or ✕ closes it. */}
        {lightbox && (
          <div className="lightbox-backdrop" onClick={() => setLightbox(null)}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
              <img src={lightbox.image_url} alt={lightbox.caption || 'Progress photo'} />
              {lightbox.caption && <p className="lightbox-caption">{lightbox.caption}</p>}
              <p className="lightbox-date">
                📅 {new Date(lightbox.uploaded_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/*  NAVIGATION BUTTONS  */}
        <div className="profile-actions">
          <button className="profile-btn workouts" onClick={() => navigate('/workouts')}>
            My Workouts
          </button>
          <button className="profile-btn back" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>

      </div>
    </section>
  );
}
