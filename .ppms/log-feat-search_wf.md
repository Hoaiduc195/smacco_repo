# Project Changelog

---

## [2026-05-21 21:30] — Robust Link Parsing & Prompt Sync for SerpAPI IDs

- **Branch**: `feat/search_wf`
- **Prompt**: Fix broken chat widget links that reload or point to localhost:3000 by making the embedded links and tagged place IDs consistently utilize the official SerpAPI format IDs instead of database UUIDs, and update frontend parser to intercept various link formats.
- **Changes**:
  - **Backend - Prompt Update**: Modified `groq-response-composer.service.ts` system prompt `PLACE LINKING` rules to explicitly instruct the LLM that place IDs used in markdown links can be either a database UUID or a SerpAPI ID (`serpapi-<id>`), synchronizing backend output IDs with frontend requirements.
  - **Frontend - Robust Link Interception**: Updated the ReactMarkdown custom `a` component inside both `ChatWidget.jsx` and `PlaceChatPanel.jsx` to parse and extract the place ID from multiple formats: `place:<id>` protocol, `/places/<id>` relative paths, or absolute URLs like `http://localhost:3000/places/<id>`. Programmatic SPA navigation using React Router `navigate` is executed for all matching cases, eliminating broken relative page reloads.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Prevents browser-default reloads and broken paths, seamlessly binding diverse AI-generated link layouts to the local React Router instance for unified single-page transitions.

---

## [2026-05-21 21:20] — Optimized SerpAPI Reviews Caching, RAG Non-UUID ID Mapping, & Inline Badges Navigation

- **Branch**: `feat/search_wf`
- **Prompt**: Optimize SerpAPI requests (250/month free tier limit) by dynamically caching Google Reviews, routing place cover images as zero-cost photos, exposing photos API, creating a dynamic CLI config toggle (`npm run config:serpapi`), decoding reviews in the RAG prompt context, mapping non-UUID SerpAPI IDs to cached database records, standardizing RAG output IDs to SerpAPI, and adding full routing navigation support to inline MapPin chat badges.
- **Changes**:
  - **Backend - Caching & Lazy Fetch**: Modified `places.service.ts` to lazy-fetch and cache SerpAPI Google reviews under `source: 'google'`. Encoded reviewer details using prefix `__GOOGLE_REVIEW__::author::date::snippet` inside standard `reviewText` to bypass migration.
  - **Backend - Optimization & Photos endpoint**: Configured default fallback in `findPhotos` to return `[coverImageUrl]` and avoid hitting SerpAPI Photos engine. Added `GET /places/:id/photos` to `places.controller.ts`.
  - **Backend - CLI Config & RAG parse**: Created `config-serpapi.js` script to toggle `hotelSearch`, `photos`, and `reviews` and save them to `serpapi-features.json`. Updated `groq-response-composer.service.ts` to parse `__GOOGLE_REVIEW__::` prefix before feeding to LLM RAG prompt context.
  - **Backend - Non-UUID RAG Resolution**: Added support in `groq-response-composer.service.ts` to lookup tagged places by non-UUID SerpAPI IDs (using source and sourcePlaceId) from PostgreSQL, mapping them correctly to cached database records to feed cached reviews to the LLM.
  - **Backend - Standardize RAG IDs**: Standardized `placesInfoList` to output SerpAPI format IDs (e.g. `serpapi-sourcePlaceId`) instead of database UUIDs, ensuring alignment with frontend MapPin mapping.
  - **Frontend - Details UI & Photos Service**: Updated `PlaceDetailPage.jsx` to render the cover image as the elegant hero background, filter out cached Google reviews (`source === 'google'`) from the community review list, show exact native reviews count, and fetch photos via `/places/:id/photos` on mount. Added `getPlacePhotos` to `placeService.js`.
  - **Frontend - Inline Badges & Navigation**: Integrated `useNavigate` from `react-router-dom` in `ChatWidget.jsx` and `PlaceChatPanel.jsx`, updating the custom `<ReactMarkdown>` inline MapPin click handler to trigger direct route transitions to `/places/:placeId`, eliminating localhost:3000 broken links.
