import { PlaceInsightResultsService } from './place-insight-results.service';

describe('PlaceInsightResultsService', () => {
  const service = new PlaceInsightResultsService();

  it('parses place insight JSON and builds an assistant summary', () => {
    const payload = {
      type: 'place_insight',
      status: 'ok',
      title: 'Insight cho Alpha Hotel',
      location: 'Da Nang',
      place: { id: 'serpapi-alpha', name: 'Alpha Hotel', address: 'Da Nang' },
      summary: 'Alpha Hotel có vị trí thuận tiện cho lịch trình ngắn.',
      pros: ['Gần khu trung tâm'],
      cons: ['Thiếu review mới'],
      overallAssessment: {
        summary: 'Alpha Hotel phù hợp nếu bạn ưu tiên vị trí và muốn tiết kiệm thời gian di chuyển.',
        verdict: 'Nên chọn nếu lịch trình tập trung quanh trung tâm.',
        reasons: ['Vị trí thuận tiện'],
        tradeoffs: ['Cần kiểm tra thêm review mới'],
      },
      followUpQuestion: 'Bạn muốn kiểm tra thêm tiện nghi không?',
    };

    const parsed = service.parsePayload(JSON.stringify(payload));
    const message = service.toAssistantMessage(parsed);

    expect(parsed).toMatchObject({
      type: 'place_insight',
      place: { id: 'serpapi-alpha', name: 'Alpha Hotel' },
      pros: ['Gần khu trung tâm'],
    });
    expect(message).toContain('Alpha Hotel phù hợp nếu bạn ưu tiên vị trí');
    expect(message).toContain('**Nhận định nhanh:** Nên chọn nếu lịch trình tập trung quanh trung tâm.');
    expect(message).toContain('[Alpha Hotel](place:serpapi-alpha)');
  });

  it('builds fallback payload from tagged place and insight tool context', () => {
    const payload = service.buildFallbackPayload('', [
      {
        id: 'serpapi-alpha',
        name: 'Alpha Hotel',
        address: 'Da Nang',
        rating: 4.6,
        reviewCount: 120,
        amenities: ['wifi', 'pool'],
      },
    ], { tripPurposes: ['nghỉ dưỡng'] }, {
      travel_estimate_context: {
        data: {
          status: 'estimated',
          startLabel: 'Vị trí hiện tại',
          estimatedRoadDistanceKm: 3.2,
          estimates: { carTaxiMinutes: 9, motorbikeMinutes: 8 },
          interpretation: 'Rất gần, phù hợp di chuyển ngắn trong ngày.',
        },
      },
      nearby_poi_context: {
        data: {
          status: 'success',
          items: [
            { name: 'Cafe A', category: 'amenity:cafe', distanceKm: 0.4 },
            { name: 'Museum B', category: 'tourism:museum', distanceKm: 1.1 },
          ],
        },
      },
    });

    expect(payload).toMatchObject({
      type: 'place_insight',
      status: 'ok',
      place: { id: 'serpapi-alpha', name: 'Alpha Hotel' },
    });
    expect(payload.transportation).toContain('taxi/ô tô khoảng 9 phút');
    expect(payload.food).toContain('Cafe A');
    expect(payload.attractions).toContain('Museum B');
  });
});
