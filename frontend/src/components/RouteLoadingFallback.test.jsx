import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RouteLoadingFallback from './RouteLoadingFallback';

describe('RouteLoadingFallback', () => {
  it('announces route loading to assistive technology', () => {
    render(<RouteLoadingFallback />);

    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('Đang chuẩn bị trải nghiệm Smacco…')).toBeTruthy();
  });
});
