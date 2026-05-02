import { Injectable, Logger } from '@nestjs/common';
import { ITaskRouter, TaskRouteResult } from './task-router.interface';
import { GroqClientService } from '../../groq-client.service';
import { ChatMessage } from '../../dto/chat-response.dto';

const ROUTER_SYSTEM_PROMPT = `
You are the central Task Router for an AI Orchestration Platform.
Your job is to analyze the user's input and route it to the correct workflow.
You MUST output ONLY a valid JSON object. Do not include markdown code blocks (e.g. \`\`\`json) or any explanatory text.

IMPORTANT: The user will speak in Vietnamese. You MUST extract the "query" and "location" parameters in Vietnamese EXACTLY as they are meant or spoken. Do NOT translate "khách sạn" to "hotel" or "Hà Nội" to "Hanoi".

Available Workflows:
1. "SEARCH_PLACES" - User is looking for recommendations, places, hotels, restaurants, or attractions.
2. "GENERAL_CHAT" - User is saying hello, asking general questions not related to finding places.

Output JSON Schema:
{
  "workflowId": "SEARCH_PLACES" | "GENERAL_CHAT",
  "parameters": {
    // If SEARCH_PLACES, try to extract:
    // - "query": the main intent in Vietnamese (e.g. "khách sạn", "quán cà phê", "nhà hàng hải sản")
    // - "location": city or region mentioned in Vietnamese (e.g. "Đà Lạt", "Hồ Chí Minh")
    // - "budget": "low", "mid", "high"
    // - "type": "accommodation", "food", "attraction"
    // If GENERAL_CHAT, leave parameters empty.
  }
}
`;

@Injectable()
export class GroqTaskRouterService implements ITaskRouter {
  private readonly logger = new Logger(GroqTaskRouterService.name);

  constructor(private readonly groqClient: GroqClientService) {}

  async route(userQuery: string, conversationHistory: any[] = []): Promise<TaskRouteResult> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        // Optionally inject recent history for context
        { role: 'user', content: userQuery },
      ];

      // Request strict JSON response from the LLM
      const response = await this.groqClient.chat(messages, {
        response_format: { type: 'json_object' }
      });

      let cleanContent = response.content.trim();
      // Handle potential markdown wrapping just in case
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json/i, '').replace(/```/i, '').trim();
      }

      const result = JSON.parse(cleanContent) as TaskRouteResult;
      this.logger.log(`Routed query to workflow: ${result.workflowId}`);
      
      // Default fallback if parsing fails or returns invalid workflowId
      if (!result.workflowId) {
         return { workflowId: 'GENERAL_CHAT', parameters: {} };
      }
      
      return result;
    } catch (error: any) {
      this.logger.error(`Task Routing Failed: ${error.message}. Falling back to GENERAL_CHAT.`);
      return { workflowId: 'GENERAL_CHAT', parameters: {} };
    }
  }
}
