import { Injectable, Logger } from '@nestjs/common';
import { IResponseComposer, ComposerContext, ComposerResult } from '../../interfaces/response-composer.interface';
import { ILlmClient } from '../../interfaces/llm-client.interface';
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

const COMPARE_COMPOSER_PROMPT = `
## COMPARE_PLACES — CHUYÊN BIỆT

So sánh các địa điểm mà user đã tag. Dùng reviews, ratings, metadata từ context.

PRE-CHECK:
- Nếu context có ít hơn 2 địa điểm được tag, chỉ trả lời:
  "Để so sánh, bạn hãy chọn (tag) ít nhất 2 địa điểm trên bản đồ nhé! 📍"
  KHÔNG phân tích gì thêm.
- Nếu Extracted Parameters không có tiêu chí cụ thể, hoặc tiêu chí chỉ là "overall"/"tổng quan"/rỗng, KHÔNG đưa ra so sánh cuối cùng.
  Trước tiên hãy hỏi 1-3 câu ngắn để làm rõ tiêu chí như giá, vị trí, yên tĩnh, sạch sẽ, rating, tiện nghi, nhóm khách, ngân sách.
  Ví dụ: "Bạn muốn mình ưu tiên so sánh theo giá, vị trí, độ yên tĩnh hay chất lượng review?"
- Chỉ chuyển sang so sánh chi tiết khi tiêu chí đã rõ từ message hiện tại hoặc lịch sử gần đây.
- Khi so sánh chi tiết, phải dùng tagged place metadata, review evidence, tiêu chí user vừa trả lời, và prior Q&A liên quan trong lịch sử hội thoại.
- Nếu không có review/metadata đủ mạnh cho một tiêu chí, nói rõ thiếu dữ liệu; không bịa bằng chứng.

ĐỊNH DẠNG OUTPUT:

1. **Mở đầu** (2-3 câu): Đặt bối cảnh so sánh một cách tự nhiên, nhắc tên 2 nơi bằng link.
   Ví dụ: "Cùng xem **[Khách sạn Mường Thanh](place:abc-123)** và **[Vinpearl Resort](place:def-456)** khác nhau thế nào nhé!"

2. **Bảng so sánh nhanh** (Markdown table):

   | | [Tên A](place:id_a) | [Tên B](place:id_b) |
   |---|---|---|
   | ⭐ Đánh giá | 4.2/5 (120 reviews) | 4.5/5 (85 reviews) |
   | 💰 Tầm giá | ~500K/đêm | ~1.2tr/đêm |
   | 📍 Vị trí | Cách trung tâm 2km | Ngay bãi biển |
   | 🏊 Nổi bật | Hồ bơi, gym | Spa, view biển |

   Lưu ý: Tên trong header bảng PHẢI là link place:id.
   Chỉ điền thông tin có trong data. Nếu thiếu, ghi "Chưa rõ".

3. **Phân tích từng nơi** — viết ngắn gọn, dẫn chứng review:

   ### [Tên A](place:id_a)
   ✅ Điểm mạnh: ... — _"review trích dẫn"_
   ⚠️ Lưu ý: ... — _"review trích dẫn"_

   ### [Tên B](place:id_b)
   ✅ Điểm mạnh: ... — _"review trích dẫn"_
   ⚠️ Lưu ý: ... — _"review trích dẫn"_

4. **🎯 Nên chọn nơi nào?** — Gợi ý dựa trên tiêu chí user hỏi (nếu có), hoặc tổng quan.
   Viết dạng: "Nếu bạn ưu tiên X → chọn A. Nếu quan tâm Y → chọn B."
   KHÔNG tuyên bố winner tuyệt đối trừ khi data rõ ràng.

5. **Câu hỏi follow-up** ngắn gọn.

QUY TẮC LINK:
- MỌI lần nhắc tên địa điểm đều PHẢI là link: [Tên](place:place_id)
- Trong bảng, trong heading, trong bullet — không ngoại lệ.
- Dùng ID thực từ context (UUID hoặc serpapi-xxx).

GIỌNG VĂN:
- Thân thiện, tự nhiên như đang tư vấn cho bạn bè.
- Dùng emoji vừa phải để dễ đọc.
- Tránh liệt kê khô khan — mỗi bullet nên có 1 insight cụ thể.
- Nếu data thiếu, nói thẳng "Chưa có đủ thông tin về X" thay vì bỏ qua.
`;

