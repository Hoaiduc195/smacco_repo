import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ILlmClient } from '../interfaces/llm-client.interface';
import { ChatMessage } from '../dto/chat-response.dto';

@Injectable()
export class GeminiLlmClientService implements ILlmClient {
  private readonly logger = new Logger(GeminiLlmClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (this.configService.get<string>('gemini.baseUrl') || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    this.apiKey = this.configService.get<string>('gemini.apiKey') || '';
    this.model = this.configService.get<string>('gemini.model') || 'gemini-1.5-flash';
    this.timeout = (this.configService.get<number>('gemini.timeout') || 60) * 1000;
  }

  async chat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } },
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }> {
    const basePayload = this.buildPayload(messages, false);
    const payload = this.withGenerationConfig(basePayload, options);

    try {
      const response = await axios.post(this.endpoint('generateContent'), payload, {
        headers: this.headers(),
        timeout: this.timeout,
      }).catch((requestError: any) => {
        if (!options?.response_format) throw requestError;

        this.logger.warn(`Gemini rejected response_format; retrying without responseMimeType. ${this.formatRequestError(requestError)}`);
        return axios.post(this.endpoint('generateContent'), basePayload, {
          headers: this.headers(),
          timeout: this.timeout,
        });
      });

      return this.extractCompletion(response.data);
    } catch (error: any) {
      const normalizedError = this.normalizeRequestError(error);
      this.logger.error(`Gemini chat completion error: ${normalizedError.message}`, normalizedError.stack);
      throw normalizedError;
    }
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } },
  ): AsyncGenerator<{ delta: string; finishReason?: string }> {
    const payload = this.withGenerationConfig(this.buildPayload(messages, true), options);

    try {
      const response = await axios.post(this.endpoint('streamGenerateContent', { alt: 'sse' }), payload, {
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
          const raw = this.parseSseLine(line);
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);
            const extracted = this.extractStreamChunk(parsed);
            if (extracted.delta || extracted.finishReason) {
              yield extracted;
            }
          } catch {
            continue;
          }
        }
      }

      const raw = this.parseSseLine(buffer);
      if (raw) {
        try {
          const extracted = this.extractStreamChunk(JSON.parse(raw));
          if (extracted.delta || extracted.finishReason) {
            yield extracted;
          }
        } catch {
          // Ignore trailing partial SSE data.
        }
      }
    } catch (error: any) {
      const normalizedError = this.normalizeRequestError(error);
      this.logger.error(`Gemini streamChat error: ${normalizedError.message}`, normalizedError.stack);
      throw normalizedError;
    }
  }

  private buildPayload(messages: ChatMessage[], stream: boolean) {
    const systemText = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .filter(Boolean)
      .join('\n\n');

    const contents = messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(message.content || '') }],
      }))
      .filter((message) => message.parts[0].text.trim().length > 0);

    const payload: any = {
      contents: contents.length ? contents : [{ role: 'user', parts: [{ text: '' }] }],
    };

    if (systemText.trim()) {
      payload.systemInstruction = {
        parts: [{ text: systemText }],
      };
    }

    if (stream) {
      payload.safetySettings = [];
    }

    return payload;
  }

  private withGenerationConfig(payload: any, options?: { response_format?: { type: string } }) {
    if (!options?.response_format) return payload;

    return {
      ...payload,
      generationConfig: {
        ...(payload.generationConfig || {}),
        responseMimeType: 'application/json',
      },
    };
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
    };
  }

  private endpoint(action: 'generateContent' | 'streamGenerateContent', query: Record<string, string> = {}) {
    const modelName = this.model.replace(/^models\//, '');
    const params = new URLSearchParams({ key: this.apiKey, ...query });
    return `${this.baseUrl}/models/${encodeURIComponent(modelName)}:${action}?${params.toString()}`;
  }

  private extractCompletion(data: any) {
    const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : undefined;
    const content = this.extractPartsText(candidate?.content?.parts || data?.parts || []);

    if (!content) {
      throw new Error(`Gemini returned empty/unsupported completion response shape: ${this.summarizeResponseShape(data)}`);
    }

    return {
      content,
      finishReason: this.normalizeFinishReason(candidate?.finishReason || data?.finishReason),
      usage: this.normalizeUsage(data?.usageMetadata || data?.usage),
    };
  }

  private extractStreamChunk(data: any): { delta: string; finishReason?: string } {
    const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : undefined;
    return {
      delta: this.extractPartsText(candidate?.content?.parts || data?.parts || []),
      finishReason: this.normalizeFinishReason(candidate?.finishReason || data?.finishReason),
    };
  }

  private extractPartsText(parts: any[]): string {
    if (!Array.isArray(parts)) return '';

    return parts
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  private normalizeFinishReason(value: any): string | undefined {
    if (!value) return undefined;
    const normalized = String(value).toUpperCase();
    if (normalized === 'STOP') return 'stop';
    if (normalized === 'MAX_TOKENS') return 'length';
    if (normalized === 'SAFETY' || normalized === 'RECITATION' || normalized === 'BLOCKLIST' || normalized === 'PROHIBITED_CONTENT') return 'content_filter';
    return String(value).toLowerCase();
  }

  private normalizeUsage(usage: any): Record<string, number> | undefined {
    if (!usage || typeof usage !== 'object') return undefined;

    return {
      prompt_tokens: usage.promptTokenCount,
      completion_tokens: usage.candidatesTokenCount,
      total_tokens: usage.totalTokenCount,
    };
  }

  private parseSseLine(line: string): string | undefined {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return undefined;
    if (trimmed === '[DONE]') return undefined;
    if (trimmed.startsWith('data:')) return trimmed.slice(5).trim();
    return trimmed;
  }

  private summarizeResponseShape(response: any): string {
    if (!response || typeof response !== 'object') return typeof response;
    const keys = Object.keys(response).slice(0, 8).join(', ') || 'empty object';
    const candidate = Array.isArray(response.candidates) ? response.candidates[0] : undefined;
    const candidateKeys = candidate && typeof candidate === 'object'
      ? `; candidate: ${Object.keys(candidate).slice(0, 8).join(', ')}`
      : '';
    return `${keys}${candidateKeys}`;
  }

  private normalizeRequestError(error: any): Error {
    const message = this.formatRequestError(error);
    if (message === error?.message) return error;

    const normalized = new Error(message);
    normalized.stack = error?.stack;
    return normalized;
  }

  private formatRequestError(error: any): string {
    const status = error?.response?.status;
    const retryAfter = error?.response?.headers?.['retry-after'];
    const providerMessage = this.extractProviderErrorMessage(error?.response?.data);
    const details = [
      status ? `HTTP ${status}` : undefined,
      providerMessage,
      retryAfter ? `retry-after=${retryAfter}s` : undefined,
    ].filter(Boolean);

    if (details.length) {
      return `Gemini API request failed (${details.join('; ')})`;
    }

    return error?.message || 'Gemini API request failed';
  }

  private extractProviderErrorMessage(data: any): string | undefined {
    if (!data) return undefined;
    if (typeof data === 'string') return data.slice(0, 500);

    const error = data.error || data.errors?.[0];
    if (!error) return JSON.stringify(data).slice(0, 500);
    if (typeof error === 'string') return error.slice(0, 500);

    const message = typeof error.message === 'string' ? error.message : undefined;
    const status = typeof error.status === 'string' ? error.status : undefined;
    const reason = Array.isArray(error.details)
      ? error.details
        .map((detail: any) => detail?.reason || detail?.metadata?.quota_metric || detail?.['@type'])
        .filter(Boolean)
        .slice(0, 3)
        .join(', ')
      : undefined;

    return [status, message, reason ? `details=${reason}` : undefined].filter(Boolean).join(': ').slice(0, 500);
  }
}
