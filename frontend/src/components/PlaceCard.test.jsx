import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PlaceCard from './PlaceCard';

describe('PlaceCard drag preview', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the place name as text instead of injecting HTML into the drag preview', () => {
    vi.useFakeTimers();

    const place = {
      id: 'place-1',
      name: '<img src=x onerror=alert(1)>Unsafe',
      type: 'hotel',
    };

    const dataTransfer = {
      effectAllowed: '',
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };

    render(<PlaceCard place={place} onSelect={() => {}} />);

    fireEvent.dragStart(screen.getByRole('button'), { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('placeId', 'place-1');
    expect(dataTransfer.setDragImage).toHaveBeenCalledTimes(1);

    const [dragPreview] = dataTransfer.setDragImage.mock.calls[0];
    expect(dragPreview.querySelector('img')).toBeNull();
    expect(dragPreview.textContent).toContain('<img src=x onerror=alert(1)>Unsafe');

    vi.runAllTimers();
  });
});
