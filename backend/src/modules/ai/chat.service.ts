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

  async extractFiltersUsingAi(text: string): Promise<any> {
    const prompt = `Phân tích câu sau xem người dùng có đang tìm kiếm địa điểm (nhà nghỉ, khách sạn, nhà hàng, quán ăn, điểm tham quan) không.
    Nếu có, trả về định dạng JSON với các trường:
    - "isSearch": true
    - "location": tên địa phương/thành phố (VD: "Đà Nẵng", "Hà Nội")
    - "type": phân loại ("accommodation" cho nhà nghỉ/khách sạn/chỗ ở, "food" cho ăn uống, "attraction" cho điểm tham quan)
    - "budget": mức giá ("cheap" cho rẻ/bình dân, "medium" cho trung bình, "expensive" cho sang trọng/cao cấp)
    - "query": câu tìm kiếm gốc
    Nếu không phải câu tìm kiếm, trả về {"isSearch": false}.
    Chỉ trả về chuỗi JSON hợp lệ, tuyệt đối không giải thích thêm.
    Câu của người dùng: "${text}"`;

    try {
      // Use groqClient directly for a fast extraction call
      const { content } = await this.groqClient.chat([{ role: 'user', content: prompt }]);
      // Llama 3 might wrap JSON in Markdown blocks, so we clean it
      const cleanContent = content.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(cleanContent);
    } catch (err) {
      return { isSearch: false };
    }
  }

  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    const conversationId = request.conversationId || this.store.createId();
    
    // Extract intent
    const intent = await this.extractFiltersUsingAi(request.text);
    const searchAction = intent?.isSearch ? intent : undefined;

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
      searchAction,
    } as any;
  }

  async *streamChat(request: ChatRequestDto): AsyncGenerator<StreamChunkDto> {
    const conversationId = request.conversationId || this.store.createId();
    
    // Extract intent and yield as the very first chunk if applicable
    const intent = await this.extractFiltersUsingAi(request.text);
    if (intent?.isSearch) {
      yield {
        conversationId,
        delta: '',
        searchAction: intent,
      } as any;
    }

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
