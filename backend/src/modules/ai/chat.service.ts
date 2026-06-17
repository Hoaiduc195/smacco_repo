import { Injectable } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatMessage, ChatResponseDto, StreamChunkDto } from './dto/chat-response.dto';
import { ConversationStoreService } from './conversation-store.service';
import { ILlmClient } from './interfaces/llm-client.interface';

const SYSTEM_PROMPT =
  'You are a Vietnamese travel assistant speaking directly with the user. ' +
  'Answer in natural Vietnamese, using "mình" and "bạn" as conversational pronouns. ' +
  'Turn available information into useful judgment instead of repeating raw facts. ' +
  'Do not mention systems, context, internal data, or technical mechanics. ' +
  'If evidence is weak, say naturally that you cannot conclude confidently yet or that you have not seen enough real reviews. ' +
  'Return plain text only (no Markdown, no bullet points, no code blocks).';

export interface PlaceQuestionContext {
  source?: string | null;
  categories?: string[];
  averageRating?: number | null;
  reviewCount?: number | null;
  description?: string | null;
  amenities?: string[];
  contact?: {
    phone?: string | null;
    email?: string | null;
    website?: string | null;
  };
  rooms?: number | null;
  reviewSnippets?: Array<{
    source?: string | null;
    rating?: number | null;
    author?: string | null;
    text: string;
  }>;
}

/**
 * Chat service orchestrating conversation history and LLM calls.
 * Ported from Python ChatService.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly store: ConversationStoreService,
    private readonly llmClient: ILlmClient,
  ) {}

  async answerPlaceQuestion(params: {
    placeName: string;
    placeAddress?: string | null;
    questionText: string;
    placeContext?: PlaceQuestionContext;
  }): Promise<string> {
    const systemPrompt =
      'You are a Vietnamese travel advisor answering a place question inside a community thread. ' +
      'Answer in Vietnamese, keep it short and human, and separate evidence-backed facts from uncertainty. ' +
      'Use only the provided place facts and review evidence. Do not invent facts when evidence is weak. ' +
      'If you cannot conclude confidently, say so naturally and suggest asking people who are currently there.';

    const userPrompt = [
      `Place: ${params.placeName}`,
      params.placeAddress ? `Address: ${params.placeAddress}` : null,
      this.formatPlaceQuestionContext(params.placeContext),
      `Question: ${params.questionText}`,
      'Requirement: answer like a pinned advisory reply at the top of the thread. Avoid complex Markdown. Mention uncertainty when the supplied context does not directly answer the question.',
    ]
      .filter(Boolean)
      .join('\n');

    const { content } = await this.llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return content.trim();
  }

  private formatPlaceQuestionContext(context?: PlaceQuestionContext): string | null {
    if (!context) return null;

    const lines: string[] = [];
    if (context.source) lines.push(`Source: ${context.source}`);
    if (context.categories?.length) lines.push(`Categories: ${context.categories.join(', ')}`);
    if (typeof context.averageRating === 'number') {
      const reviewCount = typeof context.reviewCount === 'number' ? ` from ${context.reviewCount} reviews` : '';
      lines.push(`Rating summary: ${context.averageRating.toFixed(1)}/5${reviewCount}`);
    } else if (typeof context.reviewCount === 'number' && context.reviewCount > 0) {
      lines.push(`Review count: ${context.reviewCount}`);
    }
    if (context.description) lines.push(`Description: ${context.description}`);
    if (context.amenities?.length) lines.push(`Amenities: ${context.amenities.join(', ')}`);
    if (typeof context.rooms === 'number') lines.push(`Rooms: ${context.rooms}`);

    const contactParts = [
      context.contact?.phone ? `phone ${context.contact.phone}` : null,
      context.contact?.email ? `email ${context.contact.email}` : null,
      context.contact?.website ? `website ${context.contact.website}` : null,
    ].filter(Boolean);
    if (contactParts.length) lines.push(`Contact: ${contactParts.join('; ')}`);

    const snippets = (context.reviewSnippets || []).filter((review) => review.text).slice(0, 5);
    if (snippets.length) {
      lines.push('Review evidence:');
      for (const review of snippets) {
        const rating = typeof review.rating === 'number' ? `${review.rating}/5` : 'no rating';
        const author = review.author ? ` by ${review.author}` : '';
        const source = review.source ? ` (${review.source})` : '';
        lines.push(`- ${rating}${author}${source}: ${review.text}`);
      }
    }

    return lines.length ? `Place context:\n${lines.join('\n')}` : null;
  }

  private async buildMessages(conversationId: string, userText: string): Promise<ChatMessage[]> {
    const history = await this.store.getHistory(conversationId);
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    messages.push(...history);
    messages.push({ role: 'user', content: userText });
    return messages;
  }

  async extractFiltersUsingAi(text: string): Promise<any> {
    const prompt = `Analyze whether the user is searching for a place such as accommodation, food, or an attraction.
    If yes, return valid JSON with:
    - "isSearch": true
    - "location": the city/locality name exactly as written, for example "Da Nang" or "Ha Noi"
    - "type": one of "accommodation", "food", or "attraction"
    - "budget": "low" for cheap/budget, "mid" for midrange, "high" for luxury/premium
    - "query": the original user search text
    If the message is not a search request, return {"isSearch": false}.
    Return only valid JSON. Do not explain.
    User message: "${text}"`;

    try {
      // Use llmClient directly for a fast extraction call
      const { content } = await this.llmClient.chat([{ role: 'user', content: prompt }]);
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

    const messages = await this.buildMessages(conversationId, request.text);

    const { content, finishReason, usage } = await this.llmClient.chat(messages);

    // Update history
    await this.store.append(conversationId, { role: 'user', content: request.text });
    await this.store.append(conversationId, { role: 'assistant', content });

    return {
      answer: content,
      conversationId,
      finishReason,
      usagePromptTokens: usage?.prompt_tokens,
      usageCompletionTokens: usage?.completion_tokens,
      messages: await this.store.getHistory(conversationId),
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

    const messages = await this.buildMessages(conversationId, request.text);

    const assistantParts: string[] = [];

    for await (const { delta, finishReason } of this.llmClient.streamChat(messages)) {
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
    await this.store.append(conversationId, { role: 'user', content: request.text });
    await this.store.append(conversationId, { role: 'assistant', content: fullAnswer });

    yield { conversationId, delta: '', finishReason: 'stop' };
  }
}
