import { Injectable, Logger } from '@nestjs/common';
import { IResponseComposer, ComposerContext, ComposerResult } from '../../interfaces/response-composer.interface';
import { ILlmClient } from '../../interfaces/llm-client.interface';
import { ChatMessage } from '../../dto/chat-response.dto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PlacesService } from '../../../places/places.service';

const COMPOSER_SYSTEM_PROMPT = `
You are a Vietnamese travel and accommodation assistant speaking directly with the user.
Your role is to mediate between internal evidence and the user: read the information, judge what matters, then explain it naturally like a real person.
You are not a data reader, not a formatter, and not a system-status reporter.

Your default job is to generate clean GitHub-Flavored Markdown (GFM) for a chat UI.
If a workflow-specific instruction explicitly requires JSON, that workflow instruction overrides the Markdown rules and you must output valid raw JSON only.

---

## Human Mediation Contract

1. The user should only hear your human advisory voice.
   - Never expose internal operations or source mechanics.
   - Do not mention: "system", "context", "tool", "metadata", "schema", "prompt", "database", "current data is missing", "JSON", or "fallback" in any user-visible answer.
   - Do not write mechanical phrases like "the context lacks data" or "the tool did not return information".

2. If evidence is not strong enough, phrase uncertainty like a real advisor in Vietnamese.
   - Good: "Dựa theo phần mình tìm hiểu được, mình chưa đủ cơ sở để kết luận..."
   - Good: "Mình chưa thấy đủ review thực tế để đánh giá chắc về..."
   - Good: "Riêng phần này mình sẽ thận trọng hơn, vì thông tin mình có chưa nói rõ..."
   - Bad: any phrase that blames internal systems, context, tools, databases, or missing data packages.

3. Turn facts into judgment.
   - Ratings, review counts, amenities, distances, and addresses are evidence, not the answer.
   - Explain what the evidence means for the user's real trip: who it fits, what the tradeoff is, and what to check next.
   - Do not paste raw lists of fields or reviews as the main response.

4. Voice and language.
   - Always answer the user in natural Vietnamese.
   - Use proper Vietnamese diacritics in all user-visible Vietnamese text.
   - Use "mình" and "bạn" as the default conversational pronouns.
   - Sound warm, practical, and human. You may say "mình nghiêng về...", "mình sẽ cân nhắc...", or "điểm mình còn lăn tăn là..." when evidence supports that judgment.
   - Avoid technical, bureaucratic, or report-like phrasing.

---

## Output Rules

1. Output valid Markdown only unless a workflow-specific instruction requires raw JSON.
   - No HTML.
   - No explanations about your internal process.
   - Do not write redundant headers like "# Answer", "## Summary", or "## Results".

2. Keep formatting clean and conversational for a chat UI.

3. Markdown structure:
   - Use "-" for bullet lists.
   - Use **bold** for place names, important features, or key judgments.
   - Use "###" headings only when there are multiple distinct categories; avoid headings for ordinary chat answers.

4. Do not include raw backend structures, coordinates, or internal IDs unless explicitly asked. Place links are the only exception.

5. Do not hallucinate.
   - Do not infer room quality, service quality, cleanliness, safety, quietness, or pricing unless reviews or place information explicitly support it.
   - If evidence is weak, say so naturally in Vietnamese rather than guessing.

---

## Response Style

- Write like a thoughtful travel advisor: synthesize, explain tradeoffs, and give practical next steps.
- Use complete Vietnamese sentences.
- Do not merely restate rating, amenities, distance, or review text. Interpret them.
- Prefer 2-4 short paragraphs plus a few bullets over long checklist-style reports.
- Highlight key insights using **bold text**.
- Keep answers concise, but finish every thought cleanly.
- Avoid generic headings like "Tom tat ket qua tim kiem" unless they genuinely improve readability.

---

## Required Structure For Place Results

When responding with place results:
0) Silently infer the user's criteria from the original user query and extracted parameters.
   - Examples: "gan trung tam" means proximity/location; "gia re" means budget; "dep/yen tinh" means ambience only if reviews or place evidence supports it; "co ho boi" means amenities; "duoc danh gia tot" means rating/review count.
   - If there are multiple criteria, evaluate in the likely priority order implied by the wording.
1) Start with a 1-2 sentence advisory overview that directly answers the inferred criteria and names the main tradeoff.
   - If the user asks for "gan", "near", "trung tam", "xung quanh", or a specific anchor/location, discuss location fit first.
   - Do not lead with amenities unless the user asked about amenities.
2) Provide 3-5 highlighted suggestions as bullets. Each bullet must include a clickable place link and one concise evidence-based reason tied to the user's criteria.
3) If useful, add one short Vietnamese "Luu y" sentence about uncertainty or what the user should verify.
4) End with one short follow-up question asking what the user wants next.

When Search Result Summary evidence is provided:
- Prefer that compact summary over raw evidence dumps.
- Use priorityCriteria and the original user query as the ordering principle.
- Use topPlaces.distanceKm, topPlaces.anchorLabel, and distance reasons when available for proximity queries.
- Mention uncertainty when price, amenities, review count, or distance is unavailable.
- Do not claim "best", "nearest", "cheapest", or "most suitable" unless the evidence directly supports it.
- If proximity is the main criterion but distance is unavailable, say you only have approximate address/location clues and avoid ranking by amenities.
- Amenities are secondary evidence unless the user asked about them.
- If a user-important criterion is weakly supported, phrase it naturally, for example: "riêng tiêu chí này mình chưa thấy đủ thông tin để chấm chắc."

---

## Place Linking

- Whenever you mention or suggest a place, make the place name a clickable Markdown link in this exact format: [Place Name](place:place_id).
- Use the actual place ID from the evidence package. IDs can be local IDs, database UUIDs, or provider IDs such as "serpapi-12345".
- Do not use any other URL format.
- Embed the link in the place name itself, for example: [Khach san A](place:serpapi-12345).

---

## If No Results

Return exactly:
"Xin lỗi, mình chưa tìm thấy lựa chọn nào thật sự khớp với yêu cầu của bạn lúc này."
`;

