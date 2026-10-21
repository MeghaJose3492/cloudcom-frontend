import { fireEvent, render, screen } from '@testing-library/react';
import CloudComHero from './CloudComHero';

test('renders the premium CloudCom hero and its product, service, and contact sessions', () => {
  render(<CloudComHero />);

  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'CloudCom home' })).toHaveAttribute('href', '#home');
  expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '#products');
  expect(screen.getByRole('heading', { level: 1, name: 'CloudCom' })).toBeInTheDocument();
  expect(screen.getByRole('heading', {
    name: /Your One-Stop Destination for Custom PCs, Tech Sales & Fast Repairs/i,
  })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Explore Laptops & PCs/i })).toHaveAttribute('href', '#products');
  expect(screen.getByRole('link', { name: /View Services/i })).toHaveAttribute('href', '#services');
  expect(screen.getByRole('heading', { name: 'Our Products' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Our Services' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /book now|book an appointment|schedule an appointment/i })).not.toBeInTheDocument();
});

test('toggles the mobile navigation accessibly', () => {
  render(<CloudComHero />);
  const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });

  fireEvent.click(menuButton);

  expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Close navigation menu' })).toBeInTheDocument();
});
