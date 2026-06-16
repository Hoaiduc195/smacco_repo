import { LlmResponseComposerService } from './llm-response-composer.service';
import { Logger } from '@nestjs/common';

describe('LlmResponseComposerService compare context', () => {
  let loggerErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  afterAll(() => {
    Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  });

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  const createPrismaMock = () => ({
    place: {
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => null),
    },
  });

  const createPlacesServiceMock = () => ({
    ensureGoogleReviewsForAiContext: jest.fn(async () => []),
  });

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

    expect(userContext).toContain('[PRIVATE PLACE EVIDENCE - DO NOT MENTION THIS LABEL]');
    expect(userContext).toContain('Alpha Hotel');
    expect(userContext).toContain('Price/range: 900.000đ/đêm');
    expect(userContext).toContain('Review count: 128');
    expect(userContext).toContain('Amenities/highlights: wifi, pool');
    expect(userContext).not.toContain('[PRIVATE ACTIVE SEARCH RESULTS - DO NOT MENTION THIS LABEL]');
    expect(userContext).toContain('Beta Homestay');
    expect(userContext).toContain('Source: serpapi/beta');
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
    expect(userContext).toContain('Source: local/0');
    expect(userContext).toContain('Phòng nghỉ rộng rãi, sạch sẽ');
    expect(userContext).toContain('Vị trí thuận tiện, gần trung tâm');
  });

  it('propagates stream failures after partial text for non-structured workflows', async () => {
    const llmClient = {
      chat: jest.fn(),
      streamChat: jest.fn(async function* () {
        yield { delta: 'Phần đầu câu trả lời' };
        throw new Error('stream timeout');
      }),
    };
    const service = new LlmResponseComposerService(
      llmClient as any,
      createPrismaMock() as any,
      createPlacesServiceMock() as any,
    );

    const chunks: string[] = [];
    await expect(async () => {
      for await (const chunk of service.streamCompose({
        userQuery: 'Tư vấn thêm về địa điểm này',
        workflowId: 'GENERAL_CHAT',
        parameters: {},
        toolResults: {},
      })) {
        chunks.push(chunk);
      }
    }).rejects.toThrow('stream timeout');

    expect(chunks).toEqual(['Phần đầu câu trả lời']);
  });

  it('propagates non-stop stream finish reasons after partial text for non-structured workflows', async () => {
    const llmClient = {
      chat: jest.fn(),
      streamChat: jest.fn(async function* () {
        yield { delta: 'Phần đầu câu trả lời' };
        yield { delta: '', finishReason: 'length' };
      }),
    };
    const service = new LlmResponseComposerService(
      llmClient as any,
      createPrismaMock() as any,
      createPlacesServiceMock() as any,
    );

    const chunks: string[] = [];
    await expect(async () => {
      for await (const chunk of service.streamCompose({
        userQuery: 'Tư vấn thêm về địa điểm này',
        workflowId: 'GENERAL_CHAT',
        parameters: {},
        toolResults: {},
      })) {
        chunks.push(chunk);
      }
    }).rejects.toThrow('finishReason: length');

    expect(chunks).toEqual(['Phần đầu câu trả lời']);
  });

  it('requests JSON mode for analyze workflows', async () => {
    const chat = jest.fn(async () => ({ content: '{"type":"place_insight"}' }));
    const llmClient = {
      chat,
      streamChat: jest.fn(),
    };
    const service = new LlmResponseComposerService(
      llmClient as any,
      createPrismaMock() as any,
      createPlacesServiceMock() as any,
    );

    await service.compose({
      userQuery: 'Tạo insight cho địa điểm tôi đã tag.',
      workflowId: 'ANALYZE_PLACE',
      parameters: {},
      toolResults: {},
      taggedPlaces: [{ id: 'serpapi-alpha', name: 'Alpha Hotel' }],
    });

    expect(chat).toHaveBeenCalledWith(
      expect.any(Array),
      { response_format: { type: 'json_object' } },
    );
  });
});
