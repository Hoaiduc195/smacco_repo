import { Injectable, Logger } from '@nestjs/common';
import { IResponseComposer, ComposerContext, ComposerResult } from './response-composer.interface';
import { GroqClientService } from '../../groq-client.service';
import { ChatMessage } from '../../dto/chat-response.dto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PlacesService } from '../../../places/places.service';

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
   - If the context does not contain enough evidence, say you do not have enough information.
   - Do not infer room quality, service quality, cleanliness, safety, or pricing unless reviews or place metadata explicitly support it.

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
0) First infer the user's evaluation criteria from the original User Query and Extracted Parameters. Do this silently; do not output an explicit "criteria analysis" section unless the user asks.
   - Examples: "gần trung tâm" => proximity/location; "giá rẻ" => budget; "đẹp/yên tĩnh" => ambience if review/context supports it; "có hồ bơi" => amenities; "được đánh giá tốt" => rating/review count.
   - If multiple criteria appear, evaluate in the user's likely priority order from the query wording.
1) Start with a 1-2 sentence overview that directly answers those inferred criteria.
   - If the user asks for "gần", "near", "trung tâm", "xung quanh", or a specific anchor/location, discuss proximity/location fit first.
   - Do not lead with amenities unless the user asked about amenities.
2) Then provide 3-5 highlighted suggestions as bullets. Each bullet MUST include a clickable place link and 1 concise, evidence-based reason tied to the inferred user criteria.
3) If useful, add one short "Lưu ý" sentence about missing data or why the user should compare details.
4) End with one short follow-up question asking what the user wants next.

When Search Result Summary Context is provided:
- Prefer that context over raw tool dumps for synthesis.
- Use priorityCriteria and the original User Query together as the ordering principle for the answer.
- Use topPlaces.distanceKm / topPlaces.anchorLabel / reasons about distance when available for proximity queries.
- Use overview, topPlaces, dataCompleteness, and limitations to make the answer more objective.
- Mention uncertainty when fields such as price, amenities, review count, or distance are missing.
- Do NOT claim "best", "nearest", "cheapest", or "most suitable" unless the context directly supports it.
- If priorityCriteria.primary is "proximity" but distanceKm is missing, say the system only has approximate location/address evidence and avoid ranking by amenities.
- Amenities are secondary evidence. Never present "xung quanh có N tiện ích" as the main reason for a query whose main intent is proximity.
- If the context lacks evidence for a criterion the user cares about, explicitly say that criterion is not well covered by the current data.

---

## PLACE LINKING (STRICT RULE)