- **Modified files**:
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/modules/places/places.controller.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/services/placeService.js`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
- **Created files**:
  - `backend/scripts/config-serpapi.js`
  - `backend/serpapi-features.json`
- **Deleted files**: —
- **Architecture impact**: Introduces an elegant, zero-cost Google reviews caching pipeline that stores reviews directly inside the relational database. A CLI configuration tool lets operators toggling search features dynamically. The LLM RAG engine automatically decodes cached Google reviews to improve context synthesis.

## [2026-05-21 20:30] — Integrate Pricing and Amenities Details

- **Branch**: `feat/search_wf`
- **Prompt**: Integrate pricing (`price`) and amenities (`amenities`) data from SerpAPI's Google Hotels engine into the search results and place detail pages to elevate the discovery UX.
- **Changes**:
  - **Backend - Interface**: Added optional `price?: string` and `amenities?: string[]` to the `PlaceResult` interface inside `accommodation-provider.interface.ts`.
  - **Backend - SerpAPI Parser**: Updated mapping inside `searchAccommodations` within `serpapi-hotels.service.ts` to parse `price` from `rate_per_night` or `total_rate` or `price` fields, and `amenities` from `p.amenities`.
  - **Frontend - Place Card UI**: Updated `PlaceCard.jsx` to render an elegant green price tag next to ratings and list up to 3 featured amenities badges with a `+X` count indicator.
  - **Frontend - Place Detail UI**: Updated `PlaceDetailPage.jsx` to render the price badge in the main detail header and display a full "Tiện ích nổi bật" section in a clean responsive grid at the bottom of the details section.
- **Modified files**:
  - `backend/src/modules/search/accommodation-provider.interface.ts`
  - `backend/src/modules/search/serpapi-hotels.service.ts`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Minor model extensions on the interface layer, with no alterations required to the persistent relational database schemas.

## [2026-05-21 20:20] — Update SerpAPI URL to Web Standard

- **Branch**: `feat/search_wf`
- **Prompt**: Update SerpAPI endpoint URLs on both frontend and backend from `https://serpapi.com/search.json` to the standard web-documented URL `https://serpapi.com/search`.
- **Changes**:
  - **Backend**: Updated `baseUrl` inside `serpapi-hotels.service.ts` to `https://serpapi.com/search`.
  - **Frontend**: Updated endpoint URL in `serpService.js` to `https://serpapi.com/search`.
- **Modified files**:
  - `backend/src/modules/search/serpapi-hotels.service.ts`
  - `frontend/src/services/serpService.js`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: None. Both base endpoints are fully compatible and automatically serve JSON payloads, perfectly matching the official documentation specifications.

## [2026-05-21 18:55] — Safe Non-UUID Place Metadata Fallback for reviews RAG

- **Branch**: `feat/search_wf`
- **Prompt**: Address backend PostgreSQL crash on non-UUID place IDs (e.g. SerpAPI strings) by plumbing full frontend place metadata payloads. If the place doesn't exist in the DB, gracefully inject basic metadata (name, address, coordinates, and categories) to the LLM instead of crashing on Prisma calls.
- **Changes**:
  - **Backend - TypeScript Fix**: Fixed strict TypeScript parameter compilation error TS7006 in `groq-response-composer.service.ts` by explicitly typing map parameter `r` in `dbPlace.reviews.map` as `any`.
  - **Frontend - API Service**: Updated `chat` and `streamChat` in `aiService.js` to accept and transmit full `taggedPlaces` details.
  - **Frontend - Hooks**: Updated `sendMessage` in `useStreamingChat.js` to accept and pass `taggedPlaces` to `streamChat`.
  - **Frontend - Widgets**: Standardized the mapping of `taggedPlaces` in `ChatWidget.jsx`'s `handleSend` to include coordinates, address, and types before sending to `sendMessage`.
  - **Frontend - Scope Panel**: Integrated safe place detail RAG mapping inside `PlaceChatPanel.jsx`'s `send` function to handle conversational place-scoped AI requests.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `frontend/src/services/aiService.js`
  - `frontend/src/hooks/useStreamingChat.js`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Completes the end-to-end telemetry pipeline of place metadata, enabling robust reviews RAG with zero SQL type errors for search-indexed places not yet stored in the relational database.

## [2026-05-21 18:48] — Interactive Place-Tagging & Reviews RAG Context

