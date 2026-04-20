import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OrdersPage from '../pages/OrdersPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 } })
}));

describe('OrdersPage Smoke Test', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Smart Ordering/i)).toBeInTheDocument();
  });
});
