import { PlaceComparisonResultsService } from './place-comparison-results.service';

describe('PlaceComparisonResultsService', () => {
  const createService = () => new PlaceComparisonResultsService({} as any, {} as any, {} as any);

  it('parses comparison JSON wrapped in markdown fences', () => {
    const payload = createService().parsePayload([
      '```json',
      '{',
      '  "type": "place_comparison",',
      '  "status": "ok",',
      '  "places": []',
      '}',
      '```',
    ].join('\n'));

    expect(payload).toMatchObject({ type: 'place_comparison', status: 'ok' });
  });

  it('parses comparison JSON with surrounding prose', () => {
    const payload = createService().parsePayload([
      'Here is the result:',
      '{',
      '  "type": "place_comparison",',
      '  "status": "ok",',
      '  "places": []',
      '}',
    ].join('\n'));

    expect(payload).toMatchObject({ type: 'place_comparison', status: 'ok' });
  });

  it('builds a metadata fallback payload when model output is not JSON', () => {
    const payload = createService().buildFallbackPayload('Alpha hợp hơn nếu ưu tiên rating.', [
      { id: 'alpha', name: 'Alpha Hotel', rating: 4.7, price: '900k', address: 'Near beach', amenities: ['wifi', 'pool'] },
      { id: 'beta', name: 'Beta Homestay', rating: 4.4, price: '650k', address: 'Center', amenities: ['parking'] },
    ], { criteria: ['rating', 'price'] });

    expect(payload).toMatchObject({
      type: 'place_comparison',
      status: 'ok',
      overallAssessment: { recommendedPlaceId: 'alpha' },
    });
    expect(payload.comparisonRows).toHaveLength(2);
    expect(payload.comparisonRows[0].values.alpha).toBe('4.7/5');
  });
});
