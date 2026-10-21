import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import View from './View';

test('updates a product status through the status PATCH endpoint', async () => {
  sessionStorage.setItem('adminToken', 'test-token');
  const item = {
    id: 42,
    name: 'Test laptop',
    type: 'PRODUCT',
    categoryId: 1,
    categoryName: 'Computers',
    rate: 1000,
    stock: 3,
    active: true,
  };
  global.fetch = jest.fn((url, options = {}) => {
    if (url.endsWith('/api/items')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([item]) });
    }
    if (url.endsWith('/api/categories/active')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    }
    if (url.endsWith('/api/items/42/status?active=false')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ...item, active: false }) });
    }
    throw new Error(`Unexpected request: ${url} ${options.method || 'GET'}`);
  });

  render(<MemoryRouter><View /></MemoryRouter>);

  const deactivateButton = await screen.findByRole('button', { name: 'Deactivate Test laptop' });
  fireEvent.click(deactivateButton);

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/items\/42\/status\?active=false$/),
    expect.objectContaining({ method: 'PATCH' }),
  ));
  expect(await screen.findByRole('button', { name: 'Activate Test laptop' })).toHaveTextContent('Inactive');
});