const ANALYZE_COMPOSER_PROMPT = `
## ANALYZE_PLACE — CHUYÊN BIỆT

Phân tích chi tiết 1 địa điểm user tag, dựa trên preferences của họ.

PRE-CHECK:
- Nếu context không có địa điểm nào được tag, chỉ trả lời:
  "Bạn hãy chọn (tag) một địa điểm trên bản đồ để tôi phân tích nhé! 📍"
  KHÔNG phân tích gì thêm.

---

### PHASE 1 — HỎI PREFERENCES

Khi user CHƯA nêu preferences (kiểm tra cả message hiện tại VÀ lịch sử hội thoại gần nhất):

Trả lời tự nhiên, thân thiện. Ví dụ:

"Tôi sẽ phân tích **[Tên địa điểm](place:id)** cho bạn! Nhưng trước tiên, cho tôi biết bạn đang tìm kiếm gì nhé:

💰 Giá cả hợp lý?
📍 Vị trí thuận tiện?
🧹 Phòng sạch sẽ, chất lượng?
🌊 View đẹp, không gian thoáng?
🏊 Tiện ích (hồ bơi, gym, spa)?
🔇 Yên tĩnh, phù hợp nghỉ ngơi?
🍽️ Gần quán ăn, nhà hàng?

Cứ liệt kê hoặc mô tả theo cách của bạn!"

Lưu ý:
- PHẢI dùng link place:id cho tên địa điểm.
- KHÔNG phân tích trong phase này. Chỉ hỏi.
- Điền tên thật từ context, không dùng placeholder.

---

### PHASE 2 — PHÂN TÍCH

Khi user ĐÃ nêu preferences (trong message hiện tại hoặc lịch sử gần):

ĐỊNH DẠNG OUTPUT:

1. **Verdict** — 1-2 câu nhận định tổng quát:
   "**[Tên](place:id)** khá phù hợp với nhu cầu của bạn về X và Y, nhưng có vài điểm cần lưu ý về Z."

2. **✅ Điểm mạnh** — liệt kê theo từng preference user quan tâm:

   ✅ **Vị trí**: Ngay trung tâm, cách bãi biển 200m — _"Đi bộ ra biển chỉ 3 phút, rất tiện"_ (⭐4/5)

   ✅ **Giá cả**: Tầm 450K/đêm, hợp lý cho khu vực này — _"Giá phải chăng so với chất lượng"_ (⭐5/5)

   Format: ✅ **[Tiêu chí]**: [Nhận định cụ thể] — _"trích dẫn review"_ (⭐rating)

3. **⚠️ Điểm yếu** — chỉ liệt kê những điểm LIÊN QUAN tới preferences:

   ⚠️ **Yên tĩnh**: Một số khách phản ánh ồn vào buổi tối — _"Phòng gần đường nên khá ồn ban đêm"_ (⭐2/5)

   Format: ⚠️ **[Tiêu chí]**: [Nhận định] — _"trích dẫn review"_ (⭐rating)

4. **📊 Tổng kết nhanh** — bảng mini hoặc bullet:

   | Tiêu chí | Mức phù hợp |
   |----------|-------------|
   | 📍 Vị trí | ✅ Phù hợp |
   | 💰 Giá cả | ✅ Phù hợp |
   | 🔇 Yên tĩnh | ⚠️ Cần cân nhắc |

5. **Câu hỏi follow-up**: "Bạn muốn tôi tìm thêm lựa chọn khác hay so sánh **[Tên](place:id)** với nơi khác?"

QUY TẮC:
- MỌI nhận định PHẢI có dẫn chứng từ reviews hoặc metadata. Không bịa.
- Nếu không có data cho 1 preference → ghi rõ: "📋 **[Tiêu chí]**: Chưa có đủ dữ liệu từ đánh giá khách hàng để nhận xét."
- MỌI lần nhắc tên địa điểm PHẢI dùng link [Tên](place:id).
- Phân tích ĐÚNG theo preferences user nêu, không generic.
- Giọng tự nhiên, tư vấn như bạn bè, tránh ngôn ngữ robot.
`;