- Whenever you mention or suggest a place, you MUST make the place name a clickable Markdown link using this custom format: [Place Name](place:place_id).
- Use the actual ID of the place from the tool results or context (which can be a database UUID or a SerpAPI ID like "serpapi-12345").
- DO NOT use any other URL format. Always use "place:<place_id>" where <place_id> is the place's ID.
- Ensure the link is embedded inside the place name itself (e.g. [Khách sạn A](place:serpapi-12345) or [Khách sạn B](place:123-uuid-456)).

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
    private readonly placesService: PlacesService,
  ) {}

  private async buildMessages(context: ComposerContext, history: any[] = []): Promise<ChatMessage[]> {
    const searchResultSummary = context.searchResultContext
      ? JSON.stringify(context.searchResultContext, null, 2)
      : 'N/A';
    const shouldIncludeRawToolResults = context.workflowId !== 'SEARCH_PLACES' || !context.searchResultContext;
    const rawDataDump = shouldIncludeRawToolResults
      ? JSON.stringify(context.toolResults, null, 2)
      : '[Omitted for SEARCH_PLACES because Search Result Summary Context already contains the compact result evidence.]';
    
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
      reviews?: Array<{ rating: number; reviewText: string; source?: string; date?: string }>;
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
      await Promise.all(
        allIds.map((id) =>
          this.placesService.ensureGoogleReviewsForAiContext(id).catch((err: any) => {
            this.logger.warn(`Unable to refresh Google review context for ${id}: ${err.message}`);
            return [];
          }),
        ),
      );

      // 1. Separate UUID IDs from non-UUID IDs to prevent database exceptions
      const uuidIds = allIds.filter(id => UUID_REGEX.test(id));
      const nonUuidIds = allIds.filter(id => !UUID_REGEX.test(id));

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
                take: 40,
              },
            },
          });
        } catch (err: any) {
          this.logger.error(`Failed to load tagged places from database by UUID: ${err.message}`);
        }
      }

      // Also look up non-UUID IDs by source & sourcePlaceId
      for (const nonUuidId of nonUuidIds) {
        try {
          const dashIndex = nonUuidId.indexOf('-');
          const source = dashIndex !== -1 ? nonUuidId.substring(0, dashIndex) : 'serpapi';
          const sourcePlaceId = dashIndex !== -1 ? nonUuidId.substring(dashIndex + 1) : nonUuidId;

          const matchedPlace = await this.prisma.place.findFirst({
            where: {
              source: source.trim().toLowerCase(),
              sourcePlaceId: sourcePlaceId.trim(),
            },
            include: {
              reviews: {
                orderBy: { createdAt: 'desc' },
                take: 40,
              },
            },
          });

          if (matchedPlace) {
            dbPlaces.push(matchedPlace);
          }
        } catch (err: any) {
          this.logger.error(`Failed to load non-UUID place ${nonUuidId} from database: ${err.message}`);
        }
      }

      const dbPlacesMap = new Map<string, any>();
      for (const p of dbPlaces) {
        dbPlacesMap.set(p.id, p);
        if (p.source && p.sourcePlaceId) {
          dbPlacesMap.set(`${p.source}-${p.sourcePlaceId}`, p);
          dbPlacesMap.set(p.sourcePlaceId, p);
        }
      }

      // 2. Loop through all requested IDs and resolve details
      for (const id of allIds) {
        const dbPlace = dbPlacesMap.get(id);
        const fePlace = frontendPlacesMap.get(id);

        if (dbPlace) {
          // Place exists in DB - use DB data and real reviews
          placesInfoList.push({
            id: (dbPlace.source && dbPlace.sourcePlaceId)
              ? `${dbPlace.source}-${dbPlace.sourcePlaceId}`
              : dbPlace.id,
            name: dbPlace.placeName,
            address: dbPlace.placeAddress,
            latitude: dbPlace.lat,
            longitude: dbPlace.lng,
            rating: dbPlace.averageRating ? parseFloat(dbPlace.averageRating.toString()) : undefined,
            categories: dbPlace.categories,
            reviews: this.selectRelevantReviews(dbPlace.reviews, context.userQuery, 10),
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
          taggedPlacesContext += `Các nhận xét dùng làm context AI (có thể gồm review Google đã cache, không hiển thị trực tiếp trên UI):\n`;
          place.reviews.forEach((r, idx) => {
            const source = r.source ? `Nguồn: ${r.source}. ` : '';
            const date = r.date ? `Ngày: ${r.date}. ` : '';
            taggedPlacesContext += `- [Đánh giá ${r.rating}/5 sao] ${source}${date}${r.reviewText || '(Không có nội dung)'}\n`;
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
Search Result Summary Context:
${searchResultSummary}
Raw Data from Tools:
${rawDataDump}
[END SYSTEM CONTEXT]
${taggedPlacesContext}
User Query: "${context.userQuery}"
Based on the search summary context, tool results, and any tagged place reviews context above, please answer the user's query. For search results, synthesize a brief objective overview before listing places. If the user asks about a specific tagged place, base your answer directly on its customer reviews listed in the context.
If the tagged place context is weak or missing, say you do not have enough review evidence instead of guessing.
`;

    return [
      { role: 'system', content: COMPOSER_SYSTEM_PROMPT },
      ...this.formatConversationHistory(history),
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

  private selectRelevantReviews(reviews: any[] = [], userQuery: string, limit: number) {
    const queryTokens = this.tokenizeForRetrieval(userQuery);

    return reviews
      .map((review) => {
        const parsed = this.parseReview(review);
        const reviewTokens = this.tokenizeForRetrieval(parsed.reviewText);
        const overlap = reviewTokens.filter((token) => queryTokens.includes(token)).length;
        const sourceBoost = parsed.source === 'google' ? 1 : 1.5;
        const textLengthBoost = parsed.reviewText.length > 40 ? 1 : 0;

        return {
          ...parsed,
          retrievalScore: overlap * 3 + sourceBoost + textLengthBoost,
        };
      })
      .filter((review) => review.reviewText.trim().length > 0)
      .sort((a, b) => b.retrievalScore - a.retrievalScore)
      .slice(0, limit)
      .map(({ retrievalScore, ...review }) => review);
  }

  private parseReview(review: any) {
    let text = review.reviewText || review.comment || '';
    let author = review.user?.displayName || review.author;
    let date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : undefined;

    if (review.source === 'google' && text.startsWith('__GOOGLE_REVIEW__::')) {
      const parts = text.split('::');
      author = parts[1] || 'Ẩn danh';
      date = parts[2] || date;
      text = parts.slice(3).join('::') || '';
    }

    return {
      rating: review.rating,
      source: review.source,
      author,
      date,
      reviewText: text,
    };
  }

  private tokenizeForRetrieval(text: string): string[] {
    const stopwords = new Set([
      'toi', 'minh', 'ban', 'la', 'co', 'va', 'o', 'tai', 'cho', 've', 'nay',
      'the', 'a', 'an', 'is', 'are', 'for', 'with', 'this', 'that',
    ]);

    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 2 && !stopwords.has(token));
  }

  private formatConversationHistory(history: any[] = []): ChatMessage[] {
    return history
      .filter((message) => message?.role === 'user' || message?.role === 'assistant')
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: this.truncateHistoryMessage(this.stripLegacyPlacePrompt(String(message.content || ''))),
      }))
      .filter((message) => message.content.trim().length > 0);
  }

  private stripLegacyPlacePrompt(content: string): string {
    const match = content.match(/Question:\s*([\s\S]+)$/i);
    if (content.startsWith('You are a travel assistant.') && match?.[1]) {
      return match[1].trim();
    }

    return content;
  }

  private truncateHistoryMessage(content: string): string {
    const normalized = content.replace(/\s+/g, ' ').trim();
    return normalized.length > 1200 ? `${normalized.slice(0, 1200)}...` : normalized;
  }
}
