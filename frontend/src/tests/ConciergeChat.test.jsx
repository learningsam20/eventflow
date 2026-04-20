import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ConciergeChat from '../pages/ConciergeChat';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ 
    user: { id: 1, full_name: 'Test Fan', username: 'fan' },
    isManager: false 
  })
}));

describe('ConciergeChat Smoke Test', () => {
  it('renders chat interface', async () => {
    render(
      <MemoryRouter>
        <ConciergeChat />
      </MemoryRouter>
    );
    expect(await screen.findByText(/AI Concierge/i)).toBeInTheDocument();
  });
});
