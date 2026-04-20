import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NarrativePage from '../pages/NarrativePage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ 
    user: { id: 1, full_name: 'Test Fan', username: 'fan' },
    isManager: false 
  })
}));

describe('NarrativePage Smoke Test', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <NarrativePage />
      </MemoryRouter>
    );
    expect(document.body).toBeDefined();
  });
});