- **Branch**: `feat/search_wf`
- **Prompt**: Implement an interactive, premium place-tagging and review-based RAG system: AI place link responses (`[Place Name](place:place_id)`), drag-and-drop tagging, database-backed reviews RAG (15 reviews per tagged place), 3-dots menus with Copy/Delete on saved places, clipboard auto-detection on return to home, and a vertical active tagged places stack floating to the left of the chat.
- **Changes**:
  - **Backend - DTO & Interfaces**: Updated `ChatRequestDto` and `ComposerContext` to support optional `taggedPlaceIds?: string[]`.
  - **Backend - Orchestration**: Enhanced `AiOrchestratorService` to forward the client's `taggedPlaceIds` to response composers.
  - **Backend - Reviews RAG**: Integrated `PrismaService` into `GroqResponseComposerService`. It now fetches up to 15 real customer reviews per tagged place, injects them as an explicit system context block, and forces custom inline link format `[Place Name](place:place_id)` in the prompt instructions.
  - **Backend - Score Comment Cleanup**: Removed redundant "Xếp hạng dựa trên điểm tổng hợp" fallback comment from `recommendations.service.ts` to keep recommendation details concise.
  - **Frontend - Saved Places Actions**: Added a responsive 3-dots actions menu to `PlaceCard.jsx` for saved places containing "Sao chép" (which copies a customized prefix, sets local storage, and fires a custom event) and "Xóa" (unsaving). Added full drag serialization data.
  - **Frontend - API & Hooks**: Updated `aiService.js` and `useStreamingChat.js` to accept and transmit `taggedPlaceIds` parameters during chat stream requests.
  - **Frontend - Inline Badges**: Wired custom ReactMarkdown components in `ChatWidget.jsx` to render custom `place:place_id` URLs as premium interactive inline MapPin badges that can be dragged into the chat widget or clicked to focus details.
  - **Frontend - Active Tags Indicator**: Designed a side-by-side vertical floating list of active tagged place badges directly to the left of the chat window for easy visibility and untagging.
  - **Frontend - Clipboard Sensing & Suggestion**: Built a background listener for `'app:place-copied'` and window focus that detects clipboard states. Renders a bouncing suggestion banner above the closed chat toggle and a clean inline prompt bar above the open chat textarea for one-click place tagging.
- **Modified files**:
  - `backend/src/modules/ai/dto/chat-request.dto.ts`
  - `backend/src/modules/ai/orchestration/composer/response-composer.interface.ts`
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `backend/src/modules/recommendations/recommendations.service.ts`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/services/aiService.js`
  - `frontend/src/hooks/useStreamingChat.js`
  - `frontend/src/components/ChatWidget.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Introduces a high-fidelity, bidirectional interactive place tagging workspace integrated with live database review retrieval (RAG) for personalized Groq chat answers.

## [2026-05-21 18:32] — Refine AI Search Places Workflow (Query Specificity & Multi-Type Selection)

- **Branch**: `feat/search_wf`
- **Prompt**: Improve the automatic Search_places workflow of the AI by retaining specific search queries in the search bar and enabling proper multi-type selection and ticking in the frontend placeType filter dropdown.
- **Changes**:
  - **Backend - Task Routing refinement**: Updated the `ROUTER_SYSTEM_PROMPT` in `GroqTaskRouterService` to preserve user query specificity in the extracted `"query"` parameter (e.g. keeping `"nhà nghỉ gần đà nẵng"` intact rather than simplifying to `"nhà nghỉ"`).
  - **Backend - Option and Type Alignment**: Re-aligned the Task Router's canonical place type options to perfectly match the frontend `Navbar` keys: `hotel`, `hostel`, `homestay`, `apartment`, `resort`, `villa`, `guesthouse`, `motel`, `camping`. Instructed LLM to translate `"nhà nghỉ"` to `"hostel"` and `"nhà khách"` to `"guesthouse"` (without underscore), resolving past mismatches.
  - **Backend - SSE streaming update**: Included the `types` array in the `searchAction` payload under `streamQuery` inside `AiOrchestratorService`, ensuring identical properties for both streaming and non-streaming responses.
  - **Frontend - Split-Trim matching in Navbar**: Updated `Navbar.jsx` to map `.map(t => t.trim())` on comma-separated type lists before checking active selections. This resolves the space discrepancy (e.g., matching `"resort, villa"` into `"villa"`).
  - **Frontend - Clean Type states**: Updated the AI search action event handler in `HomePage.jsx` to trim and map categories before setting the filter states.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/router/groq-task-router.service.ts`
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Aligns the AI's parameter extraction with the frontend UI data models and ensures clean, space-resilient state synchronization across SSE streams and filter menus.
