import axios from 'axios';
import { Logger } from '@nestjs/common';
import { CloudflareAiLlmClientService } from './cloudflare-ai-llm-client.service';

jest.mock('axios');

describe('CloudflareAiLlmClientService', () => {
  const postMock = axios.post as jest.Mock;

  const createService = () => new CloudflareAiLlmClientService({
    get: jest.fn((key: string) => {
      const values: Record<string, any> = {
        'cloudflareAi.accountId': 'account-1',
        'cloudflareAi.apiToken': 'token-1',
        'cloudflareAi.model': '@cf/meta/llama-3.1-8b-instruct',
        'cloudflareAi.baseUrl': 'https://api.cloudflare.com/client/v4/accounts',
        'cloudflareAi.timeout': 20,
      };
      return values[key];
    }),
  } as any);

  beforeEach(() => {
    postMock.mockReset();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extracts content from Cloudflare Workers AI result.response envelope', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        result: {
          response: '{"workflowId":"GENERAL_CHAT","parameters":{}}',
        },
      },
    });

    const response = await createService().chat([
      { role: 'user', content: 'hello' },
    ]);

    expect(response.content).toBe('{"workflowId":"GENERAL_CHAT","parameters":{}}');
  });

  it('retries without response_format when Cloudflare returns no usable content', async () => {
    postMock
      .mockResolvedValueOnce({ data: { success: true, result: {} } })
      .mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: { content: '{"workflowId":"COMPARE_PLACES","parameters":{"criteria":"overall"}}' },
              finish_reason: 'stop',
            },
          ],
        },
      });

    const response = await createService().chat(
      [{ role: 'user', content: 'so sánh hai nơi này' }],
      { response_format: { type: 'json_object' } },
    );

    expect(response.content).toBe('{"workflowId":"COMPARE_PLACES","parameters":{"criteria":"overall"}}');
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][1]).toMatchObject({ response_format: { type: 'json_object' } });
    expect(postMock.mock.calls[1][1]).not.toHaveProperty('response_format');
  });

  it('retries without response_format when Cloudflare rejects the request', async () => {
    postMock
      .mockRejectedValueOnce(new Error('Request failed with status code 400'))
      .mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: { content: '{"type":"place_comparison","status":"ok"}' },
              finish_reason: 'stop',
            },
          ],
        },
      });

    const response = await createService().chat(
      [{ role: 'user', content: 'compare as json' }],
      { response_format: { type: 'json_object' } },
    );

    expect(response.content).toBe('{"type":"place_comparison","status":"ok"}');
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][1]).toMatchObject({ response_format: { type: 'json_object' } });
    expect(postMock.mock.calls[1][1]).not.toHaveProperty('response_format');
  });
});
