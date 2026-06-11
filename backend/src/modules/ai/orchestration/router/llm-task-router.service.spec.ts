import { Logger } from '@nestjs/common';
import { LlmTaskRouterService } from './llm-task-router.service';

describe('LlmTaskRouterService deterministic fallback', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('routes explicit compare requests when the LLM returns empty content', async () => {
    const router = new LlmTaskRouterService({
      chat: jest.fn(async () => ({ content: '' })),
    } as any);

    const route = await router.route('So sánh các địa điểm tôi đã tag theo các tiêu chí rating, location, amenities, quiet, cleanliness.');

    expect(route).toEqual({
      workflowId: 'COMPARE_PLACES',
      parameters: {
        placeNames: [],
        criteria: ['rating', 'location', 'amenities', 'quiet', 'cleanliness'],
      },
    });
  });

  it('routes explicit analysis requests when the LLM throws', async () => {
    const router = new LlmTaskRouterService({
      chat: jest.fn(async () => {
        throw new Error('empty Cloudflare choice');
      }),
    } as any);

    const route = await router.route('Phân tích chỗ này giúp tôi, tôi quan tâm vị trí và yên tĩnh.');

    expect(route).toEqual({
      workflowId: 'ANALYZE_PLACE',
      parameters: {
        placeName: '',
        preferences: ['vị trí', 'yên tĩnh'],
      },
    });
  });
});
