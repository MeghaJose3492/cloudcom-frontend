import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Contact from './Contact';
import { sendInquiry } from './Api';

jest.mock('./Api', () => ({ sendInquiry: jest.fn() }));

function fillRequiredFields(email, phone) {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Asha' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: phone } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Question' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please contact me.' } });
}

test('rejects malformed email without sending the inquiry', async () => {
  render(<Contact />);
  fillRequiredFields('not-an-email', '+12 345 678');
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  expect(sendInquiry).not.toHaveBeenCalled();
});

test.each(['+12 345 678 90', '+12 (345) 678', '12-345'])('rejects invalid phone format %s', async (phone) => {
  render(<Contact />);
  fillRequiredFields('asha@example.com', phone);
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(await screen.findByText('Use only +, numbers, and up to two spaces.')).toBeInTheDocument();
  expect(sendInquiry).not.toHaveBeenCalled();
});

test('submits a valid email and phone with two spaces', async () => {
  sendInquiry.mockResolvedValueOnce();
  render(<Contact />);
  fillRequiredFields('asha@example.com', '+91 12345 67890');
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  await waitFor(() => expect(sendInquiry).toHaveBeenCalledWith(expect.objectContaining({
    email: 'asha@example.com',
    phone: '+91 12345 67890',
  })));
});