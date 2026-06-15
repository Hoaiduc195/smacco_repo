import { describe, expect, it } from 'vitest';
import { buildChatPlacesPayload, normalizeChatPlacePayload } from './chatPlacePayload';

describe('chat place payload normalization', () => {
  it('coerces search result objects into the backend chat DTO shape', () => {
    const place = normalizeChatPlacePayload({
      id: 12345,
      name: 'Alpha Hotel',
      displayAddress: 'Da Nang',
      lat: '16.047',
      lng: '108.206',
      rating: '4.7',
      categories: ['hotel'],
      amenities: [{ name: 'Wifi' }, { title: 'Pool' }, null, { unknown: 'ignored' }],
      ratePerNight: { lowest: '800.000đ' },
      userRatingsTotal: '120',
      source: 'serpapi',
      sourcePlaceId: 987,
    });

    expect(place).toEqual({
      id: '12345',
      name: 'Alpha Hotel',
      address: 'Da Nang',
      latitude: 16.047,
      longitude: 108.206,
      rating: 4.7,
      type: 'hotel',
      amenities: ['Wifi', 'Pool'],
      price: '800.000đ',
      reviewCount: 120,
      source: 'serpapi',
      sourcePlaceId: '987',
    });
  });

  it('returns only valid place ids and compact payload rows', () => {
    const result = buildChatPlacesPayload([
      { id: 'a', name: 'Alpha' },
      { name: 'No id still useful' },
      { unknown: true },
    ]);

    expect(result.ids).toEqual(['a']);
    expect(result.payload).toEqual([
      { id: 'a', name: 'Alpha' },
      { name: 'No id still useful' },
    ]);
  });
});
