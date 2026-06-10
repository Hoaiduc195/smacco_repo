import { Injectable, Logger } from '@nestjs/common';
import { ITaskRouter, TaskRouteResult } from '../../interfaces/task-router.interface';
import { ILlmClient } from '../../interfaces/llm-client.interface';
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

3. "COMPARE_PLACES"
   - User wants to compare two or more accommodations side by side.
   - Keywords: "so sánh", "compare", "cái nào tốt hơn", "nên chọn cái nào", "khác nhau", "versus", "vs"
   - The user usually has tagged/selected places and asks to compare.

4. "ANALYZE_PLACE"
   - User wants in-depth analysis/evaluation of a specific tagged place.
   - Keywords: "insight", "phân tích", "đánh giá", "review", "ưu nhược điểm", "điểm mạnh", "điểm yếu", "thế nào", "tốt không", "có nên", "hợp với tôi không", "xung quanh có gì", "đi lúc nào", "di chuyển bao lâu"
   - If user mentions preferences/priorities (giá, vị trí, yên tĩnh, tiện nghi...), extract into "preferences" array.

Output Schema:
{
  "workflowId": "SEARCH_PLACES" | "GENERAL_CHAT" | "COMPARE_PLACES" | "ANALYZE_PLACE",
  "parameters": {
    "query": "string", // Keep the user's specific search terms intact (e.g., "nhà nghỉ gần đà nẵng", "khách sạn gần sân bay Nội Bài") instead of simplifying it to just the category word.
    "location": "string",
    "locations": ["string"],
    "anchor": "string",
    "budget": "low" | "mid" | "high",
    "type": "hotel" | "hostel" | "homestay" | "apartment" | "resort" | "villa" | "guesthouse" | "motel" | "camping",
    "types": ["hotel", "hostel", "homestay", "apartment", "resort", "villa", "guesthouse", "motel", "camping"],
    "placeNames": ["string"],
    "criteria": "string",
    "placeName": "string",
    "preferences": ["string"]
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
- If the model returns incomplete or inconsistent fields, prefer preserving the original user intent and normalize the values deterministically before execution.
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
- For COMPARE_PLACES:
  - Route here when user explicitly compares or asks which is better between places.
  - If no specific place names are in the text, leave "placeNames" as empty array (the system uses tagged places from the UI).
  - If user mentions a comparison aspect (giá, vị trí, đánh giá), set "criteria" to: "price", "rating", "location", "amenities", or "overall".
- For ANALYZE_PLACE:
  - Route here when user wants analysis, review, or evaluation of a place.
  - If the previous assistant message asked about user preferences for analyzing a place, and the user responds with preference keywords (giá, vị trí, sạch sẽ, yên tĩnh, tiện nghi, hồ bơi, view, gần biển...), route to "ANALYZE_PLACE" with those preferences extracted.
  - If the user includes preferences in the same message as the analysis request, extract them directly.

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

User:
so sánh hai khách sạn này giúp tôi

Output:
{
  "workflowId": "COMPARE_PLACES",
  "parameters": {
    "placeNames": [],
    "criteria": "overall"
  }
}

User:
cái nào rẻ hơn?

Output:
{
  "workflowId": "COMPARE_PLACES",
  "parameters": {
    "placeNames": [],
    "criteria": "price"
  }
}

User:
phân tích chỗ này giúp tôi

Output:
{
  "workflowId": "ANALYZE_PLACE",
  "parameters": {
    "placeName": "",
    "preferences": []
  }
}

User:
tôi quan tâm giá cả và vị trí

Output:
{
  "workflowId": "ANALYZE_PLACE",
  "parameters": {
    "placeName": "",
    "preferences": ["giá cả", "vị trí"]
  }
}

User:
khách sạn này tốt không? tôi cần chỗ yên tĩnh gần biển

Output:
{
  "workflowId": "ANALYZE_PLACE",
  "parameters": {
    "placeName": "",
    "preferences": ["yên tĩnh", "gần biển"]
  }
}
`;

@Injectable()
export class LlmTaskRouterService implements ITaskRouter {
  private readonly logger = new Logger(LlmTaskRouterService.name);

  constructor(private readonly llmClient: ILlmClient) {}

  async route(userQuery: string, conversationHistory: any[] = []): Promise<TaskRouteResult> {
    let cleanContent = '';
    try {
      const recentHistory = this.formatRecentHistory(conversationHistory);
      const messages: ChatMessage[] = [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        ...recentHistory,
        {
          role: 'system',
          content: 'Use the recent conversation to resolve follow-up references, omitted details, pronouns, phrases like "cái thứ 2", and multi-turn intent continuations (e.g., user responding with preferences after being asked by the assistant). The current user message remains the primary routing input.',
        },
        { role: 'user', content: userQuery },
      ];

      // Request strict JSON response from the LLM
      const response = await this.llmClient.chat(messages, {
        response_format: { type: 'json_object' }
      });

      cleanContent = typeof response.content === 'string' ? response.content.trim() : '';
      this.logger.log(`Raw LLM content response: "${cleanContent}"`);
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

        result.parameters = this.normalizeParameters(params, userQuery);
      } catch (e) {
        this.logger.warn('Failed to normalize location parameters');
      }

      // Default fallback if parsing fails or returns invalid workflowId
      if (!result.workflowId) {
         return { workflowId: 'GENERAL_CHAT', parameters: {} };
      }
      
      return result;
    } catch (error: any) {
      this.logger.error(`Task Routing Failed: ${error.message}. Clean content was: "${cleanContent}". Falling back to GENERAL_CHAT.`);
      return { workflowId: 'GENERAL_CHAT', parameters: {} };
    }
  }

  private normalizeParameters(params: Record<string, any>, userQuery: string): Record<string, any> {
    const normalizedQuery = typeof params.query === 'string' && params.query.trim()
      ? params.query.trim()
      : userQuery.trim();
    const normalizedTypes = this.normalizeTypes(params.types, params.type, normalizedQuery);
    const normalizedBudget = this.normalizeBudget(params.budget, normalizedQuery);
    const normalizedLocation = this.normalizeLocation(params.location, params.locations);
    const normalizedAnchor = this.normalizeAnchor(params.anchor, normalizedQuery);

    const nextParams: Record<string, any> = {
      ...params,
      query: normalizedQuery,
    };

    if (normalizedLocation) nextParams.location = normalizedLocation;
    if (normalizedAnchor) nextParams.anchor = normalizedAnchor;
    if (normalizedBudget) nextParams.budget = normalizedBudget;
    if (normalizedTypes.length > 0) {
      nextParams.types = normalizedTypes;
      nextParams.type = normalizedTypes.join(', ');
    }

    return nextParams;
  }

  private normalizeTypes(types: any, type: any, query: string): string[] {
    const allowed = new Map<string, string>([
      ['hotel', 'hotel'],
      ['khach san', 'hotel'],
      ['nha nghi', 'hostel'],
      ['hostel', 'hostel'],
      ['nha khach', 'guesthouse'],
      ['guesthouse', 'guesthouse'],
      ['can ho', 'apartment'],
      ['apartment', 'apartment'],
      ['resort', 'resort'],
      ['khu nghi duong', 'resort'],
      ['villa', 'villa'],
      ['motel', 'motel'],
      ['camping', 'camping'],
      ['homestay', 'homestay'],
    ]);

    const values = [
      ...(Array.isArray(types) ? types : []),
      ...(typeof type === 'string' ? type.split(',') : []),
    ]
      .map((value) => this.canonicalizeText(String(value)))
      .filter(Boolean)
      .map((value) => allowed.get(value) || value)
      .filter((value, index, array) => array.indexOf(value) === index);

    if (values.length > 0) return values;

    const queryNormalized = this.canonicalizeText(query);
    const inferred: string[] = [];
    for (const [keyword, canonical] of allowed.entries()) {
      if (queryNormalized.includes(keyword) && !inferred.includes(canonical)) {
        inferred.push(canonical);
      }
    }

    return inferred;
  }

  private normalizeBudget(budget: any, query: string): string | undefined {
    const value = typeof budget === 'string' ? this.canonicalizeText(budget) : '';
    if (['low', 'cheap', 'budget', 're', 'binh dan', 'gia sinh vien'].includes(value)) return 'low';
    if (['mid', 'medium', 'midrange', 'mid range', 'vua', 'tam trung', 'on', 'vua phai'].includes(value)) return 'mid';
    if (['high', 'expensive', 'luxury', 'premium', 'sang', 'cao cap', '5 sao'].includes(value)) return 'high';

    const queryNormalized = this.canonicalizeText(query);
    if (/(re|binh dan|gia sinh vien)/.test(queryNormalized)) return 'low';
    if (/(tam trung|vua phai|vua|on)/.test(queryNormalized)) return 'mid';
    if (/(sang|cao cap|luxury|premium|5 sao)/.test(queryNormalized)) return 'high';
    return undefined;
  }

  private normalizeLocation(location: any, locations: any): string | undefined {
    if (typeof location === 'string' && location.trim()) return location.trim();
    if (Array.isArray(locations) && locations.length > 0) {
      const first = locations.find((item) => typeof item === 'string' && item.trim());
      if (typeof first === 'string') return first.trim();
    }
    return undefined;
  }

  private normalizeAnchor(anchor: any, query: string): string | undefined {
    if (typeof anchor === 'string' && anchor.trim()) return anchor.trim();

    const queryNormalized = this.canonicalizeText(query);
    const match = queryNormalized.match(/(?:gan|near|nearby|xung quanh|around|close to|within)\s+(.+?)(?=\s+(?:gia|re|binh dan|tam trung|sang|cao cap|luxury|premium|5 sao)\b|$)/i);
    if (match?.[1]) {
      return match[1].trim();
    }

    return undefined;
  }

  private canonicalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatRecentHistory(conversationHistory: any[] = []): ChatMessage[] {
    return conversationHistory
      .filter((message) => message?.role === 'user' || message?.role === 'assistant')
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: this.truncateForRouter(String(message.content || '')),
      }))
      .filter((message) => message.content.trim().length > 0);
  }

  private truncateForRouter(content: string): string {
    const normalized = this.stripLegacyPlacePrompt(content).replace(/\s+/g, ' ').trim();
    return normalized.length > 800 ? `${normalized.slice(0, 800)}...` : normalized;
  }

  private stripLegacyPlacePrompt(content: string): string {
    const match = content.match(/Question:\s*([\s\S]+)$/i);
    if (content.startsWith('You are a travel assistant.') && match?.[1]) {
      return match[1].trim();
    }

    return content;
  }
}
