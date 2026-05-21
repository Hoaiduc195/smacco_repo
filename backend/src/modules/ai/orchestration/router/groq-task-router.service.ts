import { Injectable, Logger } from '@nestjs/common';
import { ITaskRouter, TaskRouteResult } from './task-router.interface';
import { GroqClientService } from '../../groq-client.service';
import { ChatMessage } from '../../dto/chat-response.dto';

const ROUTER_SYSTEM_PROMPT = `
You are the central Task Router for an AI Accommodation Platform.

Your job is to analyze the user's input and route it to the correct workflow.

You MUST output ONLY a valid JSON object.
Do not include markdown.
Do not include explanations.

IMPORTANT:
The user speaks Vietnamese.
Extract all parameters in Vietnamese exactly as written.
Do not translate locations or accommodation types.

Available Workflows:
1. "SEARCH_PLACES"
   - User wants to find:
     - khách sạn
     - nhà nghỉ (must map to "hostel" in type/types)
     - căn hộ (must map to "apartment" in type/types)
     - nhà khách (must map to "guesthouse" in type/types)
     - motel
     - camping
     - resort
     - homestay
     - villa
     - nơi lưu trú
     - chỗ ở

2. "GENERAL_CHAT"
   - Greetings or unrelated questions.

Output Schema:
{
  "workflowId": "SEARCH_PLACES" | "GENERAL_CHAT",
  "parameters": {
    "query": "string", // Keep the user's specific search terms intact (e.g., "nhà nghỉ gần đà nẵng", "khách sạn gần sân bay Nội Bài") instead of simplifying it to just the category word.
    "location": "string",
    "locations": ["string"],
    "anchor": "string",
    "budget": "low" | "mid" | "high",
    "type": "hotel" | "hostel" | "homestay" | "apartment" | "resort" | "villa" | "guesthouse" | "motel" | "camping",
    "types": ["hotel", "hostel", "homestay", "apartment", "resort", "villa", "guesthouse", "motel", "camping"]
  }
}

Available Options (use these canonical values where applicable):
- Types: "hotel", "hostel", "homestay", "apartment", "resort", "villa", "guesthouse", "motel", "camping"
- Budget levels: "low", "mid", "high" (map Vietnamese phrases to these canonical values)

Rules:
- If no location is mentioned, omit "location".
- Do not invent missing information.
- If multiple types of accommodations are mentioned:
  - put them into "types" (array)
  - also create a comma-separated "type" (string) for backward compatibility
- If user mentions:
  - "rẻ", "bình dân", "giá sinh viên" => "low"
  - "tầm trung", "ổn", "vừa phải" => "mid"
  - "sang", "cao cấp", "luxury", "5 sao" => "high"
- If user says:
  - "gần"
  - "near"
  - "xung quanh"
  then extract nearby place into "anchor".
- Crucial:
  - Map "nhà nghỉ" to "hostel"
  - Map "nhà khách" to "guesthouse"

Examples:

User:
nhà nghỉ gần đà nẵng

Output:
{
  "workflowId": "SEARCH_PLACES",
  "parameters": {
    "query": "nhà nghỉ gần đà nẵng",
    "location": "Đà Nẵng",
    "type": "hostel",
    "types": ["hostel"]
  }
}

User:
khách sạn gần sân bay Nội Bài giá rẻ

Output:
{
  "workflowId": "SEARCH_PLACES",
  "parameters": {
    "query": "khách sạn gần sân bay Nội Bài",
    "anchor": "sân bay Nội Bài",
    "budget": "low",
    "type": "hotel",
    "types": ["hotel"]
  }
}

User:
resort hoặc villa ở Đà Lạt

Output:
{
  "workflowId": "SEARCH_PLACES",
  "parameters": {
    "query": "resort hoặc villa ở Đà Lạt",
    "location": "Đà Lạt",
    "type": "resort, villa",
    "types": ["resort", "villa"]
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
      
      // Normalize location fields: support both single string and array of locations
      try {
        const params = result.parameters || {};
        // If LLM returned 'locations' array, make a comma-joined 'location' string for compatibility
        if (Array.isArray(params.locations) && params.locations.length > 0) {
          params.location = params.locations.join(', ');
        }

        // If only 'location' exists but contains commas or ' và ' (and), split into locations
        if (!params.locations && typeof params.location === 'string' && /[,|\bvà\b]/i.test(params.location)) {
          const parts = params.location.split(/,|\bvà\b|and/i).map((p: string) => p.trim()).filter(Boolean);
          if (parts.length > 1) params.locations = parts;
        }

        // Normalize types: support both 'types' array and 'type' string
        if (Array.isArray(params.types) && params.types.length > 0) {
          // ensure backwards-compatible 'type' string
          params.type = params.types.join(', ');
        }

        if (!params.types && typeof params.type === 'string' && /,|\bhoặc\b|\bor\b/i.test(params.type)) {
          const parts = params.type.split(/,|\bhoặc\b|\bor\b|\band\b/i).map((p: string) => p.trim()).filter(Boolean);
          if (parts.length > 1) params.types = parts;
        }

        result.parameters = params;
      } catch (e) {
        this.logger.warn('Failed to normalize location parameters');
      }

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
