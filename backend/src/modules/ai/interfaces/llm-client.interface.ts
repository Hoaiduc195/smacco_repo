import { ChatMessage } from '../dto/chat-response.dto';

export abstract class ILlmClient {
  abstract chat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } }
  ): Promise<{ content: string; finishReason?: string; usage?: Record<string, number> }>;

  abstract streamChat(
    messages: ChatMessage[],
    options?: { response_format?: { type: string } }
  ): AsyncGenerator<{ delta: string; finishReason?: string }>;
}
