import { Injectable } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatMessage, ChatResponseDto, StreamChunkDto } from './dto/chat-response.dto';
import { ConversationStoreService } from './conversation-store.service';
import { GroqClientService } from './groq-client.service';

const SYSTEM_PROMPT =
  'You are a helpful travel and local guide assistant. ' +
  'Answer clearly and concisely in Vietnamese. ' +
  'Return plain text only (no Markdown, no bullet points, no code blocks).';

/**
 * Chat service orchestrating conversation history and LLM calls.
 * Ported from Python ChatService.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly store: ConversationStoreService,
    private readonly groqClient: GroqClientService,
  ) {}

  private buildMessages(conversationId: string, userText: string): ChatMessage[] {
    const history = this.store.getHistory(conversationId);
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    messages.push(...history);
    messages.push({ role: 'user', content: userText });
    return messages;
  }

  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    const conversationId = request.conversationId || this.store.createId();
    const messages = this.buildMessages(conversationId, request.text);

    const { content, finishReason, usage } = await this.groqClient.chat(messages);

    // Update history
    this.store.append(conversationId, { role: 'user', content: request.text });
    this.store.append(conversationId, { role: 'assistant', content });

    return {
      answer: content,
      conversationId,
      finishReason,
      usagePromptTokens: usage?.prompt_tokens,
      usageCompletionTokens: usage?.completion_tokens,
      messages: this.store.getHistory(conversationId),
    };
  }

  async *streamChat(request: ChatRequestDto): AsyncGenerator<StreamChunkDto> {
    const conversationId = request.conversationId || this.store.createId();
    const messages = this.buildMessages(conversationId, request.text);

    const assistantParts: string[] = [];

    for await (const { delta, finishReason } of this.groqClient.streamChat(messages)) {
      if (delta) {
        assistantParts.push(delta);
        yield { conversationId, delta };
      }
      if (finishReason) {
        break;
      }
    }

    const fullAnswer = assistantParts.join('');

    // Update history after streaming completes
    this.store.append(conversationId, { role: 'user', content: request.text });
    this.store.append(conversationId, { role: 'assistant', content: fullAnswer });

    yield { conversationId, delta: '', finishReason: 'stop' };
  }
}
