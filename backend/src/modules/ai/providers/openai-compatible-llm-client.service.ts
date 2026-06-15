import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatMessage } from '../dto/chat-response.dto';
import { ILlmClient } from '../interfaces/llm-client.interface';

@Injectable()
export class OpenAiCompatibleLlmClientService implements ILlmClient {
  private readonly logger = new Logger(OpenAiCompatibleLlmClientService.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly baseURL: string;
  private readonly apiKeyConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.baseURL = (this.configService.get<string>('openaiCompatible.baseUrl') || 'https://api.freemodel.dev/v1').replace(/\/$/, '');
    const apiKey = this.configService.get<string>('openaiCompatible.apiKey') || '';
    const timeout = (this.configService.get<number>('openaiCompatible.timeout') || 20) * 1000;
    this.apiKeyConfigured = apiKey.trim().length > 0;

    this.model = this.configService.get<string>('openaiCompatible.model') || 'gpt-4o-mini';
    this.client = new OpenAI({ apiKey: apiKey || 'missing-openai-compatible-api-key', baseURL: this.baseURL, timeout });
  }

  private assertConfigured() {
    if (!this.apiKeyConfigured) {
      throw new Error('OpenAI-compatible API key is not configured. Set OPENAI_COMPATIBLE_API_KEY or switch AI_PROVIDER.');
    }
  }

  private toOpenAiMessages(messages: ChatMessage[]) {
    return messages.map((message) => ({ role: message.role, content: message.content }));
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
    return Object.keys(response).slice(0, 8).join(', ') || 'empty object';
  }

  private extractErrorMessage(response: any): string | undefined {
    const error = response?.error;
    if (!error) return undefined;
    if (typeof error === 'string') return error;
    if (typeof error.message === 'string') return error.message;
    return JSON.stringify(error).slice(0, 500);
  }

  private normalizeRequestError(error: any): Error {
    const normalized = new Error(this.formatRequestError(error));
    normalized.stack = error?.stack;
    return normalized;
  }

  private formatRequestError(error: any): string {
    const parts: string[] = [];
    const status = error?.status || error?.response?.status;
    if (status) parts.push(`HTTP ${status}`);

    const providerError = error?.error || error?.response?.data?.error || error?.body?.error || error?.body;
    const providerMessage = this.extractProviderErrorMessage(providerError) || this.cleanSdkErrorMessage(error?.message);
    if (providerMessage) parts.push(providerMessage);

    const retryAfter = this.getHeader(error, 'retry-after');
    if (retryAfter) parts.push(`retry-after=${retryAfter}`);

    const requestId = error?.request_id || this.getHeader(error, 'x-request-id') || this.getHeader(error, 'cf-ray');
    if (requestId) parts.push(`request-id=${requestId}`);

    parts.push(`model=${this.model}`);
    parts.push(`baseURL=${this.baseURL}`);

    return `OpenAI-compatible API request failed (${parts.join('; ')})`;
  }

  private extractProviderErrorMessage(error: any): string | undefined {
    if (!error) return undefined;
    if (typeof error === 'string') return error;

    const message = typeof error.message === 'string' ? error.message : undefined;
    const status = typeof error.status === 'string' ? error.status : undefined;
    const type = typeof error.type === 'string' ? error.type : undefined;
    const code = typeof error.code === 'string' ? error.code : undefined;
    const param = typeof error.param === 'string' ? error.param : undefined;
    const prefix = status || type;
    const details = [
      code ? `code=${code}` : '',
      param ? `param=${param}` : '',
    ].filter(Boolean);

    if (!message && !prefix && !details.length) {
      return JSON.stringify(error).slice(0, 500);
    }

    return [
      prefix && message ? `${prefix}: ${message}` : (message || prefix || ''),
      ...details,
    ].filter(Boolean).join('; ');
  }

  private cleanSdkErrorMessage(message: any): string | undefined {
    if (typeof message !== 'string' || !message.trim()) return undefined;
    return message.replace(/^\d{3}\s+/, '').trim();
  }

  private getHeader(error: any, name: string): string | undefined {
    const headers = error?.headers || error?.response?.headers;
    if (!headers) return undefined;
    if (typeof headers.get === 'function') return headers.get(name) || headers.get(name.toLowerCase()) || undefined;

    const lowerName = name.toLowerCase();
    const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lowerName);
    const value = entry?.[1];
    return Array.isArray(value) ? String(value[0]) : (value != null ? String(value) : undefined);
  }

  private extractChatCompletion(response: any) {
    const upstreamError = this.extractErrorMessage(response);
    if (upstreamError) {
      throw new Error(`OpenAI-compatible upstream error: ${upstreamError}`);
    }

    const choice = Array.isArray(response?.choices) ? response.choices[0] : undefined;
    const content = this.extractTextContent(
      choice?.message?.content
        ?? choice?.text
        ?? response?.message?.content
        ?? response?.content
        ?? response?.output_text
        ?? response?.text
        ?? response?.answer
        ?? response?.result?.content
        ?? response?.result?.text,
    );

    if (!content) {
      throw new Error(`OpenAI-compatible API returned unsupported chat completion response shape: ${this.summarizeResponseShape(response)}`);
    }

    return {
      content,
      finishReason: choice?.finish_reason || choice?.finishReason || response?.finish_reason || response?.finishReason || undefined,
      usage: response?.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  private createChatCompletionPayload(messages: ChatMessage[], stream: boolean) {
    return {
      model: this.model,
      messages: this.toOpenAiMessages(messages),
      // Qwen-compatible proxies use this provider-specific field to skip
      // reasoning output and respond directly.
      enable_thinking: false,
      chat_template_kwargs: {
        enable_thinking: false,
      },
      stream,
    };
  }

  async chat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } },
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }> {
    this.assertConfigured();

    try {
      const response = await this.client.chat.completions.create(
        this.createChatCompletionPayload(messages, false) as any,
      );

      return this.extractChatCompletion(response);
    } catch (error: any) {
      const normalizedError = this.normalizeRequestError(error);
      this.logger.error(`OpenAI-compatible chat completion error: ${normalizedError.message}`, normalizedError.stack);
      throw normalizedError;
    }
  }

  async *streamChat(
    messages: ChatMessage[],
    _options?: { response_format?: { type: string } },
  ): AsyncGenerator<{ delta: string; finishReason?: string }> {
    this.assertConfigured();

    try {
      const stream = await this.client.chat.completions.create(
        this.createChatCompletionPayload(messages, true) as any,
      ) as any;

      for await (const chunk of stream) {
        const upstreamError = this.extractErrorMessage(chunk);
        if (upstreamError) {
          throw new Error(`OpenAI-compatible upstream stream error: ${upstreamError}`);
        }

        const choice = Array.isArray((chunk as any)?.choices) ? (chunk as any).choices[0] : undefined;
        const delta = this.extractTextContent(
          choice?.delta?.content
            ?? choice?.message?.content
            ?? choice?.text
            ?? (chunk as any)?.delta
            ?? (chunk as any)?.content
            ?? (chunk as any)?.text,
        );
        const finishReason = choice?.finish_reason || choice?.finishReason || (chunk as any)?.finish_reason || undefined;

        if (delta || finishReason) {
          yield { delta, finishReason };
        }
      }
    } catch (error: any) {
      const normalizedError = this.normalizeRequestError(error);
      this.logger.error(`OpenAI-compatible streamChat error: ${normalizedError.message}`, normalizedError.stack);
      throw normalizedError;
    }
  }
}
