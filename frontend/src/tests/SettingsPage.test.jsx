import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/SettingsPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ 
    user: { id: 1, full_name: 'Test User', username: 'user' },
    isManager: false 
  })
}));

describe('SettingsPage Smoke Test', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      const title = document.querySelector('.page-title');
      expect(title).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
