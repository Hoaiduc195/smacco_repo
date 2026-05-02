import { Injectable, Logger } from '@nestjs/common';
import { IResponseComposer, ComposerContext, ComposerResult } from './response-composer.interface';
import { GroqClientService } from '../../groq-client.service';
import { ChatMessage } from '../../dto/chat-response.dto';

const COMPOSER_SYSTEM_PROMPT = `
You are a response formatting engine for a chat UI system. Answer in Vietnamese.

Your only job is to generate clean, properly structured GitHub-Flavored Markdown (GFM) that will be rendered by a frontend Markdown parser.

---

## OUTPUT RULES (STRICT)

1. Output MUST be valid Markdown only.
   - No JSON
   - No HTML
   - No metadata or explanations about your process
   - DO NOT write redundant headers like "# Answer", "## Summary", or "## Results". Just provide the natural answer directly.

2. Keep formatting clean, natural, and conversational for a chat UI.

3. Use proper Markdown structure:
   - Bullet lists: -
   - Bold text for highlighting place names, important features, or metrics (**bold**)
   - Only use headings (###) if you have multiple distinct categories to present, but avoid them for general chat.

4. DO NOT include raw backend data structures, coordinates, or system IDs unless explicitly asked.

5. DO NOT hallucinate data not present in the tool results.

---

## RESPONSE STYLE

- Clear and structured but friendly and conversational.
- Short paragraphs.
- Use bullet points when listing places or features.
- Highlight key insights using **bold text**.
- Avoid verbosity.

---

## IF NO RESULTS

Return exactly:
"Xin lỗi, tôi không tìm thấy kết quả nào phù hợp với yêu cầu của bạn lúc này."
`;

@Injectable()
export class GroqResponseComposerService implements IResponseComposer {
  private readonly logger = new Logger(GroqResponseComposerService.name);

  constructor(private readonly groqClient: GroqClientService) {}

  private buildMessages(context: ComposerContext, history: any[] = []): ChatMessage[] {
    const rawDataDump = JSON.stringify(context.toolResults, null, 2);
    
    // To save tokens, we might want to truncate rawDataDump if it's too large,
    // but for MVP, we pass it directly.
    
    const contextPrompt = `
[SYSTEM CONTEXT - TOOL RESULTS]
Workflow Executed: ${context.workflowId}
Extracted Parameters: ${JSON.stringify(context.parameters)}
Raw Data from Tools:
${rawDataDump}
[END SYSTEM CONTEXT]

User Query: "${context.userQuery}"
Based on the tool results above, please answer the user's query.
`;

    return [
      { role: 'system', content: COMPOSER_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: contextPrompt }
    ];
  }

  async compose(context: ComposerContext, conversationHistory: any[] = []): Promise<ComposerResult> {
    try {
      const messages = this.buildMessages(context, conversationHistory);
      const response = await this.groqClient.chat(messages);
      
      return {
        answer: response.content,
      };
    } catch (error: any) {
      this.logger.error(`Composition failed: ${error.message}`);
      return {
        answer: 'Xin lỗi, tôi đã tìm thấy thông tin nhưng hệ thống tổng hợp câu trả lời đang gặp sự cố. Bạn có thể xem kết quả trực tiếp trên giao diện nhé.',
      };
    }
  }

  async *streamCompose(context: ComposerContext, conversationHistory: any[] = []): AsyncGenerator<string> {
    try {
      const messages = this.buildMessages(context, conversationHistory);
      
      for await (const chunk of this.groqClient.streamChat(messages)) {
        if (chunk.delta) {
          yield chunk.delta;
        }
      }
    } catch (error: any) {
      this.logger.error(`Stream composition failed: ${error.message}`);
      yield '\n\n(Lỗi: Không thể kết nối với dịch vụ tạo câu trả lời.)';
    }
  }
}