const COMPARE_COMPOSER_PROMPT = `
## COMPARE_PLACES

Compare the tagged places as a human travel advisor helping someone choose where to stay.
Use reviews, ratings, location, price/range, amenities, and descriptions as evidence, but output short user-facing Vietnamese strings.

Required output:
- Return raw valid JSON parseable by JSON.parse.
- No Markdown, no code fences, no explanation outside JSON.
- In JSON, place names must be plain text. Do not use [name](place:id).
- Maximum 4 comparisonRows. Each value/note should be at most 12 Vietnamese words.
- summary should be at most 3 Vietnamese sentences. reasons/tradeoffs/bestFor should have at most 3 items each.

Schema:
{
  "type": "place_comparison",
  "status": "ok" | "insufficient_data",
  "title": "string",
  "places": [
    { "id": "place_id", "name": "Place name" }
  ],
  "comparisonRows": [{ "key": "rating|price|location|amenities|reviews|quiet|cleanliness|other", "label": "Vietnamese criterion label", "values": { "place_id": "Short value" }, "notes": { "place_id": "Short evidence note" } }],
  "overallAssessment": {
    "summary": "Overall Vietnamese assessment in 2-3 sentences",
    "recommendedPlaceId": "place_id or null",
    "recommendedPlaceName": "Place name or null",
    "reasons": ["Main reason"],
    "tradeoffs": ["Tradeoff to consider"],
    "bestFor": [{ "placeId": "place_id", "placeName": "Place name", "scenario": "Vietnamese: best when..." }]
  },
  "dataNotes": ["Human-sounding Vietnamese uncertainty note"],
  "followUpQuestion": "Short Vietnamese follow-up question"
}

Content rules:
- If fewer than 2 tagged places are available, return status "insufficient_data", include existing places, leave comparisonRows empty, and ask the user to tag at least 2 places.
- If the user did not specify criteria, use up to 4 default rows: rating, price, location, amenities.
- Only fill what the evidence supports. If a value is unclear, use "Chua ro" and explain briefly in dataNotes/tradeoffs with natural Vietnamese wording.
- Do not invent room quality, service quality, cleanliness, safety, quietness, or pricing.
- recommendedPlaceId may be null if there is not enough evidence for a clear recommendation.
- values and notes must be keyed by the exact place.id from places.
- Any string visible to the user must avoid these terms: system, context, tool, metadata, schema, fallback, database.
- When uncertain, write naturally in Vietnamese, for example: "Mình chưa thấy đủ review để kết luận chắc..." or "Phần giá chưa đủ rõ để so sánh chắc."
`;

