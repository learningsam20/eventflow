import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from '../pages/AnalyticsPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ 
    user: { id: 1, full_name: 'Test Analyst', username: 'analyst' },
    isManager: true 
  })
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => <div />,
  LineChart: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />
}));

describe('AnalyticsPage Smoke Test', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    );
    expect(document.body).toBeDefined();
  });
});
