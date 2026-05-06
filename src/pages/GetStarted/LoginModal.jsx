import { useState, useEffect } from 'react';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onOpenRegister, successMessage }) {

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage]   = useState('');
  const [isError, setIsError]   = useState(false);
  const [loginDone, setLoginDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // showPassword toggles the password input between
  //  type="password" and type="text"

  // Reset ALL state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setMessage('');
      setIsError(false);
      setLoginDone(false);
      setShowPassword(false); // always hide password when modal opens
    }
  }, [isOpen]);

  // Wait 2 seconds after success, then fire onLoginSuccess
  useEffect(() => {
    if (!loginDone) return;
    const timer = setTimeout(() => {
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [loginDone]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Read the body first, THEN check status.
      // Some backends return 404/401 with a JSON body, some without,
      // so safely try to parse JSON regardless of status code.
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // Check HTTP status codes AND data.message.
      // This covers backends that return 404 for "user not found"
      // instead of { success: false, message: 'not-registered' }.
      if (
        res.status === 404 ||
        data.message === 'not-registered' ||
        data.message === 'User not found' ||
        data.message === 'No user found'
      ) {
        setIsError(true);
        setMessage('not-registered');
        return;
      }

      if (
        res.status === 401 ||
        data.message === 'Incorrect password.' ||
        data.message === 'Invalid password'
      ) {
        setIsError(true);
        setMessage('Incorrect password. Please try again.');
        return;
      }

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setIsError(false);
        setMessage(successMessage || 'Login Successful! Redirecting...');
        setLoginDone(true);

      } else if (data.message === 'not-registered') {
        setIsError(true);
        setMessage('not-registered');

      } else if (data.message === 'Incorrect password.') {
        setIsError(true);
        setMessage('Incorrect password. Please try again.');

      } else {
        setIsError(true);
        setMessage(data.message || 'Login failed.');
      }

    } catch (err) {
      console.error('Login error:', err);
      setIsError(true);
      setMessage('Server error. Is your backend running?');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>

        <h2>Welcome Back.</h2>
        <p>Login to continue your fitness journey.</p>

        <form onSubmit={handleSubmit}>

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

          <button type="submit">Login</button>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>

        </form>

        {message === 'not-registered' && (
          <p className="login-message error">
            Not a registered user.{' '}
            <span className="register-link" onClick={onOpenRegister}>
              Click here to sign up.
            </span>
          </p>
        )}

        {message && message !== 'not-registered' && (
          <p className={`login-message ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}

      </div>
    </div>
  );
}
