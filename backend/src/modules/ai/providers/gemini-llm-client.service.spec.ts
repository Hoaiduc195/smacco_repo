import axios from 'axios';
import { Logger } from '@nestjs/common';
import { GeminiLlmClientService } from './gemini-llm-client.service';

jest.mock('axios');

describe('GeminiLlmClientService', () => {
  const postMock = axios.post as jest.Mock;

  const createService = () => new GeminiLlmClientService({
    get: jest.fn((key: string) => {
      const values: Record<string, any> = {
        'gemini.apiKey': 'gemini-key-1',
        'gemini.baseUrl': 'https://generativelanguage.googleapis.com/v1beta',
        'gemini.model': 'gemini-1.5-flash',
        'gemini.timeout': 60,
      };
      return values[key];
    }),
  } as any);

  beforeEach(() => {
    postMock.mockReset();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('converts chat messages to Gemini generateContent payloads', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        candidates: [
          {
            content: { parts: [{ text: 'Xin chào' }] },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 3,
          totalTokenCount: 13,
        },
      },
    });

    const response = await createService().chat([
      { role: 'system', content: 'Bạn là trợ lý.' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
      { role: 'user', content: 'tư vấn giúp tôi' },
    ]);

    expect(response).toEqual({
      content: 'Xin chào',
      finishReason: 'stop',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 3,
        total_tokens: 13,
      },
    });
    expect(postMock.mock.calls[0][0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=gemini-key-1');
    expect(postMock.mock.calls[0][1]).toMatchObject({
      systemInstruction: { parts: [{ text: 'Bạn là trợ lý.' }] },
      contents: [
        { role: 'user', parts: [{ text: 'hello' }] },
        { role: 'model', parts: [{ text: 'hi' }] },
        { role: 'user', parts: [{ text: 'tư vấn giúp tôi' }] },
      ],
    });
  });

  it('requests JSON mime type for response_format and retries without it if rejected', async () => {
    postMock
      .mockRejectedValueOnce(new Error('Request failed with status code 400'))
      .mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: { parts: [{ text: '{"workflowId":"GENERAL_CHAT","parameters":{}}' }] },
              finishReason: 'STOP',
            },
          ],
        },
      });

    const response = await createService().chat(
      [{ role: 'user', content: 'route this' }],
      { response_format: { type: 'json_object' } },
    );

    expect(response.content).toBe('{"workflowId":"GENERAL_CHAT","parameters":{}}');
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][1]).toMatchObject({
      generationConfig: { responseMimeType: 'application/json' },
    });
    expect(postMock.mock.calls[1][1]).not.toHaveProperty('generationConfig');
  });

  it('throws Gemini quota errors with provider details and retry-after', async () => {
    const quotaError = new Error('Request failed with status code 429') as any;
    quotaError.response = {
      status: 429,
      headers: { 'retry-after': '30' },
      data: {
        error: {
          status: 'RESOURCE_EXHAUSTED',
          message: 'Quota exceeded for quota metric Generate Content API requests per minute.',
          details: [
            {
              reason: 'RATE_LIMIT_EXCEEDED',
            },
          ],
        },
      },
    };
    postMock.mockRejectedValueOnce(quotaError);

    await expect(createService().chat([{ role: 'user', content: 'hello' }])).rejects.toThrow(
      'Gemini API request failed (HTTP 429; RESOURCE_EXHAUSTED: Quota exceeded for quota metric Generate Content API requests per minute.: details=RATE_LIMIT_EXCEEDED; retry-after=30s)',
    );
  });
});
