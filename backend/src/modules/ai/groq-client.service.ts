import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatMessage } from './dto/chat-response.dto';

/**
 * Thin client for Groq Chat Completions API.
 * Ported from Python GroqClient (httpx → axios).
 */
@Injectable()
export class GroqClientService {
  private readonly logger = new Logger(GroqClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (this.configService.get<string>('groq.baseUrl') || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    this.apiKey = this.configService.get<string>('groq.apiKey') || '';
    this.model = this.configService.get<string>('groq.model') || 'llama-3.1-70b-versatile';
    this.timeout = (this.configService.get<number>('groq.timeout') || 20) * 1000; // seconds → ms
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Non-streaming chat completion.
   * Returns [content, finishReason, usage].
   */
  async chat(
    messages: ChatMessage[],
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }> {
    const payload = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    };

    const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
      headers: this.headers(),
      timeout: this.timeout,
    });

    const data = response.data;
    const content = data.choices[0].message.content;
    const finishReason = data.choices[0].finish_reason;
    const usage = data.usage;

    return { content, finishReason, usage };
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
      // Keep the last potentially incomplete line in the buffer
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

          const delta = choices[0].delta?.content || '';
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
  }
}
