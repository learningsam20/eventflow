import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// Common Mocks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ 
    user: { id: 1, full_name: 'Test Manager', username: 'manager', role: 'event_manager' },
    isManager: true 
  })
}));

// Mock Google Maps and Recharts which tend to break JSDOM tests
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue({})
  }))
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  LineChart: () => <div />,
  Line: () => <div />,
  AreaChart: () => <div />,
  Area: () => <div />,
  PieChart: () => <div />,
  Pie: () => <div />,
  Cell: () => <div />
}));

describe('DashboardPage Smoke Test', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      const title = document.querySelector('.page-title');
      expect(title).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
