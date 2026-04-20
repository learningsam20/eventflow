import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SimulatorPage from '../pages/SimulatorPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'event_manager' }, isManager: true })
}));

describe('SimulatorPage Smoke Test', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <SimulatorPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Digital Twin Simulator/i)).toBeInTheDocument();
  });
});
