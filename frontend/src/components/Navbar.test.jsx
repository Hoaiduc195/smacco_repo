import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('exposes the account menu state to assistive technology', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const accountButton = screen.getByRole('button', { name: /Mở menu tài khoản/i });

    expect(accountButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(accountButton);

    expect(accountButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('group', { name: /Tài khoản/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Trang cá nhân/i })).toBeTruthy();
  });
});
