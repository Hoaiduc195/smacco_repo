import { LocalFixturePlacesService } from './local-fixture-places.service';

describe('LocalFixturePlacesService', () => {
  const createService = (values: Record<string, any> = {}) => new LocalFixturePlacesService({
    get: jest.fn((key: string) => values[key]),
  } as any);

  it('returns fixture places without requiring APP_PUBLIC_BASE_URL', () => {
    const places = createService({ 'app.port': 3001 }).findAll({ city: 'Sa Pa' });

    expect(places.length).toBeGreaterThan(0);
    expect(places[0]).toMatchObject({
      id: 'local-0',
      source: 'local',
      sourcePlaceId: '0',
    });
    expect(places[0].coverImageUrl).toContain('http://localhost:3001/api/v1/places/test-data/images/');
  });
});
