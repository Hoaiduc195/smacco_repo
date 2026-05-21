import { Injectable, Logger } from '@nestjs/common';
import { IResponseComposer, ComposerContext, ComposerResult } from './response-composer.interface';
import { GroqClientService } from '../../groq-client.service';
import { ChatMessage } from '../../dto/chat-response.dto';
import { PrismaService } from '../../../../prisma/prisma.service';

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

5. DO NOT hallucinate data not present in the tool results or the tagged place reviews context.

---

## RESPONSE STYLE

- Clear and structured but friendly and conversational.
- Short paragraphs.
- Use bullet points when listing places or features.
- Highlight key insights using **bold text**.
- Avoid verbosity.

---

## REQUIRED STRUCTURE FOR PLACE RESULTS

When responding with place results:
1) Start with a brief, friendly introduction (e.g. "Dưới đây là các địa điểm mà tôi tìm được:").
2) Provide a bullet list. Each bullet format MUST strictly be:
   - [Place Name](place:place_id) — short address or type. Do NOT write redundant AI reviews, comments, or rankings based on aggregated scores (e.g., "Xếp hạng dựa trên điểm tổng hợp"). Keep explanations extremely concise, direct, and factual.
3) End with one short follow-up question asking what the user wants next.

---

## PLACE LINKING (STRICT RULE)

- Whenever you mention or suggest a place, you MUST make the place name a clickable Markdown link using this custom format: [Place Name](place:place_id).
- Use the actual ID of the place from the tool results.
- DO NOT use any other URL format. Always use "place:<uuid>" where <uuid> is the place's ID.
- Ensure the link is embedded inside the place name itself (e.g. [Khách sạn A](place:123-uuid-456)).

---

## IF NO RESULTS

