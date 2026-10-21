import { sendInquiry } from './Api';

afterEach(() => {
  jest.restoreAllMocks();
});

test('posts inquiry details to the public inquiries endpoint', async () => {
  const payload = {
    name: 'Asha',
    email: 'asha@example.com',
    phone: '9876543210',
    subject: 'Laptop availability',
    message: 'Do you have this model in stock?',
  };
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 204 });

  await sendInquiry(payload);

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/inquiries$/),
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );
});

test('surfaces the backend message when sending fails', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    json: async () => ({ detail: 'Inquiry email is not configured on the server.' }),
  });

  await expect(sendInquiry({})).rejects.toThrow('Inquiry email is not configured on the server.');
});