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
  it('offers a keyboard skip link and a search-first hero', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Bỏ qua đến nội dung chính/i }).getAttribute('href')).toBe('#main-content');
    expect(screen.getByRole('textbox', { name: /Mô tả chuyến đi của bạn/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Khám phá với AI/i })).toBeTruthy();
  });

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

  it('uses the hero prompt to reveal the sample shortlist', () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByRole('textbox', { name: /Mô tả chuyến đi của bạn/i }), {
      target: { value: 'Một cuối tuần yên tĩnh ở Đà Lạt' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Khám phá với AI/i }));

    expect(screen.getByText('Kết quả minh họa')).toBeTruthy();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
