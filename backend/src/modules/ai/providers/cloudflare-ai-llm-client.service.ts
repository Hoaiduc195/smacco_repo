import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ILlmClient } from '../interfaces/llm-client.interface';
import { ChatMessage } from '../dto/chat-response.dto';

/**
 * Concrete LLM client for Cloudflare Workers AI Chat Completions API.
 * Uses Cloudflare's OpenAI-compatible endpoint.
 */
@Injectable()
export class CloudflareAiLlmClientService implements ILlmClient {
  private readonly logger = new Logger(CloudflareAiLlmClientService.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('cloudflareAi.accountId') || '';
    const useProxy = this.configService.get<boolean>('cloudflareAi.useProxy') === true;
    const proxyBaseUrl = this.configService.get<string>('cloudflareAi.proxyBaseUrl') || '';
    const rawBaseUrl = useProxy && proxyBaseUrl
      ? proxyBaseUrl
      : (this.configService.get<string>('cloudflareAi.baseUrl') || 'https://api.cloudflare.com/client/v4/accounts');
    
    if (rawBaseUrl.includes('api.cloudflare.com')) {
      this.baseUrl = `${rawBaseUrl.replace(/\/$/, '')}/${accountId}/ai/v1`;
    } else {
      this.baseUrl = rawBaseUrl.replace(/\/$/, '');
    }
    this.apiToken = this.configService.get<string>('cloudflareAi.apiToken') || '';
    this.model = this.configService.get<string>('cloudflareAi.model') || '@cf/meta/llama-3.1-8b-instruct';
    this.timeout = (this.configService.get<number>('cloudflareAi.timeout') || 20) * 1000;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private extractTextContent(content: unknown): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && typeof (part as any).text === 'string') {
            return (part as any).text;
          }
          return '';
        })
        .join('');
    }
    if (content && typeof content === 'object' && typeof (content as any).text === 'string') {
      return (content as any).text;
    }
    return '';
  }

  private summarizeResponseShape(response: any): string {
    if (!response || typeof response !== 'object') return typeof response;
    const keys = Object.keys(response).slice(0, 8).join(', ') || 'empty object';
    const choice = Array.isArray(response.choices) ? response.choices[0] : undefined;
    const choiceKeys = choice && typeof choice === 'object'
      ? `; choice: ${Object.keys(choice).slice(0, 8).join(', ')}`
      : '';
    const messageKeys = choice?.message && typeof choice.message === 'object'
      ? `; message: ${Object.keys(choice.message).slice(0, 8).join(', ')}`
      : '';
    const resultKeys = response.result && typeof response.result === 'object'
      ? `; result: ${Object.keys(response.result).slice(0, 8).join(', ')}`
      : '';
    return `${keys}${choiceKeys}${messageKeys}${resultKeys}`;
  }

  private extractErrorMessage(response: any): string | undefined {
    const error = response?.error || response?.errors?.[0];
    if (!error) return undefined;
    if (typeof error === 'string') return error;
    if (typeof error.message === 'string') return error.message;
    return JSON.stringify(error).slice(0, 500);
  }

  private extractChatCompletion(data: any) {
    const upstreamError = this.extractErrorMessage(data);
    if (upstreamError) {
      throw new Error(`Cloudflare AI upstream error: ${upstreamError}`);
    }

    const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
    const content = this.extractTextContent(
      choice?.message?.content
        ?? choice?.message?.response
        ?? choice?.message?.text
        ?? choice?.text
        ?? choice?.content
        ?? choice?.response
        ?? data?.message?.content
        ?? data?.message?.response
        ?? data?.message?.text
        ?? data?.content
        ?? data?.output_text
        ?? data?.text
        ?? data?.answer
        ?? data?.response
        ?? data?.result?.response
        ?? data?.result?.content
        ?? data?.result?.text,
    );

    if (!content) {
      throw new Error(`Cloudflare AI returned empty/unsupported chat completion response shape: ${this.summarizeResponseShape(data)}`);
    }

    return {
      content,
      finishReason: choice?.finish_reason || choice?.finishReason || data?.finish_reason || data?.finishReason || undefined,
      usage: data?.usage,
    };
  }

  /**
   * Non-streaming chat completion.
   * Returns [content, finishReason, usage].
   */
  async chat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } }
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }> {
    const basePayload: any = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    };

    try {
      const payload = {
        ...basePayload,
        ...(options?.response_format ? { response_format: options.response_format } : {}),
      };
      const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
        headers: this.headers(),
        timeout: this.timeout,
      }).catch(async (requestError: any) => {
        if (!options?.response_format) throw requestError;

        this.logger.warn(`Cloudflare AI rejected response_format; retrying without response_format. ${requestError.message}`);
        return axios.post(`${this.baseUrl}/chat/completions`, basePayload, {
          headers: this.headers(),
          timeout: this.timeout,
        });
      });

      try {
        return this.extractChatCompletion(response.data);
      } catch (extractError: any) {
        if (!options?.response_format) throw extractError;

        this.logger.warn(`Cloudflare AI returned no usable content with response_format; retrying without response_format. ${extractError.message}`);
        const retryResponse = await axios.post(`${this.baseUrl}/chat/completions`, basePayload, {
          headers: this.headers(),
          timeout: this.timeout,
        });
        return this.extractChatCompletion(retryResponse.data);
      }
    } catch (error: any) {
      this.logger.error(`Cloudflare AI chat completion error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Streaming chat completion.
   * Yields [delta, finishReason] tuples via async generator.
   */
  async *streamChat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } }
  ): AsyncGenerator<{ delta: string; finishReason?: string }> {
    const payload: any = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    };

    if (options?.response_format) {
      payload.response_format = options.response_format;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
        headers: this.headers(),
        timeout: this.timeout,
        responseType: 'stream',
      });

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let raw: string;
          if (trimmed.startsWith('data: ')) {
            raw = trimmed.slice(6).trim();
          } else {
            raw = trimmed;
          }

          if (raw === '[DONE]') return;

          try {
            const parsed = JSON.parse(raw);
            const choices = parsed.choices || [];
            if (!choices.length) continue;

            const delta = this.extractTextContent(choices[0].delta?.content);
            const finishReason = choices[0].finish_reason;

            if (delta || finishReason) {
              yield { delta, finishReason };
            }
          } catch {
            // Skip unparseable lines
            continue;
          }
        }
      }
    } catch (error: any) {
      this.logger.error(`Cloudflare AI streamChat error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
