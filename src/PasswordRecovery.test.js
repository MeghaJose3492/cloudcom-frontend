import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
  sessionStorage.clear();
});

test('forgot password shows the same generic confirmation after a successful request', async () => {
  global.fetch.mockResolvedValue({ ok: true, status: 204 });
  render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

  expect(await screen.findByText('If an account exists for this email, password reset instructions will be sent.')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/admin\/forgot-password$/),
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'admin@example.com' }) }),
  );
});

test('reset password validates matching values without sending a request', async () => {
  render(<MemoryRouter initialEntries={['/reset-password?token=one-time-token']}><ResetPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'SecurePass123' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'DifferentPass123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('reset submits the URL token only to the reset API and displays server errors', async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ detail: 'Reset token has expired.' }),
  });
  render(<MemoryRouter initialEntries={['/reset-password?token=one-time-token']}><ResetPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'SecurePass123' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'SecurePass123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(await screen.findByText('Reset token has expired.')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/admin\/reset-password$/),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'one-time-token', newPassword: 'SecurePass123' }),
    }),
  );
  await waitFor(() => expect(localStorage.length + sessionStorage.length).toBe(0));
});

test('successful reset clears password inputs and shows a login link', async () => {
  global.fetch.mockResolvedValue({ ok: true, status: 204 });
  const { container } = render(<MemoryRouter initialEntries={['/reset-password?token=one-time-token']}><ResetPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'SecurePass123' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'SecurePass123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(await screen.findByText('Your password has been reset. You can now sign in with your new password.')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/admin\/reset-password$/),
    expect.objectContaining({ body: JSON.stringify({ token: 'one-time-token', newPassword: 'SecurePass123' }) }),
  );
  expect(container.querySelector('input[name="newPassword"]')).not.toBeInTheDocument();
  expect(container.querySelector('input[name="confirmPassword"]')).not.toBeInTheDocument();
  expect(localStorage.length + sessionStorage.length).toBe(0);
});

test('reset page explains when a token is missing', () => {
  render(<MemoryRouter initialEntries={['/reset-password']}><ResetPassword /></MemoryRouter>);

  expect(screen.getByText('This reset link is missing or invalid. Request a new password reset link.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('reset password enforces the 12-character minimum', async () => {
  render(<MemoryRouter initialEntries={['/admin/reset-password?token=one-time-token']}><ResetPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'ShortPass1' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'ShortPass1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(await screen.findByText('Password must be at least 12 characters.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('rate-limited reset attempts show a retry-later message', async () => {
  global.fetch.mockResolvedValue({ status: 429, ok: false, json: async () => ({}) });
  render(<MemoryRouter initialEntries={['/admin/reset-password?token=one-time-token']}><ResetPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'SecurePassword123' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'SecurePassword123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(await screen.findByText('Too many attempts were made. Please try again later.')).toBeInTheDocument();
});

test('admin reset link route renders directly with the query token', () => {
  window.history.pushState({}, '', '/admin/reset-password?token=direct-link-token');
  render(<App />);

  expect(screen.getByRole('heading', { name: 'Reset Your Password' })).toBeInTheDocument();
});

test('reset errors never display an echoed reset token', async () => {
  const token = 'one-time-token';
  global.fetch.mockResolvedValue({
    status: 400,
    ok: false,
    json: async () => ({ detail: `Invalid token: ${token}` }),
  });
  render(<MemoryRouter initialEntries={[`/admin/reset-password?token=${token}`]}><ResetPassword /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'SecurePassword123' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'SecurePassword123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(await screen.findByText('This reset link is invalid, expired, or has already been used. Request a new link.')).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(token))).not.toBeInTheDocument();
});