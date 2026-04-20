import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import { AuthProvider } from '../context/AuthContext';

// Mock the AuthContext since Sidebar depends on it
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'test_user', role: 'event_manager', full_name: 'Test Manager' },
    logout: vi.fn(),
    isManager: true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Sidebar Component', () => {
  it('renders EventFlow branding', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check for app name
    expect(screen.getByText(/EventFlow/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check for some key navigation links
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Heatmap/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
  });
});
