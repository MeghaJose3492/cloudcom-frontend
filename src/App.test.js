import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the administrator sign-in form', () => {
  sessionStorage.clear();
  window.history.pushState({}, '', '/login');
  render(<App />);
  expect(screen.getByRole('heading', { name: /computer sales & service/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Forgot Password?' })).toHaveAttribute('href', '/forgot-password');
});

test('shows a not-found page for unknown routes', () => {
  window.history.pushState({}, '', '/missing-page');
  render(<App />);

  expect(screen.getByRole('heading', { name: "This page isn't here." })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Return to CloudCom' })).toHaveAttribute('href', '/');
});
