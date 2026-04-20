import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() })
}));

describe('LoginPage Smoke Test', () => {
  it('renders login form', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Enter EventFlow/i)).toBeInTheDocument();
  });
});
