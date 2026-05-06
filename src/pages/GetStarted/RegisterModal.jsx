import { useState, useEffect } from 'react';
import './RegisterModal.css';

export default function RegisterModal({ isOpen, onClose, onRegistered }) {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('trainee'); // default to trainee
  const [message, setMessage]     = useState('');
  const [isError, setIsError]     = useState(false);
  const [showPassword, setShowPassword] = useState(false); // showPassword toggles the password input between 
  // type="password" and type="text"

  // Reset ALL state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setRole('trainee');
      setMessage('');
      setIsError(false);
      setShowPassword(false); // always hide password when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, email, password, role }),
      });

      const data = await res.json();

      if (data.success) {
        setIsError(false);
        setMessage('Account Created Successfully! Taking you to Login...');
        setTimeout(() => onRegistered(), 2000);
      } else {
        setIsError(true);
        setMessage(data.message || 'Registration failed. Try again.');
      }
    } catch (err) {
      setIsError(true);
      setMessage(`Server error: ${err.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>

        <button type="button" className="close-btn" onClick={onClose}>✕</button>

        <h2>Create Account.</h2>
        <p>Sign up to start your fitness journey.</p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password field wrapped in a div so the eye toggle button
              can be positioned absolutely inside it */}
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Eye toggle button — switches showPassword true/false.
                type="button" prevents it from accidentally submitting the form */}
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(prev => !prev)}
              tabIndex={-1}  // skip this button when tabbing through the form
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? ' hide' : '👁️'}
            </button>
          </div>

          {/* Role dropdown */}
          <select
            className="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="trainee">Trainee</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit">Register</button>

        </form>

        {message && (
          <p className={`register-message ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}

      </div>
    </div>
  );
}
