import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HeatmapPage from '../pages/HeatmapPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'event_manager' }, isManager: true })
}));

vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue({})
  }))
}));

describe('HeatmapPage Smoke Test', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <HeatmapPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Live Venue Heatmap/i)).toBeInTheDocument();
  });
});
