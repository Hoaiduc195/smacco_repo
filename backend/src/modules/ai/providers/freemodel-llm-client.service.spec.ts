import { Logger } from '@nestjs/common';
import { FreemodelLlmClientService } from './freemodel-llm-client.service';

const mockCreate = jest.fn();

describe('FreemodelLlmClientService', () => {
  const createService = (overrides: Record<string, any> = {}) => new FreemodelLlmClientService({
    get: jest.fn((key: string) => {
      const values: Record<string, any> = {
        'freemodel.apiKey': 'freemodel-key-1',
        'freemodel.baseUrl': 'https://api.freemodel.dev/v1/',
        'freemodel.model': 'gpt-5.4',
        'freemodel.timeout': 20,
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
    await expect(createService({ 'freemodel.apiKey': '' }).chat([{ role: 'user', content: 'hello' }])).rejects.toThrow(
      'Freemodel API key is not configured. Set FREEMODEL_API_KEY or switch AI_PROVIDER.',
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
      'Freemodel API request failed (HTTP 401; invalid_request_error: Internal server error; code=invalid_api_key; request-id=req-123; model=gpt-5.4; baseURL=https://api.freemodel.dev/v1)',
    );
  });

  it('normalizes Freemodel runtime configuration', () => {
    const service = createService();

    expect((service as any).baseURL).toBe('https://api.freemodel.dev/v1');
    expect((service as any).model).toBe('gpt-5.4');
    expect((service as any).apiKeyConfigured).toBe(true);
  });
});
