import { Logger } from '@nestjs/common';
import { OpenAiCompatibleLlmClientService } from './openai-compatible-llm-client.service';

const mockCreate = jest.fn();

describe('OpenAiCompatibleLlmClientService', () => {
  const createService = (overrides: Record<string, any> = {}) => new OpenAiCompatibleLlmClientService({
    get: jest.fn((key: string) => {
      const values: Record<string, any> = {
        'openaiCompatible.apiKey': 'openai-compatible-key-1',
        'openaiCompatible.baseUrl': 'https://api.freemodel.dev/v1/',
        'openaiCompatible.model': 'gpt-5.4',
        'openaiCompatible.timeout': 20,
        ...overrides,
      };
      return values[key];
    }),
  } as any);

  beforeEach(() => {
    mockCreate.mockReset();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws a clear configuration error when the API key is missing', async () => {
    await expect(createService({ 'openaiCompatible.apiKey': '' }).chat([{ role: 'user', content: 'hello' }])).rejects.toThrow(
      'OpenAI-compatible API key is not configured. Set OPENAI_COMPATIBLE_API_KEY or switch AI_PROVIDER.',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('formats upstream 401 errors with provider details', async () => {
    const service = createService();
    const upstreamError = new Error('401 "Internal server error"') as any;
    upstreamError.status = 401;
    upstreamError.error = {
      type: 'invalid_request_error',
      message: 'Internal server error',
      code: 'invalid_api_key',
    };
    upstreamError.headers = { 'x-request-id': 'req-123' };
    mockCreate.mockRejectedValueOnce(upstreamError);
    (service as any).client = { chat: { completions: { create: mockCreate } } };

    await expect(service.chat([{ role: 'user', content: 'hello' }])).rejects.toThrow(
      'OpenAI-compatible API request failed (HTTP 401; invalid_request_error: Internal server error; code=invalid_api_key; request-id=req-123; model=gpt-5.4; baseURL=https://api.freemodel.dev/v1)',
    );
  });

  it('normalizes OpenAI-compatible runtime configuration', () => {
    const service = createService();

    expect((service as any).baseURL).toBe('https://api.freemodel.dev/v1');
    expect((service as any).model).toBe('gpt-5.4');
    expect((service as any).apiKeyConfigured).toBe(true);
  });
});
