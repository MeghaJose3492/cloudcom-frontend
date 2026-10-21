import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestAdminPasswordReset } from './Api';
import './App.css';

const GENERIC_SUCCESS = 'If an account exists for this email, password reset instructions will be sent.';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');
    setIsSuccess(false);

    try {
      await requestAdminPasswordReset(email.trim());
      setIsSuccess(true);
      setMessage(GENERIC_SUCCESS);
    } catch (error) {
      setMessage(error.message || 'Unable to send reset instructions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page recovery-page">
      <section className="login-ring" aria-label="Forgot administrator password">
        <div className="login-content recovery-content">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="7.5" y="9" width="33" height="23" rx="3.5" stroke="currentColor" strokeWidth="2" />
              <path d="M18 39h12m-6-7v7m-9-15h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="18" r="2" fill="currentColor" />
            </svg>
          </div>
          <p className="portal-label">ADMINISTRATOR PORTAL</p>
          <h1>Forgot Your Password?</h1>
          <p className="recovery-description">Enter your registered email address and we'll send you instructions to reset your password.</p>

          {isSuccess ? (
            <div className="recovery-result" role="status" aria-live="polite">
              <p className="recovery-message is-success">{message}</p>
              <Link className="login-button recovery-return" to="/login">Back to Login</Link>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="recovery-email">Email address</label>
              <div className="input-shell">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                  <path d="m4.5 7 7.5 6 7.5-6" />
                </svg>
                <input
                  id="recovery-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength="150"
                  required
                />
              </div>
              <button className="login-button" type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
              </button>
              <p className={`form-message recovery-message${message ? ' is-visible' : ''}`} role="alert" aria-live="polite">
                {message || ' '}
              </p>
            </form>
          )}
          {!isSuccess && <Link className="recovery-back-link" to="/login">Back to Login</Link>}
        </div>
      </section>
    </main>
  );
}

export default ForgotPassword;