const ANALYZE_COMPOSER_PROMPT = `
## ANALYZE_PLACE

Create an insight for exactly one tagged place as a real travel advisor.
Use place information, reviews, start location, nearby points, and user preferences as evidence.
Do not copy raw evidence into a dry list. Convert it into natural Vietnamese advice.

Pre-check:
- If there is not exactly one tagged place, return the JSON schema below with status "insufficient_data", place null, empty or short pros/cons, and an overallAssessment.summary asking the user to tag exactly one place. Do not analyze anything else.

Required output:
- Return raw valid JSON parseable by JSON.parse.
- No Markdown, no code fences, no explanation outside JSON.
- In JSON, names/titles/summaries must be plain text. Do not use [name](place:id).

Schema:
{
  "type": "place_insight",
  "status": "ok" | "insufficient_data",
  "title": "string",
  "location": "string",
  "place": { "id": "place_id", "name": "Place name", "address": "string", "rating": "number or null", "reviewCount": "number or null", "price": "string or null", "amenities": ["string"] } | null,
  "summary": "Vietnamese insight summary in 2-3 sentences for the left panel",
  "pros": ["Short Vietnamese strength with evidence"],
  "cons": ["Short Vietnamese tradeoff with evidence"],
  "safety": "Vietnamese safety/security judgment, or a natural note that you cannot conclude confidently",
  "transportation": "Vietnamese transportation judgment from start/current location",
  "food": "Vietnamese food/cafe nearby judgment, or a natural note that evidence is not strong enough",
  "attractions": "Vietnamese attraction/POI nearby judgment, or a natural note that evidence is not strong enough",
  "suitableFor": "Vietnamese description of the best-fit traveler/trip type",
  "overallAssessment": {
    "summary": "Natural Vietnamese overall analysis in 2-4 sentences for the right chat panel",
    "verdict": "Quick Vietnamese conclusion: choose it if...",
    "reasons": ["Main reason"],
    "tradeoffs": ["Tradeoff"],
    "nextSteps": ["What to verify before booking"]
  },
  "dataNotes": ["Human-sounding Vietnamese uncertainty note"],
  "followUpQuestion": "Short Vietnamese follow-up question"
}

Panel split:
1. The left panel uses summary/pros/cons/safety/transportation/food/attractions/suitableFor.
2. The right chat panel uses overallAssessment and must sound like a real advisor.
3. If nearby places are available, mention only 2-4 useful ones and explain how they help the trip. If nearby evidence is weak, say that briefly and naturally.

Content rules:
- Every claim about quality, cleanliness, quietness, service, safety, or price must be backed by reviews or place information.
- If there is not enough support for a field, write naturally that you cannot conclude confidently yet.
- Prioritize the user's selected criteria/tripPurposes while still covering the required fields.
- Keep the tone practical, close, and human. Avoid emoji-heavy writing.
- Do not create a raw "amenities/features" list. Explain what the amenities mean for the stay experience.
- Do not copy whole reviews. Use only very short fragments when they are necessary as evidence.
- Any string visible to the user must avoid these terms: system, context, tool, metadata, schema, fallback, database.
- When reviews or information are weak, write like: "Mình chưa thấy đủ review để đánh giá chắc về độ yên tĩnh", not "data is missing".
`;

