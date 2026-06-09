import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PlaceCard from './PlaceCard';

describe('PlaceCard drag preview', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses a transparent native drag image and renders an opaque custom drag overlay', () => {
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

    fireEvent.dragStart(screen.getByRole('button'), { dataTransfer, clientX: 96, clientY: 72 });

    expect(dataTransfer.setData).toHaveBeenCalledWith('placeId', 'place-1');
    expect(dataTransfer.setDragImage).toHaveBeenCalledTimes(1);

    const [nativeDragImage, offsetX, offsetY] = dataTransfer.setDragImage.mock.calls[0];
    expect(nativeDragImage).toBeInstanceOf(HTMLCanvasElement);
    expect(offsetX).toBe(0);
    expect(offsetY).toBe(0);

    const overlay = document.querySelector('.place-card-drag-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay.textContent).toContain('<img src=x onerror=alert(1)>Unsafe');
    expect(overlay.querySelector('img')).toBeNull();
    expect(overlay.style.transform).toContain('scale(1.035)');
  });

  it('absorbs into the accepted drop target before spawning the source card back', () => {
    vi.useFakeTimers();

    const place = {
      id: 'place-1',
      name: 'Moc House',
      type: 'hotel',
    };

    const dataTransfer = {
      effectAllowed: '',
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };

    render(<PlaceCard place={place} onSelect={() => {}} />);

    fireEvent.dragStart(screen.getByRole('button'), { dataTransfer, clientX: 96, clientY: 72 });

    act(() => {
      window.dispatchEvent(new CustomEvent('app:place-drop-accepted', {
        detail: {
          placeId: 'place-1',
          target: { x: 520, y: 420 },
        },
      }));
    });

    let overlay = document.querySelector('.place-card-drag-overlay');
    expect(overlay.className).toContain('place-card-drag-overlay--absorbing');
    expect(overlay.style.transform).toContain('scale(0.18)');
    expect(screen.getByText('Đang kéo địa điểm')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(320);
    });

    overlay = document.querySelector('.place-card-drag-overlay');
    expect(overlay).toBeNull();
    expect(screen.queryByText('Đang kéo địa điểm')).toBeNull();
  });

  it('labels the secondary action as tag when used for chat-tagged places', () => {
    const place = {
      id: 'place-1',
      name: 'Moc House',
      type: 'hotel',
    };

    render(<PlaceCard place={place} onSelect={() => {}} onSave={() => {}} saveMode="tag" />);

    expect(screen.getByRole('button', { name: 'Tag' })).not.toBeNull();
  });

  it('labels a tagged place without implying it is saved', () => {
    const place = {
      id: 'place-1',
      name: 'Moc House',
      type: 'hotel',
    };

    render(<PlaceCard place={place} onSelect={() => {}} onSave={() => {}} isSaved saveMode="tag" />);

    expect(screen.getByRole('button', { name: 'Đã tag' })).not.toBeNull();
  });
});
