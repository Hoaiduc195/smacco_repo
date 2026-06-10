import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatMessage } from '../dto/chat-response.dto';
import { ILlmClient } from '../interfaces/llm-client.interface';

@Injectable()
export class FreemodelLlmClientService implements ILlmClient {
  private readonly logger = new Logger(FreemodelLlmClientService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = (this.configService.get<string>('freemodel.baseUrl') || 'https://api.freemodel.dev/v1').replace(/\/$/, '');
    const apiKey = this.configService.get<string>('freemodel.apiKey') || '';
    const timeout = (this.configService.get<number>('freemodel.timeout') || 20) * 1000;

    this.model = this.configService.get<string>('freemodel.model') || 'gpt-4o-mini';
    this.client = new OpenAI({ apiKey, baseURL, timeout });
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

  private extractChatCompletion(response: any) {
    const upstreamError = this.extractErrorMessage(response);
    if (upstreamError) {
      throw new Error(`Freemodel upstream error: ${upstreamError}`);
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
      throw new Error(`Freemodel returned unsupported chat completion response shape: ${this.summarizeResponseShape(response)}`);
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

  async chat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } },
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: this.toOpenAiMessages(messages),
        // FreeModel's OpenAI-compatible endpoint may reject response_format even when
        // the router prompt already asks for JSON, so keep the payload broadly compatible.
        stream: false,
      });

      return this.extractChatCompletion(response);
    } catch (error: any) {
      this.logger.error(`Freemodel chat completion error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *streamChat(
    messages: ChatMessage[],
  ): AsyncGenerator<{ delta: string; finishReason?: string }> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: this.toOpenAiMessages(messages),
        stream: true,
      });

      for await (const chunk of stream) {
        const upstreamError = this.extractErrorMessage(chunk);
        if (upstreamError) {
          throw new Error(`Freemodel upstream stream error: ${upstreamError}`);
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
      this.logger.error(`Freemodel streamChat error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