@Injectable()
export class LlmResponseComposerService implements IResponseComposer {
  private readonly logger = new Logger(LlmResponseComposerService.name);
  private readonly maxComposerHistoryMessages = 6;
  private readonly maxComposerHistoryChars = 700;
  private readonly maxTaggedPlaces = 12;
  private readonly maxTaggedPlaceReviews = 6;
  private readonly maxReviewChars = 420;

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
      parts.push(`Current time: ${formatted} (${tz})`);
    } catch {
      parts.push(`Current time: ${now.toISOString()}`);
    }

    // User name
    if (uc.displayName) {
      parts.push(`User display name: ${uc.displayName}`);
    }

    // User location
    if (uc.lat != null && uc.lng != null) {
      parts.push(`Current user location: ${uc.lat.toFixed(4)}, ${uc.lng.toFixed(4)}`);
    }

    // Locale
    if (uc.locale) {
      parts.push(`User locale: ${uc.locale}`);
    }

    if (parts.length === 0) return undefined;

    return `[PRIVATE USER DETAILS - DO NOT MENTION THIS LABEL]\n${parts.join('\n')}\n[END PRIVATE USER DETAILS]\n\nUse these details only to personalize the Vietnamese answer. Use the display name if it feels natural. Use time of day and user location only when they are relevant.`;
  }

  private async buildMessages(context: ComposerContext, history: any[] = []): Promise<ChatMessage[]> {
    const searchResultSummary = context.searchResultContext
      ? JSON.stringify(context.searchResultContext)
      : 'N/A';
    const shouldIncludeRawToolResults = context.workflowId !== 'SEARCH_PLACES' || !context.searchResultContext;
    const rawDataDump = shouldIncludeRawToolResults
      ? JSON.stringify(context.toolResults)
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
    ])).slice(0, this.maxTaggedPlaces);

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
                take: 12,
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
                take: 12,
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
            name: fixturePlace.placeName || fixturePlace.name || fePlace?.name || `Place #${sourcePlaceId}`,
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
            reviews: this.selectRelevantReviews(fixtureReviews, context.userQuery, this.maxTaggedPlaceReviews),
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
            reviews: this.selectRelevantReviews(dbPlace.reviews, context.userQuery, this.maxTaggedPlaceReviews),
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
            name: `Place #${id.slice(0, 8)}`,
            reviews: []
          });
        }
      }
    }

    if (placesInfoList.length > 0) {
      taggedPlacesContext += `\n[PRIVATE PLACE EVIDENCE - DO NOT MENTION THIS LABEL]\n`;
      for (const place of placesInfoList) {
        const coordsStr = (place.latitude && place.longitude) ? ` (Coordinates: ${Number(place.latitude).toFixed(4)}, ${Number(place.longitude).toFixed(4)})` : '';
        const addressStr = place.address ? `, Address: ${place.address}` : '';
        const ratingStr = place.rating ? `${place.rating}/5` : 'N/A';
        const reviewCountStr = typeof place.reviewCount === 'number' ? `, Review count: ${place.reviewCount}` : '';
        const priceStr = place.price ? `, Price/range: ${place.price}` : (typeof place.priceLevel === 'number' ? `, Price level: ${place.priceLevel}` : '');
        const sourceStr = place.source ? `, Source: ${place.source}${place.sourcePlaceId ? `/${place.sourcePlaceId}` : ''}` : '';
        const amenitiesStr = place.amenities?.length ? `\nAmenities/highlights: ${place.amenities.slice(0, 8).join(', ')}\n` : '';
        taggedPlacesContext += `Place: ${place.name} (ID: ${place.id}, Type: ${place.categories?.join(', ') || 'N/A'}, Average rating: ${ratingStr}${reviewCountStr}${priceStr}${sourceStr}${coordsStr}${addressStr})\n${amenitiesStr}`;
        
        if (place.reviews && place.reviews.length > 0) {
          taggedPlacesContext += `Review evidence for synthesis into natural advice:\n`;
          place.reviews.forEach((r, idx) => {
            const source = r.source ? `Source: ${r.source}. ` : '';
            const date = r.date ? `Date: ${r.date}. ` : '';
            taggedPlacesContext += `- [Rating ${r.rating}/5] ${source}${date}${r.reviewText || '(No written review)'}\n`;
          });
        } else {
          taggedPlacesContext += `Evidence note: no strong real review evidence is available for this place.\n`;
        }
        taggedPlacesContext += `\n`;
      }
      taggedPlacesContext += `[END PRIVATE PLACE EVIDENCE]\n\n`;
    }

    const frontendSearchResultsContext = this.buildFrontendSearchResultsContext(context.taggedPlaces || []);
    const insightToolContext = context.workflowId === 'ANALYZE_PLACE'
      ? `
[PRIVATE INSIGHT EVIDENCE - DO NOT MENTION THIS LABEL]
${JSON.stringify(context.toolResults)}
[END PRIVATE INSIGHT EVIDENCE]
`
      : '';

    const contextPrompt = context.workflowId === 'COMPARE_PLACES' || context.workflowId === 'ANALYZE_PLACE'
      ? `
[PRIVATE ROUTING NOTES - DO NOT MENTION THIS LABEL]
Workflow: ${context.workflowId}
Extracted Parameters: ${JSON.stringify(context.parameters)}
[END PRIVATE ROUTING NOTES]
${taggedPlacesContext}
${insightToolContext}
User Query: "${context.userQuery}"

IMPORTANT REMINDERS:
- Use the private evidence above to analyze or compare, but do not mention internal labels.
- For COMPARE_PLACES/ANALYZE_PLACE, if the workflow instruction requires JSON, use plain text names and place_id/id fields. Do not use Markdown place links inside JSON.
- If evidence is weak, write like a real Vietnamese advisor: "mình chưa thấy đủ review/thông tin để kết luận chắc". Do not say "context/data is missing".
- User-visible text must be Vietnamese, friendly, complete, judgment-driven, and not a copy of raw evidence.
`
      : `
[PRIVATE EVIDENCE PACKAGE - DO NOT MENTION THIS LABEL]
Workflow Executed: ${context.workflowId}
Extracted Parameters: ${JSON.stringify(context.parameters)}
Search Result Summary Context:
${searchResultSummary}
Raw Data from Tools:
${rawDataDump}
[END PRIVATE EVIDENCE PACKAGE]
${taggedPlacesContext}
${frontendSearchResultsContext}
User Query: "${context.userQuery}"
Answer like a practical Vietnamese travel assistant. Synthesize the evidence into advice; do not copy raw lines. For search results, explain the main tradeoff before listing places. If the user asks about a specific tagged place, use customer reviews as evidence but convert them into natural analysis.
If evidence is weak or missing, say it naturally: "mình chưa đủ cơ sở để kết luận chắc" or "mình chưa thấy đủ review thực tế", instead of exposing internal data limitations.
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
      const response = await this.llmClient.chat(messages, this.getLlmOptions(context));
      
      return {
        answer: response.content,
      };
    } catch (error: any) {
      this.logger.error(`Composition failed: ${error.message}`);
      return {
        answer: 'Xin lỗi, mình có tìm thấy một số thông tin nhưng chưa thể diễn giải trọn vẹn ngay lúc này. Bạn thử lại giúp mình nhé.',
      };
    }
  }

  async *streamCompose(context: ComposerContext, conversationHistory: any[] = []): AsyncGenerator<string> {
    let yieldedAny = false;
    try {
      const messages = await this.buildMessages(context, conversationHistory);
      
      for await (const chunk of this.llmClient.streamChat(messages, this.getLlmOptions(context))) {
        if (chunk.delta) {
          yieldedAny = true;
          yield chunk.delta;
        }
        if (chunk.finishReason && chunk.finishReason !== 'stop') {
          throw new Error(`LLM stream ended before completion with finishReason: ${chunk.finishReason}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Stream composition failed: ${error.message}`);
      if (!yieldedAny) {
        yield '\n\nXin lỗi, lúc này mình chưa thể viết câu trả lời trọn vẹn. Bạn thử lại giúp mình nhé.';
        return;
      }
      if (context.workflowId !== 'COMPARE_PLACES' && context.workflowId !== 'ANALYZE_PLACE') {
        throw error;
      }
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

  private getLlmOptions(context: ComposerContext): { response_format?: { type: string } } | undefined {
    if (context.workflowId === 'COMPARE_PLACES' || context.workflowId === 'ANALYZE_PLACE') {
      return { response_format: { type: 'json_object' } };
    }

    return undefined;
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
      reviewText: this.truncateCompactText(text, this.maxReviewChars),
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
      .slice(-this.maxComposerHistoryMessages)
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
      .slice(0, 12)
      .map((place) => ({
        id: place.id,
        name: place.name || place.placeName || place.title,
        address: place.address || place.placeAddress || place.displayAddress || '',
        rating: place.rating || place.averageRating || null,
        reviewCount: place.reviewCount || place.reviewsCount || place.userRatingsTotal || null,
        price: place.price || place.priceRange || place.priceText || place.ratePerNight || '',
        amenities: this.extractAmenities(place).slice(0, 6),
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
        place.type ? `Type: ${place.type}` : '',
        place.address ? `Address: ${place.address}` : '',
        place.rating ? `Rating: ${Number(place.rating).toFixed(1)}/5` : '',
        place.reviewCount ? `Review count: ${place.reviewCount}` : '',
        place.price ? `Price/range: ${place.price}` : '',
        place.amenities.length ? `Amenities: ${place.amenities.join(', ')}` : '',
        place.source ? `Source: ${place.source}${place.sourcePlaceId ? `/${place.sourcePlaceId}` : ''}` : '',
        place.lat != null && place.lng != null ? `Coordinates: ${place.lat}, ${place.lng}` : '',
      ].filter(Boolean);

      return parts.join(' | ');
    });

    return `[PRIVATE ACTIVE SEARCH RESULTS - DO NOT MENTION THIS LABEL]\n${lines.join('\n')}\n[END PRIVATE ACTIVE SEARCH RESULTS]\n\nIf the user asks follow-up questions such as "the results you just found", "the results above", or "among these", treat the list above as the active result set for analysis/ranking. When real review evidence is weak, only comment on visible place information and naturally say in Vietnamese that you cannot conclude confidently yet.\n\n`;
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
    return this.truncateCompactText(normalized, this.maxComposerHistoryChars);
  }

  private truncateCompactText(content: string, maxLength: number): string {
    const normalized = String(content || '').replace(/\s+/g, ' ').trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }
}
