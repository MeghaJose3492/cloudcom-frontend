import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddServices from './AddServices';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
});

test('switches to dark mode and remembers the selection', async () => {
  const { container } = render(<MemoryRouter><AddServices /></MemoryRouter>);

  await screen.findByRole('option', { name: 'Select category' });

  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

  expect(container.querySelector('.add-services-page')).toHaveClass('theme-dark');
  expect(localStorage.getItem('addServicesTheme')).toBe('dark');
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
});

test('shows a dialog when the backend cannot be reached', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  render(<MemoryRouter><AddServices /></MemoryRouter>);

  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Server unavailable' })).toBeInTheDocument();
});