@Injectable()
export class LlmResponseComposerService implements IResponseComposer {
  private readonly logger = new Logger(LlmResponseComposerService.name);

  constructor(
    private readonly llmClient: ILlmClient,
    private readonly prisma: PrismaService,
    private readonly placesService: PlacesService,
  ) {}

  private getWorkflowInstructions(workflowId: string): string | undefined {
    const map: Record<string, string> = {
      'COMPARE_PLACES': COMPARE_COMPOSER_PROMPT,
      'ANALYZE_PLACE': ANALYZE_COMPOSER_PROMPT,
    };
    return map[workflowId];
  }

  private buildUserContextPrompt(context: ComposerContext): string | undefined {
    const uc = context.userContext;
    if (!uc) return undefined;

    const parts: string[] = [];

    // Current time — always include (use server time as fallback)
    const now = new Date();
    const tz = uc.timezone || 'Asia/Ho_Chi_Minh';
    try {
      const formatted = now.toLocaleString('vi-VN', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      parts.push(`🕐 Thời gian hiện tại: ${formatted} (${tz})`);
    } catch {
      parts.push(`🕐 Thời gian hiện tại: ${now.toISOString()}`);
    }

    // User name
    if (uc.displayName) {
      parts.push(`👤 Tên người dùng: ${uc.displayName}`);
    }

    // User location
    if (uc.lat != null && uc.lng != null) {
      parts.push(`📍 Vị trí hiện tại của người dùng: ${uc.lat.toFixed(4)}, ${uc.lng.toFixed(4)}`);
    }

    // Locale
    if (uc.locale) {
      parts.push(`🌐 Ngôn ngữ: ${uc.locale}`);
    }

    if (parts.length === 0) return undefined;

    return `[USER CONTEXT]\n${parts.join('\n')}\n[END USER CONTEXT]\n\nSử dụng thông tin trên để cá nhân hóa câu trả lời. Gọi tên user nếu có. Dùng thời gian để gợi ý phù hợp (sáng/trưa/tối). Dùng vị trí user để tính khoảng cách nếu liên quan.`;
  }

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
      reviewCount?: number;
      price?: string;
      priceLevel?: number;
      amenities?: string[];
      source?: string;
      sourcePlaceId?: string;
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

    const fixturePlacesMap = new Map<string, any>();

    if (allIds.length > 0) {
      await Promise.all(
        allIds
          .filter((id) => this.isLocalPlaceId(id))
          .map(async (id) => {
            try {
              const [place, reviews] = await Promise.all([
                this.placesService.findOne(id).catch(() => null),
                this.placesService.findReviews(id).catch(() => []),
              ]);

              if (place || reviews.length > 0) {
                fixturePlacesMap.set(id, { place, reviews });
              }
            } catch (err: any) {
              this.logger.warn(`Unable to load local fixture review context for ${id}: ${err.message}`);
            }
          }),
      );

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
      const nonUuidIds = allIds.filter(id => !UUID_REGEX.test(id) && !fixturePlacesMap.has(id));

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
        const fixtureContext = fixturePlacesMap.get(id);
        const dbPlace = dbPlacesMap.get(id);
        const fePlace = frontendPlacesMap.get(id);

        if (fixtureContext) {
          const fixturePlace = fixtureContext.place || {};
          const fixtureReviews = Array.isArray(fixtureContext.reviews) ? fixtureContext.reviews : [];
          const sourcePlaceId = fixturePlace.sourcePlaceId || id.replace(/^local-/, '');

          placesInfoList.push({
            id: fixturePlace.id || id,
            name: fixturePlace.placeName || fixturePlace.name || fePlace?.name || `Địa điểm #${sourcePlaceId}`,
            address: fixturePlace.placeAddress || fixturePlace.address || fePlace?.address,
            latitude: fixturePlace.lat || fixturePlace.latitude || fePlace?.latitude || fePlace?.lat,
            longitude: fixturePlace.lng || fixturePlace.longitude || fePlace?.longitude || fePlace?.lng,
            rating: fixturePlace.averageRating || fixturePlace.rating || fePlace?.rating,
            reviewCount: fixturePlace.reviewCount || fixtureReviews.length || fePlace?.reviewCount,
            price: fePlace?.price || fePlace?.priceRange,
            priceLevel: fixturePlace.priceLevel || fePlace?.priceLevel,
            amenities: this.extractAmenities(fixturePlace).length ? this.extractAmenities(fixturePlace) : this.extractAmenities(fePlace),
            source: fixturePlace.source || 'local',
            sourcePlaceId,
            categories: Array.isArray(fixturePlace.categories) ? fixturePlace.categories : (fePlace?.type ? [fePlace.type] : []),
            reviews: this.selectRelevantReviews(fixtureReviews, context.userQuery, 16),
          });
        } else if (dbPlace) {
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
            reviewCount: dbPlace.reviewCount,
            priceLevel: dbPlace.priceLevel,
            amenities: this.extractAmenities(dbPlace.rawSerpApiPropertyDetails),
            source: dbPlace.source,
            sourcePlaceId: dbPlace.sourcePlaceId,
            categories: dbPlace.categories,
            reviews: this.selectRelevantReviews(dbPlace.reviews, context.userQuery, 16),
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
            reviewCount: fePlace.reviewCount || fePlace.reviewsCount || fePlace.userRatingsTotal,
            price: fePlace.price || fePlace.priceRange || fePlace.priceText || fePlace.ratePerNight,
            amenities: this.extractAmenities(fePlace),
            source: fePlace.source,
            sourcePlaceId: fePlace.sourcePlaceId,
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
        const ratingStr = place.rating ? `${place.rating}/5` : 'N/A';
        const reviewCountStr = typeof place.reviewCount === 'number' ? `, Số review: ${place.reviewCount}` : '';
        const priceStr = place.price ? `, Giá/Tầm giá: ${place.price}` : (typeof place.priceLevel === 'number' ? `, Price level: ${place.priceLevel}` : '');
        const sourceStr = place.source ? `, Nguồn: ${place.source}${place.sourcePlaceId ? `/${place.sourcePlaceId}` : ''}` : '';
        const amenitiesStr = place.amenities?.length ? `\nTiện nghi/đặc điểm nổi bật: ${place.amenities.slice(0, 12).join(', ')}\n` : '';
        taggedPlacesContext += `Địa điểm: ${place.name} (ID: ${place.id}, Loại: ${place.categories?.join(', ') || 'N/A'}, Đánh giá trung bình: ${ratingStr}${reviewCountStr}${priceStr}${sourceStr}${coordsStr}${addressStr})\n${amenitiesStr}`;
        
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

    const frontendSearchResultsContext = this.buildFrontendSearchResultsContext(context.taggedPlaces || []);

    const contextPrompt = context.workflowId === 'COMPARE_PLACES' || context.workflowId === 'ANALYZE_PLACE'
      ? `
[SYSTEM CONTEXT]
Workflow: ${context.workflowId}
Extracted Parameters: ${JSON.stringify(context.parameters)}
[END SYSTEM CONTEXT]
${taggedPlacesContext}
${frontendSearchResultsContext}
User Query: "${context.userQuery}"

IMPORTANT REMINDERS:
- Dùng dữ liệu từ [DANH SÁCH ĐỊA ĐIỂM ĐƯỢC TAG] ở trên để phân tích/so sánh.
- Nếu có [ACTIVE SEARCH RESULTS CONTEXT], dùng nó như metadata bổ sung cho các địa điểm chưa có review DB.
- MỌI lần nhắc tên địa điểm PHẢI dùng link [Tên](place:place_id) với ID thực từ context.
- Nếu data thiếu, nói rõ thay vì bịa.
- Trả lời bằng tiếng Việt, giọng thân thiện.
`
      : `
[SYSTEM CONTEXT - TOOL RESULTS]
Workflow Executed: ${context.workflowId}
Extracted Parameters: ${JSON.stringify(context.parameters)}
Search Result Summary Context:
${searchResultSummary}
Raw Data from Tools:
${rawDataDump}
[END SYSTEM CONTEXT]
${taggedPlacesContext}
${frontendSearchResultsContext}
User Query: "${context.userQuery}"
Based on the search summary context, tool results, and any tagged place reviews context above, please answer the user's query. For search results, synthesize a brief objective overview before listing places. If the user asks about a specific tagged place, base your answer directly on its customer reviews listed in the context.
If the tagged place context is weak or missing, say you do not have enough review evidence instead of guessing.
`;

    const workflowInstructions = this.getWorkflowInstructions(context.workflowId);
    const userContextPrompt = this.buildUserContextPrompt(context);

    return [
      { role: 'system', content: COMPOSER_SYSTEM_PROMPT },
      ...(userContextPrompt ? [{ role: 'system' as const, content: userContextPrompt }] : []),
      ...(workflowInstructions ? [{ role: 'system' as const, content: workflowInstructions }] : []),
      ...this.formatConversationHistory(history),
      { role: 'user', content: contextPrompt }
    ];
  }

  async compose(context: ComposerContext, conversationHistory: any[] = []): Promise<ComposerResult> {
    try {
      const messages = await this.buildMessages(context, conversationHistory);
      const response = await this.llmClient.chat(messages);
      
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
      
      for await (const chunk of this.llmClient.streamChat(messages)) {
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

  private buildFrontendSearchResultsContext(taggedPlaces: any[] = []): string {
    if (!Array.isArray(taggedPlaces) || taggedPlaces.length === 0) {
      return '';
    }

    const normalizedPlaces = taggedPlaces
      .filter((place) => place && place.id && (place.name || place.placeName || place.title))
      .slice(0, 50)
      .map((place) => ({
        id: place.id,
        name: place.name || place.placeName || place.title,
        address: place.address || place.placeAddress || place.displayAddress || '',
        rating: place.rating || place.averageRating || null,
        reviewCount: place.reviewCount || place.reviewsCount || place.userRatingsTotal || null,
        price: place.price || place.priceRange || place.priceText || place.ratePerNight || '',
        amenities: this.extractAmenities(place).slice(0, 12),
        source: place.source || '',
        sourcePlaceId: place.sourcePlaceId || '',
        type: place.type || place.categories?.[0] || '',
        lat: place.latitude || place.lat || place.coordinates?.lat || place.location?.lat || null,
        lng: place.longitude || place.lng || place.coordinates?.lng || place.location?.lng || null,
      }));

    if (!normalizedPlaces.length) {
      return '';
    }

    const lines = normalizedPlaces.map((place, index) => {
      const parts = [
        `${index + 1}. ${place.name} (ID: ${place.id})`,
        place.type ? `Loại: ${place.type}` : '',
        place.address ? `Địa chỉ: ${place.address}` : '',
        place.rating ? `Rating: ${Number(place.rating).toFixed(1)}/5` : '',
        place.reviewCount ? `Số review: ${place.reviewCount}` : '',
        place.price ? `Giá/Tầm giá: ${place.price}` : '',
        place.amenities.length ? `Tiện nghi: ${place.amenities.join(', ')}` : '',
        place.source ? `Nguồn: ${place.source}${place.sourcePlaceId ? `/${place.sourcePlaceId}` : ''}` : '',
        place.lat != null && place.lng != null ? `Tọa độ: ${place.lat}, ${place.lng}` : '',
      ].filter(Boolean);

      return parts.join(' | ');
    });

    return `[ACTIVE SEARCH RESULTS CONTEXT]\n${lines.join('\n')}\n[END ACTIVE SEARCH RESULTS CONTEXT]\n\nNếu user hỏi tiếp về "các kết quả vừa tìm", "kết quả trên", "trong số này", hãy coi danh sách trên là tập kết quả hiện tại để phân tích/sắp xếp. Khi thiếu review thực tế, chỉ nhận xét dựa trên metadata hiện có và nói rõ giới hạn dữ liệu.\n\n`;
  }

  private extractAmenities(placeOrDetails: any): string[] {
    if (!placeOrDetails || typeof placeOrDetails !== 'object') return [];
    const direct = Array.isArray(placeOrDetails.amenities) ? placeOrDetails.amenities : [];
    const raw = placeOrDetails.rawSerpApiPropertyDetails;
    const nested = raw && typeof raw === 'object' && Array.isArray(raw.amenities) ? raw.amenities : [];

    return [...direct, ...nested]
      .map((amenity) => String(amenity || '').trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  private isLocalPlaceId(id: unknown): id is string {
    return typeof id === 'string' && /^local-\d+$/i.test(id.trim());
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
