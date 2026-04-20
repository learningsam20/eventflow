import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TicketsPage from '../pages/TicketsPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 } })
}));

describe('TicketsPage Smoke Test', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/My Tickets/i)).toBeInTheDocument();
  });
});
