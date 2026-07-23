import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('LandingPage guest navigation', () => {
  it('uses a native in-page anchor for the header search CTA', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const searchCta = screen.getByRole('link', { name: /Bắt đầu tìm kiếm/i });

    expect(searchCta.getAttribute('href')).toBe('#signin');
    expect(document.querySelector('#signin')).not.toBeNull();
  });

  it('shows clearly labelled sample results when the prompt demo runs', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Tạo danh sách gợi ý/i }));

    expect(screen.getByText('Kết quả minh họa')).toBeTruthy();
    expect(screen.getByText('Moss Courtyard Stay')).toBeTruthy();
  });
});
