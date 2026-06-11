import { LlmResponseComposerService } from './llm-response-composer.service';

describe('LlmResponseComposerService compare context', () => {
  it('passes enriched tagged place metadata to the LLM for compare workflows', async () => {
    const chat = jest.fn(async (_messages: any[]) => ({ content: 'comparison answer' }));
    const llmClient = {
      chat,
      streamChat: jest.fn(),
    };
    const prisma = {
      place: {
        findMany: jest.fn(async () => []),
        findFirst: jest.fn(async () => null),
      },
    };
    const placesService = {
      ensureGoogleReviewsForAiContext: jest.fn(async () => []),
    };

    const service = new LlmResponseComposerService(
      llmClient as any,
      prisma as any,
      placesService as any,
    );

    await service.compose({
      userQuery: 'So sánh theo giá, vị trí và tiện nghi.',
      workflowId: 'COMPARE_PLACES',
      parameters: { criteria: ['price', 'location', 'amenities'] },
      toolResults: {},
      taggedPlaceIds: ['serpapi-alpha', 'serpapi-beta'],
      taggedPlaces: [
        {
          id: 'serpapi-alpha',
          name: 'Alpha Hotel',
          address: '1 Beach Road',
          latitude: 16.1,
          longitude: 108.2,
          rating: 4.7,
          reviewCount: 128,
          price: '900.000đ/đêm',
          type: 'hotel',
          amenities: ['wifi', 'pool'],
          source: 'serpapi',
          sourcePlaceId: 'alpha',
        },
        {
          id: 'serpapi-beta',
          name: 'Beta Homestay',
          address: '2 Hill Street',
          rating: 4.4,
          reviewCount: 76,
          price: '650.000đ/đêm',
          type: 'homestay',
          amenities: ['parking', 'kitchen'],
          source: 'serpapi',
          sourcePlaceId: 'beta',
        },
      ],
    });

    const messages = chat.mock.calls[0][0];
    const userContext = messages[messages.length - 1].content;

    expect(userContext).toContain('[DANH SÁCH ĐỊA ĐIỂM ĐƯỢC TAG VÀ NHẬN XÉT THỰC TẾ]');
    expect(userContext).toContain('Alpha Hotel');
    expect(userContext).toContain('Giá/Tầm giá: 900.000đ/đêm');
    expect(userContext).toContain('Số review: 128');
    expect(userContext).toContain('Tiện nghi/đặc điểm nổi bật: wifi, pool');
    expect(userContext).not.toContain('[ACTIVE SEARCH RESULTS CONTEXT]');
    expect(userContext).toContain('Beta Homestay');
    expect(userContext).toContain('Nguồn: serpapi/beta');
  });

  it('loads local fixture reviews for local tagged places', async () => {
    const chat = jest.fn(async (_messages: any[]) => ({ content: 'fixture comparison answer' }));
    const llmClient = {
      chat,
      streamChat: jest.fn(),
    };
    const prisma = {
      place: {
        findMany: jest.fn(async () => []),
        findFirst: jest.fn(async () => null),
      },
    };
    const placesService = {
      ensureGoogleReviewsForAiContext: jest.fn(async () => []),
      findOne: jest.fn(async (id: string) => ({
        id,
        source: 'local',
        sourcePlaceId: id.replace('local-', ''),
        placeName: id === 'local-0' ? 'Lady Hill Sapa Resort' : 'Aristo Hotel',
        placeAddress: id === 'local-0' ? 'Sa Pa' : 'Lao Cai',
        categories: ['resort'],
        lat: 22.34,
        lng: 103.82,
        averageRating: 4.5,
        reviewCount: 2,
        rawSerpApiPropertyDetails: { amenities: ['wifi', 'pool'] },
      })),
      findReviews: jest.fn(async (id: string) => [{
        id: `review-${id}`,
        placeId: id,
        rating: 5,
        reviewText: id === 'local-0'
          ? 'Phòng nghỉ rộng rãi, sạch sẽ và nhân viên rất dễ thương.'
          : 'Vị trí thuận tiện, gần trung tâm và có nhiều tiện ích.',
        author: 'Fixture User',
        source: 'local',
      }]),
    };

    const service = new LlmResponseComposerService(
      llmClient as any,
      prisma as any,
      placesService as any,
    );

    await service.compose({
      userQuery: 'So sánh hai nơi này theo sạch sẽ và vị trí.',
      workflowId: 'COMPARE_PLACES',
      parameters: { criteria: ['cleanliness', 'location'] },
      toolResults: {},
      taggedPlaceIds: ['local-0', 'local-1'],
      taggedPlaces: [
        { id: 'local-0', name: 'Lady Hill Sapa Resort' },
        { id: 'local-1', name: 'Aristo Hotel' },
      ],
    });

    expect(placesService.findOne).toHaveBeenCalledWith('local-0');
    expect(placesService.findReviews).toHaveBeenCalledWith('local-0');
    expect(prisma.place.findFirst).not.toHaveBeenCalled();

    const messages = chat.mock.calls[0][0];
    const userContext = messages[messages.length - 1].content;

    expect(userContext).toContain('Lady Hill Sapa Resort');
    expect(userContext).toContain('Nguồn: local/0');
    expect(userContext).toContain('Phòng nghỉ rộng rãi, sạch sẽ');
    expect(userContext).toContain('Vị trí thuận tiện, gần trung tâm');
  });
});
