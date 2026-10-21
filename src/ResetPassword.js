import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resetAdminPassword } from './Api';
import './App.css';

function VisibilityIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.2 2.3-2.3 3.4M6.2 6.2C4.2 7.6 2.9 9.7 2.5 12c1 2.8 4.5 7 9.5 7 1 0 2-.2 2.9-.5" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
  );
}

function ResetPassword() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token')?.trim() || '';
  const hasToken = Boolean(token);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(() => hasToken ? '' : 'This reset link is missing or invalid. Request a new password reset link.');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const submissionInProgress = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionInProgress.current || !hasToken) return;
    setMessage('');
    setErrors({});

    const nextErrors = {};
    if (!newPassword) nextErrors.newPassword = 'Enter a new password.';
    else if (newPassword.length < 12) {
      nextErrors.newPassword = 'Password must be at least 12 characters.';
    } else if (newPassword.length > 150) {
      nextErrors.newPassword = 'Password must be no more than 150 characters.';
    }
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your new password.';
    else if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      await resetAdminPassword(token, newPassword);
      setIsSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Your password has been reset. You can now sign in with your new password.');
    } catch (error) {
      if (error.status === 400) {
        const invalidLinkMessage = 'This reset link is invalid, expired, or has already been used. Request a new link.';
        setMessage(error.message && !error.message.includes(token) ? error.message : invalidLinkMessage);
      } else if (error.status === 429) {
        setMessage('Too many attempts were made. Please try again later.');
      } else {
        setMessage('Unable to reset your password right now. Please try again.');
      }
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page recovery-page reset-password-page">
      <section className="login-ring reset-password-ring" aria-label="Reset administrator password">
        <div className="login-content recovery-content reset-password-content">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="7.5" y="9" width="33" height="23" rx="3.5" stroke="currentColor" strokeWidth="2" />
              <path d="M18 39h12m-6-7v7m-9-15h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="18" r="2" fill="currentColor" />
            </svg>
          </div>
          <p className="cloudcom-wordmark">CloudCom</p>
          <p className="portal-label">ADMINISTRATOR PORTAL</p>
          <h1>Reset Your Password</h1>
          <p className="recovery-description">Choose a strong new password for your admin account.</p>

          {isSuccess ? (
            <div className="recovery-result" role="status" aria-live="polite">
              <p className="recovery-message is-success">{message}</p>
              <Link className="login-button recovery-return" to="/login">Back to Login</Link>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="new-password">New Password</label>
              <div className="input-shell">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5.5" y="10" width="13" height="10" rx="2" /><path d="M8.5 10V7a3.5 3.5 0 1 1 7 0v3m-3.5 4v2" /></svg>
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  aria-invalid={Boolean(errors.newPassword)}
                  aria-describedby={errors.newPassword ? 'new-password-error' : 'password-policy'}
                  maxLength="150"
                  required
                />
                <button className="password-visibility" type="button" aria-label={showPassword ? 'Hide new password' : 'Show new password'} onClick={() => setShowPassword((visible) => !visible)}>
                  <VisibilityIcon visible={showPassword} />
                </button>
              </div>
              {errors.newPassword && <small className="recovery-field-error" id="new-password-error">{errors.newPassword}</small>}
              <small className={`recovery-policy${newPassword.length >= 12 ? ' is-met' : ''}`} id="password-policy">
                {newPassword.length >= 12 ? 'Password meets the 12-character minimum.' : 'Use at least 12 characters.'}
              </small>

              <label className="field-label recovery-second-label" htmlFor="confirm-password">Confirm Password</label>
              <div className="input-shell">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5.5" y="10" width="13" height="10" rx="2" /><path d="M8.5 10V7a3.5 3.5 0 1 1 7 0v3m-3.5 4v2" /></svg>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  maxLength="150"
                  required
                />
                <button className="password-visibility" type="button" aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmation((visible) => !visible)}>
                  <VisibilityIcon visible={showConfirmation} />
                </button>
              </div>
              {errors.confirmPassword && <small className="recovery-field-error" id="confirm-password-error">{errors.confirmPassword}</small>}

              <button className="login-button" type="submit" disabled={isSubmitting || !hasToken}>
                <span>{isSubmitting ? 'Resetting...' : 'Reset Password'}</span>
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

export default ResetPassword;
