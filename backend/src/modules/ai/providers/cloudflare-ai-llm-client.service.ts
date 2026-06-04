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
    const rawBaseUrl = this.configService.get<string>('cloudflareAi.baseUrl') || 'https://api.cloudflare.com/client/v4/accounts';
    
    // Construct standard OpenAI-compatible base URL for Cloudflare Workers AI
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

  /**
   * Non-streaming chat completion.
   * Returns [content, finishReason, usage].
   */
  async chat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } }
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }> {
    const payload: any = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    };

    if (options?.response_format) {
      payload.response_format = options.response_format;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
        headers: this.headers(),
        timeout: this.timeout,
      });

      const data = response.data;
      const content = this.extractTextContent(data?.choices?.[0]?.message?.content);
      const finishReason = data.choices[0].finish_reason;
      const usage = data.usage;

      return { content, finishReason, usage };
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
  ): AsyncGenerator<{ delta: string; finishReason?: string }> {
    const payload = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    };

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