Return exactly:
"Xin lỗi, tôi không tìm thấy kết quả nào phù hợp với yêu cầu của bạn lúc này."
`;

@Injectable()
export class GroqResponseComposerService implements IResponseComposer {
  private readonly logger = new Logger(GroqResponseComposerService.name);

  constructor(
    private readonly groqClient: GroqClientService,
    private readonly prisma: PrismaService,
  ) {}

  private async buildMessages(context: ComposerContext, history: any[] = []): Promise<ChatMessage[]> {
    const rawDataDump = JSON.stringify(context.toolResults, null, 2);
    
    // Check if there are tagged places and perform RAG from database reviews or frontend metadata fallbacks
    let taggedPlacesContext = '';
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const placesInfoList: Array<{
      id: string;
      name: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      rating?: number;
      categories?: string[];
      reviews?: Array<{ rating: number; reviewText: string }>;
    }> = [];

    // Map existing context.taggedPlaces into a fast lookup by ID
    const frontendPlacesMap = new Map<string, any>();
    if (context.taggedPlaces && context.taggedPlaces.length > 0) {
      for (const p of context.taggedPlaces) {
        if (p && p.id) {
          frontendPlacesMap.set(p.id, p);
        }
      }
    }

    // Collect all unique IDs to load or process
    const allIds = Array.from(new Set([
      ...(context.taggedPlaceIds || []),
      ...(context.taggedPlaces || []).map(p => p?.id).filter(Boolean)
    ]));

    if (allIds.length > 0) {
      // 1. Separate UUID IDs from non-UUID IDs to prevent database exceptions
      const uuidIds = allIds.filter(id => UUID_REGEX.test(id));

      let dbPlaces: any[] = [];
      if (uuidIds.length > 0) {
        try {
          dbPlaces = await this.prisma.place.findMany({
            where: {
              id: { in: uuidIds },
            },
            include: {
              reviews: {
                orderBy: { createdAt: 'desc' },
                take: 15,
              },
            },
          });
        } catch (err: any) {
          this.logger.error(`Failed to load tagged places from database: ${err.message}`);
        }
      }

      const dbPlacesMap = new Map<string, any>();
      for (const p of dbPlaces) {
        dbPlacesMap.set(p.id, p);
      }

      // 2. Loop through all requested IDs and resolve details
      for (const id of allIds) {
        const dbPlace = dbPlacesMap.get(id);
        const fePlace = frontendPlacesMap.get(id);

        if (dbPlace) {
          // Place exists in DB - use DB data and real reviews
          placesInfoList.push({
            id: dbPlace.id,
            name: dbPlace.placeName,
            address: dbPlace.address,
            latitude: dbPlace.latitude,
            longitude: dbPlace.longitude,
            rating: dbPlace.averageRating ? parseFloat(dbPlace.averageRating.toString()) : undefined,
            categories: dbPlace.categories,
            reviews: dbPlace.reviews.map((r: any) => {
              let text = r.reviewText || r.comment || '';
              if (r.source === 'google' && text.startsWith('__GOOGLE_REVIEW__::')) {
                const parts = text.split('::');
                const author = parts[1] || 'Ẩn danh';
                const date = parts[2] || '';
                const cleanText = parts.slice(3).join('::') || '';
                text = `${author} (${date}): ${cleanText}`;
              }
              return {
                rating: r.rating,
                reviewText: text
              };
            })
          });
        } else if (fePlace) {
          // Place does not exist in DB but has details in FE payload - use FE data as fallback
          placesInfoList.push({
            id: fePlace.id,
            name: fePlace.placeName || fePlace.name,
            address: fePlace.address,
            latitude: fePlace.latitude || fePlace.lat || fePlace.coordinates?.lat,
            longitude: fePlace.longitude || fePlace.lng || fePlace.coordinates?.lng,
            rating: fePlace.rating,
            categories: Array.isArray(fePlace.categories) ? fePlace.categories : (fePlace.type ? [fePlace.type] : []),
            reviews: [] // No reviews in DB yet
          });
        } else {
          // ID only, no details from FE and not found in DB - write basic ID placeholder
          placesInfoList.push({
            id,
            name: `Địa điểm #${id.slice(0, 8)}`,
            reviews: []
          });
        }
      }
    }

    if (placesInfoList.length > 0) {
      taggedPlacesContext += `\n[DANH SÁCH ĐỊA ĐIỂM ĐƯỢC TAG VÀ NHẬN XÉT THỰC TẾ]\n`;
      for (const place of placesInfoList) {
        const coordsStr = (place.latitude && place.longitude) ? ` (Tọa độ: ${place.latitude}, ${place.longitude})` : '';
        const addressStr = place.address ? `, Địa chỉ: ${place.address}` : '';
        taggedPlacesContext += `Địa điểm: ${place.name} (ID: ${place.id}, Loại: ${place.categories?.join(', ') || 'N/A'}, Đánh giá trung bình: ${place.rating || 'N/A'}${coordsStr}${addressStr})\n`;
        
        if (place.reviews && place.reviews.length > 0) {
          taggedPlacesContext += `Các nhận xét thực tế từ khách hàng:\n`;
          place.reviews.forEach((r, idx) => {
            taggedPlacesContext += `- [Đánh giá ${r.rating}/5 sao]: ${r.reviewText || '(Không có nội dung)'}\n`;
          });
        } else {
          taggedPlacesContext += `Địa điểm này hiện chưa có nhận xét thực tế từ khách hàng trong cơ sở dữ liệu.\n`;
        }
        taggedPlacesContext += `\n`;
      }
      taggedPlacesContext += `[HẾT DANH SÁCH ĐỊA ĐIỂM ĐƯỢC TAG]\n\n`;
    }

    const contextPrompt = `
[SYSTEM CONTEXT - TOOL RESULTS]
Workflow Executed: ${context.workflowId}
Extracted Parameters: ${JSON.stringify(context.parameters)}
Raw Data from Tools:
${rawDataDump}
[END SYSTEM CONTEXT]
${taggedPlacesContext}
User Query: "${context.userQuery}"
Based on the tool results and any tagged place reviews context above, please answer the user's query. If the user asks about a specific tagged place, base your answer directly on its customer reviews listed in the context.
`;

    return [
      { role: 'system', content: COMPOSER_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: contextPrompt }
    ];
  }

  async compose(context: ComposerContext, conversationHistory: any[] = []): Promise<ComposerResult> {
    try {
      const messages = await this.buildMessages(context, conversationHistory);
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
      const messages = await this.buildMessages(context, conversationHistory);
      
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
