import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Api from './Api';
import './App.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(Api.adminLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Unable to sign in. Check your details and try again.');
      }

      sessionStorage.setItem('adminToken', result.token);
      navigate('/view', { replace: true });
    } catch (error) {
      setMessage(error.message || 'Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-ring" aria-label="Administrator sign in">
        <div className="login-content">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="7.5" y="9" width="33" height="23" rx="3.5" stroke="currentColor" strokeWidth="2" />
              <path d="M18 39h12m-6-7v7m-9-15h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="18" r="2" fill="currentColor" />
            </svg>
          </div>
          <p className="portal-label">ADMINISTRATOR PORTAL</p>
          <h1>Computer Sales<br className="desktop-break" /> &amp; Service</h1>
          <p className="login-subtitle">Management System</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email"></label>
            <div className="input-shell">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.25" />
                <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
              </svg>
              <input
                id="email"
                name="email"
                type="text"
                aria-label="Email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <label className="field-label password-label" htmlFor="password"></label>
            <div className="input-shell">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5.5" y="10" width="13" height="10" rx="2" />
                <path d="M8.5 10V7a3.5 3.5 0 1 1 7 0v3m-3.5 4v2" />
              </svg>
              <input
                id="password"
                name="password"
                type="password"
                aria-label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="forgot-password-row">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button className="login-button" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing in...' : 'Login'}</span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10h11m-4-4 4 4-4 4" />
              </svg>
            </button>
            <p className={`form-message${message ? ' is-visible' : ''}`} role="status" aria-live="polite">
              {message || ' '}
            </p>
          </form>

          <p className="secure-note">
            <span className="status-dot" aria-hidden="true" />
            SECURE SYSTEM ACCESS
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;