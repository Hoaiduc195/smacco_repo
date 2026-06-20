import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'traveler@example.com' },
    logout: vi.fn(),
  }),
}));

describe('Navbar brand navigation', () => {
  it('links the Smacco logo to the landing page', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const brandLink = screen.getByRole('link', { name: /Smacco Logo/i });

    expect(brandLink.getAttribute('href')).toBe('/');
  });
});
