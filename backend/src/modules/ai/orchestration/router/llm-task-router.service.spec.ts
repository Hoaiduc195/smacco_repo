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

  it('sends only four recent history messages truncated to 500 characters', async () => {
    const chat = jest.fn(async () => ({ content: JSON.stringify({ workflowId: 'GENERAL_CHAT', parameters: {} }) }));
    const router = new LlmTaskRouterService({ chat } as any);
    const longText = 'x'.repeat(700);

    await router.route('Tin hiện tại', [
      { role: 'user', content: 'old-1' },
      { role: 'assistant', content: 'old-2' },
      { role: 'user', content: 'old-3' },
      { role: 'assistant', content: longText },
      { role: 'user', content: 'recent-user' },
      { role: 'assistant', content: 'recent-assistant' },
    ]);

    const messages = (chat.mock.calls[0] as any[])[0] as any[];
    const historyMessages = messages.filter((message: any) => message.role === 'assistant' || message.role === 'user').slice(0, -1);

    expect(historyMessages).toHaveLength(4);
    expect(historyMessages.map((message: any) => message.content)).toEqual([
      'old-3',
      `${'x'.repeat(500)}...`,
      'recent-user',
      'recent-assistant',
    ]);
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'Tin hiện tại' });
  });
});
