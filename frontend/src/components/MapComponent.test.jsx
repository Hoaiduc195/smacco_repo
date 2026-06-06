import { describe, expect, it, vi } from 'vitest';
import { createPopupNode } from './MapComponent';

describe('createPopupNode', () => {
  it('renders feature properties as text instead of injecting HTML', () => {
    const feature = {
      properties: {
        name: '<img src=x onerror=alert(1)>Name',
        address: '<script>alert(1)</script> Address',
        rating: '<svg onload=alert(1)>5',
        kind: 'place',
      },
    };

    const popupNode = createPopupNode(feature);

    expect(popupNode.querySelector('img')).toBeNull();
    expect(popupNode.querySelector('script')).toBeNull();
    expect(popupNode.querySelector('svg')).toBeNull();
    expect(popupNode.textContent).toContain('<img src=x onerror=alert(1)>Name');
    expect(popupNode.textContent).toContain('<script>alert(1)</script> Address');
    expect(popupNode.textContent).toContain('<svg onload=alert(1)>5');
  });

  it('wires the directions button without querying injected markup', () => {
    const onDirectionsRequested = vi.fn();
    const payload = { id: 'place-1' };
    const popupNode = createPopupNode(
      { properties: { name: 'Safe place', kind: 'place' } },
      { onDirectionsRequested, payload }
    );

    popupNode.querySelector('[data-smacco-directions="true"]').click();

    expect(onDirectionsRequested).toHaveBeenCalledWith(payload);
  });
});
