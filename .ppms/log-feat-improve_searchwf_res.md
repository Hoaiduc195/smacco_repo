# Project Changelog

---

## [2026-05-29 08:43] — Show SerpAPI Hotel Photos In Place Overview

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to integrate SerpAPI Google Hotels Photos API into the place detail page and show photos in the overview tab.
- **Changes**:
  - Checked SerpAPI Google Hotels Photos API documentation and confirmed it uses `GET https://serpapi.com/search` with `engine=google_hotels_photos` and `property_token`.
  - Enabled the existing backend hotel photos integration by setting `photos: true` in `backend/features.json`.
  - Added a photo gallery to the `PlaceDetailPage` overview tab using photos from `/places/:id/media`, with fallback to `coverImageUrl` or `imageUrl`.
  - Kept the UI grounded: when no photos exist, the overview tab shows an explicit empty state instead of mock imagery.
  - Verified frontend compilation with `npm run build` in `frontend/`.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/features.json`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — place overview now renders backend-fetched SerpAPI hotel photos when available.

---

## [2026-05-29 08:38] — Persist SerpAPI Property Details Payloads

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to ensure SerpAPI hotel property details are saved into the database on every detail load.
- **Changes**:
  - Added nullable `rawSerpApiPropertyDetails` and `serpApiPropertyDetailsSyncedAt` fields to the Prisma `Place` model.
  - Added a Prisma migration that stores raw SerpAPI property detail payloads in `places.raw_serpapi_property_details` and records the latest sync time in `places.serpapi_property_details_synced_at`.
  - Updated `PlacesService.persistPropertyDetails` so every successful property detail fetch writes the raw payload, sync timestamp, `updatedAt`, and supported normalized fields back to the place row.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/prisma/schema.prisma`
  - `backend/src/modules/places/places.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**:
  - `backend/prisma/migrations/202605290835_add_serpapi_property_details/migration.sql`
- **Deleted files**: —
- **Architecture impact**: Yes — SerpAPI property details are now persisted as raw JSON plus sync metadata in the place record.

---

## [2026-05-29 08:28] — Add SerpAPI Google Hotels Property Details Fetch

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to verify whether the system calls the SerpAPI Google Hotels Property Details endpoint with the correct JSON/request format to fetch complete hotel detail results.
- **Changes**:
  - Checked SerpAPI documentation and confirmed Google Hotels Property Details uses `GET https://serpapi.com/search` with `engine=google_hotels` and required `property_token`.
  - Confirmed the existing system only called Google Hotels search, photos, and reviews endpoints; it did not call the property details flow.
  - Added `PlacesService.fetchSerpApiPropertyDetails`, using `engine=google_hotels`, `property_token`, `api_key`, `hl=vi`, `gl=vn`, and `currency=VND`.
  - Added property details enrichment to `findOne` for SerpAPI places, mapping name, address, description, website, directions, phone, check-in/out, rates, typical price range, nearby places, amenities, rating, review count, and coordinates.
  - Persisted core detail fields back into `places` where the Prisma schema supports them.
  - Added `propertyDetails: true` to the generalized `backend/features.json` feature config.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/features.json`
  - `backend/src/modules/places/places.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — place detail loading can now call SerpAPI Property Details and return enriched hotel metadata.

---

## [2026-05-28 22:25] — Generalize Features Config and Enable NearbyAmenitiesTool Bypass

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested renaming the SerpAPI feature config file to a general features config and adding a toggle to turn off/on NearbyAmenitiesTool due to frequent Overpass API timeouts.
- **Changes**:
  - Renamed `serpapi-features.json` to a generalized `features.json` configuration file in the backend root.
  - Added a new `"nearbyAmenities": true` flag to `features.json` to control Overpass API execution.
  - Updated `PlacesService` and `SerpApiHotelsService` to load configuration from the renamed `features.json` instead of `serpapi-features.json`.
  - Configured `NearbyAmenitiesTool` to check the `nearbyAmenities` flag before executing. If disabled, it immediately returns a mock response with a placeholder score of `0.5` per place, bypassing slow public Overpass API calls.
  - Replaced the CLI script `config-serpapi.js` with `config-features.js` to allow interactive setup of both SerpAPI features and NearbyAmenitiesTool.
  - Updated the backend script shortcut `config:serpapi` to `config:features` in `package.json`.
  - Verified clean backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/package.json`
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/modules/search/serpapi-hotels.service.ts`
  - `backend/src/common/tools/nearby-amenities.tool.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**:
  - `backend/features.json`
  - `backend/scripts/config-features.js`
- **Deleted files**:
  - `backend/serpapi-features.json`
  - `backend/scripts/config-serpapi.js`
- **Architecture impact**: Yes — renamed feature configuration schema and added Overpass API bypass mode for `NearbyAmenitiesTool`.

---

## [2026-05-28 22:18] — Fix Map Interaction Lock on App Load

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked why they couldn't zoom or pan the map at all when first opening the app.
- **Changes**:
  - Fixed an infinite re-centering/snapping loop caused by the React mount `useEffect` depending on `requestCurrentLocation`. Since `requestCurrentLocation` updates `appState` (transitioning to `FOCUS_CURRENT`), this re-created the callback and triggered the `useEffect` repeatedly, instantly overriding any manual user interactions by re-centering.
  - Restricted the mount `useEffect` in `HomePage.jsx` to run only once by passing an empty dependency array `[]`.
  - Added `setDisableAutoFit(true)` to `handleUserMapInteraction` so manual zoom/pan gestures explicitly stop auto-fitting behaviors.
  - Restored syntax correctness of `ownedPlaceBySource`, `ownedPlacesForMap`, and error handling blocks in `HomePage.jsx` following an automated merge misalignment.
  - Verified clean frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — map interaction lifecycle and state boundaries only.

---

## [2026-05-28 22:12] — Allow Zoom During Routing

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported they could not zoom the map while directions were active.
- **Changes**:
  - Disabled `followUserLocation` and geolocation watch tracking when the app enters routing mode, so the map no longer keeps re-centering itself during navigation.
  - Kept the route polyline and destination selection active, but let the user freely zoom/pan the map while routing is displayed.
  - Updated the current-location button behavior so it no longer re-enables follow tracking while routing is active.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — map interaction behavior only.

---

## [2026-05-28 22:08] — Route Place Detail Directions Back Into Map View

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User wanted directions from place detail to automatically leave the detail page and open the map route view, and also asked that community Q&A always show AI first and pinned before user replies.
- **Changes**:
  - Updated place-detail directions to compute the route and then navigate to `/app` with a `homeState` payload containing the route geometry, current user location, selected place, and routing mode.
  - Preserved existing map state when returning from detail, so route activation lands directly in the main map workspace instead of staying on the detail page.
  - Confirmed the Q&A backend already creates an AI answer immediately on question creation and returns threads with the AI answer separated from user replies, which keeps the AI response first in the thread.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — navigation state and existing Q&A sequencing only.

---

## [2026-05-28 22:02] — Hydrate External Place Placeholder Names

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported the place detail page showed an ID placeholder instead of the real place name.
- **Changes**:
  - Fixed a race where `/places/:id/media` could create a placeholder external place before the frontend sync submitted the real search-result name.
  - Updated `PlacesService.create` so an existing placeholder source record such as `Địa điểm #...` is hydrated with incoming `nameCache`, `addressCache`, coordinates, category, and cover image.
  - Updated `PlaceDetailPage` sync payload to send `placeName/placeAddress` fallbacks as well as `name/address`.
  - Verified backend and frontend compilation with `npm run build` in both `backend/` and `frontend/`.
- **Modified files**:
  - `backend/src/modules/places/places.service.ts`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — external-place placeholder hydration behavior only.

---

## [2026-05-28 22:00] — Restore Place Name For Backend Detail Shape

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported the place name was still missing on the place detail page.
- **Changes**:
  - Added `displayName` and `displayAddress` fallbacks in `PlaceDetailPage` so the UI supports both frontend search-result fields (`name`, `address`) and backend detail fields (`placeName`, `placeAddress`).
  - Updated hero image alt text, hero title, summary strip, overview heading, and address cards to use the normalized display values.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend data-shape fallback only.

---

## [2026-05-28 21:52] — Restore Place Name Visibility And Compact Q&A Composer

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported the place name disappeared, wanted the create-question area collapsed into a trigger that opens a full popup, and requested livelier hover/effects.
- **Changes**:
  - Added a prominent summary strip below the place hero so the place name, address, rating, and price remain visible regardless of hero image contrast.
  - Replaced the always-visible Q&A create-post form with a compact `Đặt câu hỏi` button.
  - Added a full-screen modal composer for creating a community question, preserving the existing question creation API flow.
  - Added subtle hover lift/shadow transitions to the Q&A header, thread cards, voting controls, modal controls, and detail tabs.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend presentation and interaction behavior only.

---

## [2026-05-28 21:49] — Split Place Detail Into Overview, Q&A, And Reviews Tabs

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User said the place detail UI felt misaligned, the always-visible question form would scale poorly with many questions, and requested three tabs: overview, community Q&A, and reviews. User also wanted the overview page to be more detailed.
- **Changes**:
  - Added a tab navigation surface to `PlaceDetailPage` with `Thông tin chung`, `Hỏi đáp cộng đồng`, and `Đánh giá`.
  - Moved the community Q&A surface behind its own tab so the create-question form is not always visible while browsing overview or reviews.
  - Built a richer overview tab with grounded place description, address, rating, opening-hours placeholder, contact placeholder, website, photo count, amenities, onsite confirmation, and embedded route map.
  - Moved review creation and review list rendering into the reviews tab while preserving the existing review create/delete logic.
  - Kept the existing OSRM directions integration available from the overview tab and route map panel.
  - Hid the previous mixed detail layout while the tabbed layout replaces it.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend page organization and presentation only.

---

## [2026-05-28 21:43] — Apply Reddit Layout To Existing Q&A Section

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User clarified that the Reddit-like forum UI should be applied to the existing community Q&A section, not by creating a new forum card on the place detail page.
- **Changes**:
  - Removed the extra Reddit-style discussion card previously added directly to `PlaceDetailPage`.
  - Restyled `QASection` so the existing question form behaves visually like a Reddit create-post card.
  - Restyled existing question threads with a vote rail, `r/smacco_qa` metadata, author/time badges, pinned AI answer area, and indented community replies.
  - Preserved the existing Q&A API flow for creating questions, creating answers, loading threads, and deleting owned questions.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend Q&A presentation only.

---

## [2026-05-28 21:36] — Keep Routing Active When Re-Centering Map

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported that pressing the current-location button while directions are active stops routing, and wanted routing to stop only when pressing the explicit stop button.
- **Changes**:
  - Updated `HomePage` state transitions so entering current-location focus no longer clears the active route.
  - Changed the current-location button behavior to preserve `ROUTING` state when directions are active.
  - Changed map pan/zoom interaction handling so user map movement no longer exits routing mode.
  - Kept `handleStopRouting` as the only UI path that clears the route and exits routing mode.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — map routing interaction behavior only.

---

## [2026-05-28 21:34] — Make Place Detail More Forum-Like And Enable Directions

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User wanted the place detail page to feel more detailed and forum-like, similar to Reddit, remove mock content such as static detail/tip copy, and make directions functional.
- **Changes**:
  - Added a Reddit-style place discussion card with vote controls, subreddit-like metadata, community count, grounded place fields, amenities, and discussion/direction actions.
  - Removed visible mock fallbacks from the detail area by replacing invented description, opening hours, and photo counts with explicit "Đang cập nhật" / real-count states.
  - Hid the old static detail block and travel tips block so the page emphasizes community discussion, Q&A, reviews, onsite status, and map context.
  - Connected the detail-page `Chỉ đường` buttons to the existing OSRM routing service, requesting the user's current location and drawing the route on the embedded Mapbox map.
  - Added route distance/duration display and error feedback for missing coordinates, denied geolocation, or routing failures.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend page layout and existing routing-service integration only.

---

## [2026-05-28 21:28] — Align Place Detail Hero Back Button

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported the place detail background image looked shifted downward, likely because of the back-to-map button.
- **Changes**:
  - Moved the `Quay lại bản đồ` action from a separate block above the hero into an absolute overlay inside the hero image.
  - Kept the button visible with a translucent white surface and backdrop blur, without adding vertical layout height above the image.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — place detail presentation/layout only.

---

## [2026-05-28 21:23] — Improve LLM Chat History Context

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to verify whether the LLM receives chat history because follow-up context seemed weak.
- **Changes**:
  - Confirmed the composer already received conversation history, but the Groq task router ignored it when classifying follow-up requests.
  - Updated the Groq task router to include the last 6 user/assistant messages as compact context, so follow-up references can influence workflow routing and parameter extraction.
  - Added compact history formatting in the response composer: last 10 messages only, long messages truncated, and legacy place-chat wrapper prompts stripped before sending to Groq.
  - Persisted the user message at the start of each chat request/stream so interrupted streams do not silently lose the user's turn.
  - Added backend validation that ignores non-UUID `conversationId` values and creates a fresh conversation instead of corrupting or failing persistence.
  - Changed `PlaceChatPanel` so place-specific chat no longer uses `place.id` as the conversation ID and no longer stores an English prompt wrapper as the user's message.
  - Verified backend and frontend compilation with `npm run build` in both `backend/` and `frontend/`.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
  - `backend/src/modules/ai/orchestration/router/groq-task-router.service.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — chat routing, response composition, and persistence now share a cleaner bounded conversation-history contract.

---

## [2026-05-28 21:42] — Render Chat Messages Optimistically Before AI Response

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported that after sending a message to AI, the user message disappeared until the AI response arrived, instead of behaving like a normal chat.
- **Changes**:
  - Updated `useStreamingChat` to flush the optimistic user message, empty assistant bubble, cleared input, and streaming state before starting the SSE request.
  - Prevented `ChatWidget` conversation-history effects from reloading and overwriting optimistic local messages while a response is streaming.
  - Added an inline "Đang suy nghĩ..." loading state inside empty assistant bubbles for both the global chat widget and place-specific chat panel.
  - Verified frontend compilation with `npm run build` in `frontend/`.
- **Modified files**:
  - `frontend/src/hooks/useStreamingChat.js`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — chat UI state/rendering behavior only.

---

## [2026-05-28 21:34] — Let Composer Infer User Criteria From Search Query

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked whether the LLM can receive the user's request and infer which criteria matter, then evaluate results based on `SearchResultContext`.
- **Changes**:
  - Updated search result context guidance so the composer infers user criteria from the original query and parsed intent before answering.
  - Updated the Groq composer prompt to silently infer criteria such as proximity, budget, type, amenities, ambience, rating, or review count from the user's wording.
  - Required search answers to order their reasoning by inferred user criteria, while still staying grounded in `SearchResultContext`.
  - Added explicit fallback behavior: if context lacks evidence for a criterion the user cares about, the answer should say that data is not well covered instead of guessing.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/composer/search-result-context.builder.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — response-composition prompt behavior only.

---

## [2026-05-28 21:27] — Prioritize User Intent In Search Result Answers

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User showed an AI search answer for "nhà nghỉ gần trung tâm thành phố Hồ Chí Minh" that over-emphasized nearby amenities instead of proximity to the requested center.
- **Changes**:
  - Added `distanceKm` and `anchorLabel` to ranked place outputs when proximity scoring is available.
  - Added `priorityCriteria` to `SearchResultContextBuilder` so the composer knows whether the user's main intent is proximity, budget, or general fit.
  - Updated search answer guidance so proximity queries must discuss distance/location first and treat amenities as secondary evidence.
  - Strengthened the composer prompt to avoid using "xung quanh có N tiện ích" as the main reason when the user asked for places near a target location.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/src/modules/recommendations/recommendations.service.ts`
  - `backend/src/modules/ai/orchestration/composer/search-result-context.builder.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — response synthesis and ranking metadata only.

---

## [2026-05-28 21:18] — Guard Google Review Cache Refresh From User Reviews

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to verify that the 90-day `review.createdAt` TTL does not accidentally target user reviews.
- **Changes**:
  - Confirmed TTL lookup was already scoped to `source: google`, so normal user reviews were not used for the refresh timestamp.
  - Added an extra safety guard requiring `reviewText` to start with the internal `__GOOGLE_REVIEW__::` prefix for Google review TTL lookup, deletion, and AI-context retrieval.
  - Centralized the Google review prefix in `PlacesService` so cache writes and reads use the same marker.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/src/modules/places/places.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — data safety guard for cached Google reviews only.

---

## [2026-05-28 21:12] — Use Google Reviews As Hidden AI Context Only

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User decided not to show Google reviews in the product UI, but wanted cached Google reviews to improve AI answers on place detail pages with one controlled SerpAPI request and a 3-month refresh window.
- **Changes**:
  - Changed `PlacesService.findReviews` so public review/media endpoints exclude `source: google` reviews, keeping Google reviews out of the visible detail UI.
  - Added `PlacesService.ensureGoogleReviewsForAiContext`, which refreshes cached Google reviews only when missing or older than 90 days.
  - Limited SerpAPI review caching to the first response page and at most 10 reviews to keep each refresh to one SerpAPI request.
  - Updated the Groq response composer to call the AI-only review cache path for tagged place context before answering place-detail questions.
  - Added lightweight retrieval over cached reviews so the composer sends only the 10 most relevant reviews for the user's current question.
  - Strengthened composer instructions so the LLM must avoid hallucinating and say it does not have enough information when review evidence is weak or missing.
  - Added frontend defense in `PlaceDetailPage` so Google reviews are filtered from visible community review counts and lists even if returned accidentally.
  - Registered `PlacesModule` in `AiModule` so the composer can access the AI-only review cache helper.
  - Verified backend and frontend compilation with `npm run build` in both `backend/` and `frontend/`.
- **Modified files**:
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `backend/src/modules/ai/ai.module.ts`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — Google reviews are now hidden AI context with TTL-based SerpAPI refresh rather than user-visible review content.

---

## [2026-05-28 21:00] — Show SerpAPI Google Reviews On Place Detail

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User enabled SerpAPI reviews but still did not see reviews on the place detail page.
- **Changes**:
  - Enabled SerpAPI review fetching in `backend/serpapi-features.json`.
  - Updated `PlaceDetailPage` so Google-sourced reviews are included in the review count and rendered in the review list instead of being filtered out.
  - Updated the SerpAPI hotel provider to prefer `property_token` over `property_id`, because hotel review/photo endpoints use `property_token`.
  - Verified backend and frontend compilation with `npm run build` in both `backend/` and `frontend/`.
- **Modified files**:
  - `backend/serpapi-features.json`
  - `backend/src/modules/search/serpapi-hotels.service.ts`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — external Google reviews from SerpAPI are now enabled and visible in the detail review surface.

---

## [2026-05-28 20:51] — Omit Raw Search Tool Dumps From Groq Composer

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to optimize the current Groq pipeline for rate limits by avoiding duplicated search context.
- **Changes**:
  - Updated the Groq response composer to omit raw `toolResults` for `SEARCH_PLACES` when `searchResultContext` is available.
  - Kept raw tool dumps available for non-search workflows and as a fallback if a search summary is not present.
  - This reduces composer prompt size because search answers now rely on the compact summary context instead of both summary and full raw result payloads.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — Groq composer prompt construction now uses compact search summaries as the primary evidence payload for search workflows.

---

## [2026-05-28 20:43] — Add Search Result Summary Context For LLM Answers

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User wanted the LLM to answer search results more visually and objectively by receiving more context about returned places.
- **Changes**:
  - Added `SearchResultContextBuilder` to convert raw place results into a concise summary for the response composer.
  - The summary includes user intent, total result count, rating/review/price/amenity coverage, source counts, limitations, and the top 5 place candidates with evidence fields.
  - Updated `AiOrchestratorService` to build and pass this summary context for both normal chat and streaming chat search workflows.
  - Updated the composer interface to accept optional `searchResultContext`.
  - Revised the Groq response composer prompt so search answers start with an objective overview, highlight 3-5 useful suggestions, and explicitly mention missing data instead of overclaiming.
  - Registered the new builder in `AiModule`.
  - Verified backend compilation with `npm run build` in `backend/`.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/composer/search-result-context.builder.ts`
  - `backend/src/modules/ai/orchestration/composer/response-composer.interface.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
  - `backend/src/modules/ai/ai.module.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**:
  - `backend/src/modules/ai/orchestration/composer/search-result-context.builder.ts`
- **Deleted files**: —
- **Architecture impact**: Yes — AI search responses now use a structured result-summary layer between workflow execution and LLM composition.

---

## [2026-05-28 20:30] — Normalize Search Workflow Inputs And Reduce External Search Calls

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to inspect the current `search_places` autoworkflow for ways to save SerpAPI requests and improve parsing/output accuracy.
- **Changes**:
  - Updated `SearchService` to stop appending `type` and `location` onto an already parsed natural-language query, which removes duplicate tokens from external provider searches.
  - Added support for multi-type queries end-to-end by normalizing comma-separated `type` values and `types[]` arrays before DB filtering and provider execution.
  - Changed `PlacesService.findAll` to use `hasSome` when multiple accommodation types are requested, so DB search now matches user intent for queries like `resort hoặc villa`.
  - Made the SerpAPI provider call conditional: the backend now skips external provider search when the local DB already returns enough usable results, reducing unnecessary external requests.
  - Added deterministic router normalization for query, budget, type, location, and anchor fields so malformed or incomplete LLM output is repaired before the workflow runs.
  - Extended the shared search parameter contract so the workflow can pass `types[]` through the tool layer without type errors.
- **Modified files**:
  - `backend/src/modules/search/search.service.ts`
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/common/tools/search-places.tool.ts`
  - `backend/src/modules/search/accommodation-provider.interface.ts`
  - `backend/src/modules/ai/orchestration/router/groq-task-router.service.ts`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — the search autoworkflow now supports multi-type intent cleanly, repairs malformed router output deterministically, and avoids external SerpAPI calls when internal coverage is sufficient.

---

## [2026-05-27 21:26] — Enrich Search Result Cards

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked for more useful information to be shown on search result place cards.
- **Changes**:
  - Forwarded additional backend fields into the frontend search result mapping, including `price`, `amenities`, `userRatingsTotal`, `imageUrl`, and `source`.
  - Updated `PlaceCard.jsx` to show review count, source badge, and estimated distance from the current user location when available.
  - Removed the hard fallback that forced missing place types to render as `hotel`, replacing it with a safer `default` fallback.
  - Preserved the existing thumbnail, rating, price, amenities, and review snippet behavior.
- **Modified files**:
  - `frontend/src/services/placeService.js`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
  - `.ppms/architecture-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — result-card presentation and result mapping only.

---

## [2026-05-27 21:03] — Render Search Result Images In Cards

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported that fetched images were still not visible on search results.
- **Changes**:
  - Updated `PlaceCard.jsx` to render the `imageUrl` prop as the card thumbnail when available.
  - Kept the existing icon fallback for places that do not yet have an image.
  - Added lazy loading and a subtle hover zoom to the thumbnail so the card stays lightweight and responsive.
- **Modified files**:
  - `frontend/src/components/PlaceCard.jsx`
  - `.ppms/log-feat-improve_searchwf_res.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only correction.

---

## [2026-05-27 20:48] — Split List Images From Detail Media

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User clarified that the result list should avoid wasting API requests, but the detail view can use a combined endpoint.
- **Changes**:
  - Added a backend `GET /places/:id/media` endpoint that returns both photos and reviews in one response for detail views.
  - Updated `PlaceDetailPage.jsx` to fetch combined media once and populate both `photos` and `reviews` from that backend response.
  - Kept `GET /places/:id/photos` and `GET /places/:id/reviews` intact for single-purpose callers.
  - Changed the home map result list to hydrate images only, then lazily fetch reviews only when a specific place is selected for the sidebar detail panel.
  - Updated `PlaceCard.jsx` so the secondary text can fall back to the place description when no reviews are preloaded.
- **Modified files**:
  - `backend/src/modules/places/places.controller.ts`
  - `backend/src/modules/places/places.service.ts`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/services/placeService.js`
  - `frontend/src/components/PlaceCard.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — the frontend now distinguishes between image-only list hydration and combined media loading for detail views.

---

## [2026-05-27 20:40] — Move SerpAPI Usage To Backend Only

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to synchronize SerpAPI so it only runs on the backend.
- **Changes**:
  - Replaced the frontend SerpAPI image fetch with a backend API call to `GET /places/:id/photos` via the shared `apiClient`.
  - Updated `HomePage.jsx` to pass `place.id` into the image hydration helper so the backend can resolve photos centrally.
  - Removed `VITE_SERP_API_KEY` from `frontend/.env.example` and `frontend/.env` so the client no longer depends on a direct SerpAPI key.
  - Kept all SerpAPI credential usage in the backend via `SERPAPI_API_KEY` and the existing `PlacesService` photo/review flow.
- **Modified files**:
  - `frontend/src/services/serpService.js`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/.env.example`
  - `frontend/.env`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — the frontend no longer talks to SerpAPI directly; SerpAPI is now backend-only.

---

## [2026-05-27 20:13] — Add Hover Interactions To Landing Page

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested hover effects on the landing page.
- **Changes**:
  - Added reusable hover utility classes in `index.css` for lift and glow interactions.
  - Applied hover motion to landing page navigation, hero CTAs, trust chips, feature cards, workflow cards, prompt demo buttons, testimonials, FAQ entries, auth summary cards, and footer links.
  - Added a subtle animated hover treatment to the hero map illustration elements so the preview feels more alive without becoming distracting.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only update.

---

## [2026-05-27 20:01] — Snap Current Location To Fixed Zoom

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested that pressing the current-location button should always zoom the map to a chosen level.
- **Changes**:
  - Extended the map focus helper in `HomePage.jsx` with metadata so current-location centering can be identified separately from normal place focus.
  - Marked both the one-time geolocation jump and the continuous watch-position updates as `current-location` focus events.
  - Updated `MapComponent.jsx` to reset the follow-zoom latch when the focus target comes from current location, so Mapbox always snaps to the fixed zoom instead of keeping a prior zoom level.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — interaction behavior only.

---

## [2026-05-27 20:01] — Smooth Map Filter Close Animation

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported a slight glitch when turning off the filter on the Mapbox frontend page.
- **Changes**:
  - Updated the advanced filter popover in `Navbar.jsx` to animate its closed state with `opacity` plus `transform`, instead of snapping on `visibility`.
  - Switched the filter toggle button to a functional state update so the open/close transition is more robust.
  - Deferred the "Áp dụng bộ lọc" search trigger by one animation frame so the close animation starts before any search work can re-render the page.
  - Replaced the `map.resize()` invalidation in `MapComponent.jsx` with `map.triggerRepaint()` so sidebar/filter state changes do not force an expensive Mapbox resize and create a small hitch.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — interaction smoothness and rendering behavior only.

---

## [2026-05-27 16:28] — Reposition Sidebar Open Button Further Down

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to make the sidebar trigger button go even lower down the screen.
- **Changes**:
  - Shifted the vertical position of the rounded capsule sidebar open button in `SidebarOverlay.jsx` significantly lower down the left screen edge.
  - Positioned it at `top-64` (256px from top) on desktop and `top-72` (288px from top) on mobile.
  - This keeps the open trigger tab perfectly clear of top panels and ideally balanced inside the viewport vertical spacing.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout adjustment only.

---

## [2026-05-27 16:21] — Rounded Capsule Sidebar Open Button with Lower Positioning

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User clarified they wanted the sidebar open trigger button to be rounded (bo tròn) and positioned lower down (nằm xuống 1 tí).
- **Changes**:
  - Re-designed the sidebar open trigger button in `SidebarOverlay.jsx` to be a sleek half-capsule/rounded tab pointing right using the native `rounded-r-full` Tailwind class, removing the polygon clip-path completely.
  - Positioned the button lower down the left viewport edge (`top-32` = 128px on desktop and `top-36` = 144px on mobile) to keep it perfectly clear of other UI controls and extremely comfortable to access.
  - Centered a sharp white `ChevronRight` icon (`w-4 h-4`) inside this slim rounded capsule.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout refinement only.

---

## [2026-05-27 16:18] — Slim Down Triangular Sidebar Trigger Button

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to make the sidebar trigger button slimmer.
- **Changes**:
  - Reduced the width of the triangular open trigger button in `SidebarOverlay.jsx` from `w-8` (32px) to an ultra-sleek `w-5` (20px).
  - Scaled down the internal `ChevronRight` icon size to `w-3.5 h-3.5` (14px) and set its left padding to `pl-0.5` (2px) to center it beautifully inside the slimmer triangle base without clipping.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout refinement only.

---

## [2026-05-27 16:17] — Re-theme Chatbox to Premium Black-and-White Palette

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to change the chatbox primary color to black, make the main chat container/background white, color user messages green, and make AI responses black.
- **Changes**:
  - Re-themed both `ChatWidget.jsx` and `PlaceChatPanel.jsx` to share a unified premium black-and-white visual identity.
  - Made the header elements of the chatbox pitch black (`bg-ink-900`) with high-contrast white text, primary-300 subheadings, and white translucent hover buttons.
  - Set the main scrollable chat history area to pure white (`bg-white`).
  - Styled user message bubbles with the green brand color (`bg-primary-600 text-white`).
  - Re-styled the AI's response bubbles to be pitch black (`bg-ink-900 text-white border-ink-900`) with the Tailwind `prose-invert` utility for high-definition text rendering.
  - Configured markdown hyperlinks inside the dark AI bubbles to a light green color (`text-primary-400 font-semibold`) for legibility.
  - Changed the closed state of the floating chatbot button in `ChatWidget.jsx` to black (`bg-ink-900 hover:bg-ink-800 border-ink-900`).
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — theme and styling enhancement only.

---

## [2026-05-27 16:11] — Scale Down User Menu Button for Balanced Navbar Sizing

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to adjust the personal page button size to be appropriate for the current navbar.
- **Changes**:
  - Reduced the personal page button height in `Navbar.jsx` to a sleek `h-10` (40px) and width to `w-10 sm:w-52` (matching `40px` on mobile and `208px` on desktop).
  - Scaled down the inner profile image and Google G icon fallback to `w-7 h-7` (28px).
  - Changed the username text font to `text-xs font-bold` to keep it compact and visually aligned inside the slimmed-down button.
  - This results in a perfect vertical gap of `12px` top/bottom inside the `64px` height navbar, looking extremely elegant, clean, and balanced.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout refinement only.

---

## [2026-05-27 15:56] — Custom Triangular Black Sidebar Trigger Button

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to change the sidebar opening button to a triangle shape and colored black.
- **Changes**:
  - Imported `ChevronRight` in `SidebarOverlay.jsx` to replace the double chevrons for cleaner spacing.
  - Re-designed the sidebar open trigger button (visible when sidebar is closed) from a white rectangle to an elegant right-pointing black triangle (`bg-ink-900`, `style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}`).
  - Styled the button to light up in brand green (`hover:bg-primary-600`) when hovered, with a single sharp white `ChevronRight` icon centered at its base, creating an extremely premium, play-button-like visual affordance at the left viewport edge.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout only.

---

## [2026-05-27 15:54] — Style Landing Page Navbar to Premium Dark Theme

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to change the landing page navbar to black too.
- **Changes**:
  - Re-styled the `<header>` element in `LandingPage.jsx` to a premium semi-transparent dark black theme (`bg-ink-900/90`, `border-ink-900`, `shadow-soft`, `backdrop-blur-2xl`).
  - Unified the landing page logo with the updated app navbar: removed the square background box wrapper, rendered the favicon directly with hover scaling, and colored the logo title and subtitle to high-contrast `text-white` and `text-white/70`.
  - Re-themed the inline navigation links of the landing page navbar to float elegantly on the dark backdrop, using custom `text-slate-300 transition hover:bg-ink-800 hover:text-white` styling.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual theme consistency only.

---

## [2026-05-27 15:53] — Match Dropdown Width with Personal Page Button Sizing

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to adjust the personal page button so that its dropdown popup is the same size/width as the button itself.
- **Changes**:
  - Configured the personal page button in `Navbar.jsx` with a fixed width of `w-52` (208px) on desktop screens (`sm:w-52`) and standard responsive sizing on mobile.
  - Set the dropdown popup container's width to `sm:w-full` so it stretches dynamically to perfectly match the `w-52` width of the parent button on desktop.
  - Enabled smooth text truncation on the username with `truncate flex-1 text-left` to ensure longer usernames are rendered elegantly without disrupting the fixed layout size.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout coordination only.

---

## [2026-05-27 15:52] — Integrate Google Icon / User Avatar in Personal Page Button

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to make the icon inside the personal page button a Google icon.
- **Changes**:
  - Modified `Navbar.jsx` to render the user's Google profile avatar (`photoURL`) inside the white user menu trigger button, if available.
  - Implemented the official high-definition colorful Google "G" logo SVG as the fallback icon when no user profile picture is loaded.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual profile layout refinement only.

---

## [2026-05-27 15:50] — Refine Logo, Branding Subtitle, and User Menu Trigger Styling

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to turn the branding subtitle text under "Smacco" to white, remove the square container around the logo icon, and change the user profile/personal page button to white.
- **Changes**:
  - Modified `Navbar.jsx` to render the Mapbox/Smacco favicon directly as a clean `w-8 h-8` image with a sleek `hover:scale-105` interaction, removing the square enclosing box.
  - Changed the branding subtitle "Tìm lưu trú bằng AI" text class from the dark primary tone to `text-white/70`, ensuring high visibility and premium contrast on the black navbar.
  - Redesigned the User Menu trigger button from a dark background to an elegant light/white background theme (`bg-white`, `border-base-200`, `text-slate-900`) with matching internal avatar styling (`bg-primary-50`, `text-primary-900`), adding sharp high-end contrast to the dark navbar.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual styling refinement only.

---

## [2026-05-27 15:48] — Center and Compact Search Bar to Eliminate Overlaps

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to align the search bar position so that when search, sidebar, and chatbox are simultaneously open, none of them overlap each other.
- **Changes**:
  - Re-positioned the search bar container in `Navbar.jsx` to be centered horizontally using the Tailwind class `mx-auto` (replacing `md:ml-auto lg:ml-auto` which pushed it to the right).
  - Compacted the search bar container's max width using `max-w-md xl:max-w-lg` (448px - 512px).
  - This guarantees that on standard desktop screens (>=1280px), the search input and its advanced filter dropdown will occupy the central gap of the screen, completely avoiding overlaps with the left-aligned `SidebarOverlay` (width ~384px) and right-aligned chat widgets (width ~384px).
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual responsive centering layout only.

---

## [2026-05-27 15:46] — Remove Map Controls and Mapbox Logos/Attribution

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to completely remove the map navigation controls (+ and - zoom buttons) and any bottom elements like the Mapbox logo/attribution.
- **Changes**:
  - Removed standard `mapboxgl.NavigationControl` and `mapboxgl.AttributionControl` creation inside `MapComponent.jsx` so that no zoom buttons or default attribution widget is added to the map element.
  - Added CSS overrides in `index.css` targeting `.mapboxgl-ctrl-logo` and `.mapboxgl-ctrl-attrib` with `display: none !important` to cleanly hide all Mapbox watermark logos, links, and text containers.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual mapping layout optimization only.

---

## [2026-05-27 15:43] — Restore Standard Font Sizing and Element Scale

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to make ONLY the Smacco logo icon box and navbar height smaller, reverting the accidental shrinkages of other texts, categories, and elements.
- **Changes**:
  - Restored the brand "Smacco" logo text size in `Navbar.jsx` from `text-base` back to its original `text-lg` size.
  - Standardized the Smacco logo image class size from the invalid `w-5.5` to a proper standard Tailwind size `w-6 h-6`.
  - Restored font sizes in `PlaceChatPanel.jsx` (place name from `text-sm font-black` back to `text-base font-bold`, category label from `text-[11px]` to `text-sm font-semibold`, and welcome helper text to `text-sm`).
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — bugfix and sizing restoration only.

---

## [2026-05-27 15:32] — Scale Down Navbar Elements for Sleek Alignment

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to make the icons/elements smaller to prevent the navbar from bulging.
- **Changes**:
  - Scaled down the logo box size from `w-11 h-11` (44px) to `w-9 h-9` (36px), and its inner logo icon from `w-7` to `w-5.5` (22px).
  - Shrank the search input bar height from `h-12` (48px) to a super compact `h-10` (40px) and adjusted padding, input text size, and the search icon (`w-4` = 16px).
  - Reduced the Advanced Filters toggle trigger button padding (`p-1`) and icon size (`w-3.5`).
  - Scaled down the right-side User Profile trigger button vertical padding (`py-1.5`) and user circular letter avatar size from `w-9` (36px) to a sleek `w-7` (28px) with `text-xs font-black` initials.
  - Verified that all components build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout optimization only.

---

## [2026-05-27 15:30] — Revert Popover Dropdown Menus to Light Theme

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User clarified that only the navbar itself should be black, and all dropdown popovers (filters and profile) should remain white/light.
- **Changes**:
  - Reverted the Advanced Filters dropdown and the Account User dropdown in `Navbar.jsx` to their original elegant light-themed (`map-surface`, `bg-white`, `border-base-200`) layouts.
  - Retained the high-end dark styling on the main horizontal navbar strip and user menu trigger button.
  - Verified that all components build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — theme adjustment only.

---

## [2026-05-27 15:28] — Redesign Navbar to Dark Black Theme

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to change the Navbar to black completely.
- **Changes**:
  - Rebuilt the entire `Navbar.jsx` to use a premium, pitch-black color palette (`bg-ink-900` with `border-ink-900`).
  - Styled all interior branding elements (Logo text to `text-white`, subtitle to `text-primary-400`).
  - Created a gorgeous dark-themed search input field (`bg-ink-950/80`, `border-ink-700`, `text-white` with a `text-ink-500` search icon).
  - Replaced the light Advanced Filters dropdown menu with a complete dark mode popover (`bg-ink-900`, `border-ink-700`, dark location inputs, dark category selectors, and dark budget slider layouts).
  - Redesigned the right-side User Profile trigger button (`bg-ink-950/70`, `border-ink-750`) and its interior circular letter avatar (`bg-primary-900`, `text-primary-200`, `border-primary-800`), as well as the account popover list options to match the black theme.
  - Verified that all components compile successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — theme and styling enhancement only.

---

## [2026-05-27 15:23] — Optimize Map Page Layout and Apply Unified Brand Theme

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to unify the green theme colors on the map page and resolve the overlapping issues when search filters, chatbox, and sidebar are simultaneously open.
- **Changes**:
  - Relocated the place-specific `PlaceChatPanel` below the 80px Navbar (`top-24 sm:top-[90px] bottom-3 sm:bottom-4`) and styled it with premium rounded corners, base panel surfaces, and shadow cards.
  - Implemented custom event-driven responsive alignment in `ChatWidget` and `PlaceChatPanel`. When `PlaceChatPanel` is open, `ChatWidget` shifts dynamically to `right-[416px]` on desktop to align side-by-side, and hides completely on mobile to eliminate overlap.
  - Cleansed `ChatWidget.jsx` and `PlaceChatPanel.jsx` of all non-brand colors (cyan, blue, indigo), converting them fully to `primary` (green) and `accent` (orange) Tailwind classes.
  - Verified the changes build successfully.
- **Modified files**:
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout optimization and theme unification only.

---

## [2026-05-27 15:18] — Elevate Landing Page Logged-In User Interface

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to make the "already signed in" section at the bottom of the landing page look more premium and less simple.
- **Changes**:
  - Replaced the simple textual logged-in block with a modern user card dashboard layout.
  - Implemented smart avatar detection (using Google photoURL if present, falling back to a stylish gradient avatar with the user's initial).
  - Added a "Thành viên Smacco" member status badge with warm accents and a Sparkles icon.
  - Added mock integration indicators for the interactive map workspace ("Bản đồ tương tác - Sẵn sàng") and the AI chat assistant ("Trợ lý tìm kiếm - Trực tuyến").
  - Bound the `logout` function from `AuthContext` to a sleek secondary "Đăng xuất" button to allow users to sign out directly from the landing page.
  - Verified that the application compiles cleanly.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual enhancement and direct logout button linkage.

---

## [2026-05-27 15:15] — Translate Landing Page to Vietnamese

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested to translate the landing page to professional, natural Vietnamese, avoiding generic AI-sounding words.
- **Changes**:
  - Translated all labels, proof items, benefits, workflows, testimonials, faqs, mock places, login fields, error messages, and descriptions in `LandingPage.jsx` into professional, high-end Vietnamese.
  - Avoided typical mechanical machine-translation and AI-sounding terms, ensuring human-like copywriting suited for a premium SaaS product.
  - Verified the changes compile successfully by running a complete production build.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — localization and copywriting update only.

---

## [2026-05-27 15:07] — Remove Landing Pricing and Map Glass Effects

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User asked to remove pricing from the landing page and remove all glassmorphism effects from the map page while keeping the defined theme.
- **Changes**:
  - Removed the pricing nav item, pricing data, and pricing section from the landing page.
  - Added a solid `map-surface` utility for map workspace panels.
  - Replaced glass/translucent map workspace surfaces with solid theme surfaces in the app navbar, filters dropdown, user menu, sidebar, result cards, home map panels, chat widget, map overlay, and map popups.
  - Removed `backdrop-blur`, `surface-panel`, and translucent `bg-white/[opacity]` classes from map-related components.
  - Verified the landing page no longer contains Pricing and reran the frontend build.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — landing content structure changed and the map workspace styling convention changed from frosted glass to solid theme surfaces.

---

## [2026-05-27 14:45] — Redesign Landing and Shared Accommodation Theme

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested a premium SaaS-style landing page inspired by withbobbin.com, adapted to an AI-powered accommodation booking/search product, with shared Tailwind theme tokens and consistent styling across landing, auth, dashboard/search, detail, profile, forms, modals, map popups, and states.
- **Changes**:
  - Added reusable Tailwind tokens for warm base colors, primary/accent colors, typography, larger radii, spacing, and shadow scales.
  - Added global component classes for sections, cards, glass panels, buttons, inputs, badges, and headings.
  - Rebuilt the public landing page with SaaS nav, hero, product mockup, social proof, features, alternating content sections, workflow, prompt demo, trust/security, testimonials, pricing, FAQ, sign-in CTA, and footer.
  - Applied the same visual language to login, app navbar/search filters, sidebar surfaces, accommodation cards, home search states, place detail surfaces, profile page, Q&A cards/forms, tag modal, map popups, chat widget opacity classes, and protected-route loading.
  - Changed `AuthProvider` so public routes render immediately while protected routes still guard on Firebase auth loading.
  - Ran the frontend build and browser screenshot checks for landing and login pages.
- **Modified files**:
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/pages/LoginPage.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/pages/ProfilePage.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/src/components/QASection.jsx`
  - `frontend/src/components/TagPlaceModal.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/ProtectedRoute.jsx`
  - `frontend/src/contexts/AuthContext.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — introduced a reusable frontend theme system and changed public/protected auth rendering behavior.

---

## [2026-05-27 07:15] — Fix Frosted Background Classes for Filter and Account

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported search filter and account surfaces looked fully transparent and text was hard to read.
- **Changes**:
  - Replaced non-standard `bg-white/86` opacity classes with Tailwind arbitrary opacity `bg-white/[0.86]` for reliable CSS generation.
  - Applied the fix to sidebar panel/body, search filter dropdown, account button, and account dropdown.
  - Kept `ChatWidget` unchanged.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual CSS class correction only.

---

## [2026-05-27 07:08] — Match Non-Chat Surfaces to Chatbox Frosted Style

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User said the near-solid opacity removed the frosted glass effect and requested matching the chatbox style without changing the chatbox.
- **Changes**:
  - Reverted sidebar panel/body to chatbox-like `bg-white/86`, `border-white/70`, and blur styling.
  - Reverted search filter dropdown to chatbox-like `bg-white/86`, `border-white/70`.
  - Reverted account button/dropdown to the same frosted style.
  - Did not modify `ChatWidget`.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 07:05] — Equalize Filter, Sidebar, and Account Surface Opacity

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User said search filters, sidebar, and personal/account controls still have different opacity and the account button is too transparent.
- **Changes**:
  - Set sidebar panel and body to `bg-white/[0.98]`.
  - Set search filter dropdown to `bg-white/[0.98]`.
  - Set account button and account dropdown to `bg-white/[0.98]`.
  - Matched the main borders to `border-white/90` for these surfaces.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 07:01] — Match Sidebar, Search Filter, and Account Opacity

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported sidebar briefly appears transparent before becoming opaque, and search filter/account controls remain too transparent.
- **Changes**:
  - Removed opacity animation from sidebar open/close so it does not fade from transparent to opaque.
  - Increased sidebar panel/body opacity to match the frosted opaque style.
  - Increased search filter dropdown opacity and removed opacity fade from its animation.
  - Increased account button and dropdown opacity to match the search filter/sidebar surfaces.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 06:49] — Standardize Frosted Glass Opacity

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported inconsistent glass UI opacity and requested all glass surfaces look more opaque.
- **Changes**:
  - Increased opacity of sidebar body, place cards actions, detail subpanels, chat widget panels, message bubbles, form area, chatbot trigger, user menu trigger, and floating map controls.
  - Reduced overly transparent glass treatments so the map workspace uses a consistent frosted/opaque look.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 06:45] — Pin Search Bar to the Right

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested the search bar be placed on the right from the start and not resize or move when the sidebar changes.
- **Changes**:
  - Removed the dynamic `searchOffset` prop and sidebar-driven search movement.
  - Pinned the desktop search/filter area to the right side of the navbar using auto margin.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout behavior correction only.

---

## [2026-05-27 06:42] — Correct Search Offset Direction

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User clarified that the search bar should move right, not appear shifted left.
- **Changes**:
  - Restored the navbar search area's original desktop margins.
  - Changed sidebar-open movement to use positive `translateX` so the search/filter area moves right from its original position.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout correction only.

---

## [2026-05-27 06:39] — Offset Search Bar When Sidebar Opens

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User reported the sidebar overlaps the search filter dropdown and requested moving search slightly to the right.
- **Changes**:
  - Added a `searchOffset` prop to the authenticated `Navbar`.
  - Shifted the desktop search/filter area right when the sidebar is open, based on sidebar width.
  - Kept a smaller default desktop offset when the sidebar is closed.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout behavior refinement only.

---

## [2026-05-27 06:35] — Improve Main App Navbar Color

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested improving the main page navbar because it lacked color and looked weak.
- **Changes**:
  - Updated authenticated app navbar to use a stronger slate/blue/cyan gradient while preserving the glass effect.
  - Improved logo treatment, subtitle copy, search input contrast, filter button active color, and user menu trigger styling.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual refinement only.

---

## [2026-05-27 06:21] — Align Landing Page Copy with Accommodation Discovery Product

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User clarified that the project focuses on helping users find suitable accommodations through a chatbot and interactive place environment, and asked to read docs before rewriting the intro page.
- **Changes**:
  - Read product docs covering accommodation discovery, RAG chatbot per accommodation, Q&A, presence, user contributions, and hybrid recommendations.
  - Rewrote landing page hero copy around chatbot-guided accommodation search rather than generic travel planning.
  - Updated feature cards to describe natural-language accommodation needs, hybrid ranking, place-specific Q&A/chatbot, and on-site/community interaction.
  - Updated preview panel examples to use hotels, homestays, and resorts.
  - Updated login/security copy to emphasize remembered accommodation search context and saved place interactions.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — content and product positioning update only.

---

## [2026-05-27 05:20] — Switch Map Renderer to Mapbox GL

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested switching the map implementation to Mapbox.
- **Changes**:
  - Added `mapbox-gl` frontend dependency.
  - Replaced the Leaflet-based `MapComponent` with a Mapbox GL implementation.
  - Preserved existing map props and workflows for places, saved places, POIs, selected markers, directions, user location, fit bounds, focus target, and follow-current-location behavior.
  - Added clustered Mapbox point layers, route line layers, and user location layers.
  - Added support for official Mapbox styles via `VITE_MAPBOX_ACCESS_TOKEN`, with OSM/CARTO raster tile fallback when no token is set.
  - Updated frontend `.env.example` and README to document Mapbox usage.
- **Modified files**:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/.env.example`
  - `frontend/README.md`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — frontend map rendering changed from Leaflet/react-leaflet to Mapbox GL.

---

## [2026-05-27 04:01] — Refine Map Colors and Chat Entry Behavior

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested the map page logo return to `/`, removal of neon styling, stronger map page colors, a transparent chatbot button, and automatic chatbot opening on app load.
- **Changes**:
  - Updated authenticated navbar logo click behavior from `/app` to `/`.
  - Set the floating chatbot to open by default when the app loads.
  - Restyled the chatbot trigger as a translucent glass button instead of a saturated neon-style button.
  - Strengthened the map workspace visual contrast with darker glass navbar/sidebar headers, clearer white glass panels, and more saturated slate/sky accents.
  - Adjusted search result cards, loading states, detail panels, and location controls to feel less washed out while preserving the glass effect.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — UI behavior and visual refinement only.

---

## [2026-05-27 03:54] — Redesign App Icon and Glass Map UI

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested a redesigned app icon without neon colors, plus a refreshed map page UI using a glass effect.
- **Changes**:
  - Replaced the neon gradient favicon with a flatter Smacco map-pin icon using slate, cyan, and amber accents.
  - Updated the authenticated app navbar to use a softer translucent glass surface.
  - Restyled map page overlays, action buttons, search result states, and detail panels with glassmorphism treatment.
  - Updated sidebar and place result cards to use translucent backgrounds, blurred panels, soft borders, and more cohesive depth.
  - Adjusted the floating chat widget styling to better match the glass map workspace.
- **Modified files**:
  - `frontend/public/favicon.svg`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual design and branding refinement only.

---

## [2026-05-27 03:44] — Unify Public UI Theme

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User liked the new intro page but requested consistent colors across pages and a more polished UI.
- **Changes**:
  - Reworked `LandingPage` from the previous green/cream palette to the app's slate/blue/cyan visual system.
  - Improved landing page visual polish with stronger hero contrast, glass panels, cyan primary actions, refined feature cards, and a more cohesive map preview.
  - Rebuilt the legacy `/login` page with the same dark slate/cyan theme, matching form controls, improved right-side preview, and consistent entry points back to the public landing/app.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/pages/LoginPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual design refinement only.

---

## [2026-05-27 03:29] — Add Public Overview Landing Page

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested a general introduction page before entering the main map application, with login, feature overview, important footer links, and explanation of what the website offers.
- **Changes**:
  - Added a public `LandingPage` at `/` with Smacco hero content, feature summaries, visual map preview, embedded email/Google login, security notes, and footer navigation.
  - Moved the protected map application route from `/` to `/app`.
  - Updated successful login redirects to `/app`.
  - Updated unauthenticated protected-route redirects and logout behavior to return users to the public landing page.
  - Updated the authenticated navbar logo action to stay inside the app at `/app`.
- **Modified files**:
  - `frontend/src/App.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/ProtectedRoute.jsx`
  - `frontend/src/pages/LoginPage.jsx`
- **Created files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Deleted files**: —
- **Architecture impact**: Yes — frontend routing now has a public landing route at `/` and the protected main application entry at `/app`.

---

## [2026-05-27 21:35] — Preserve Map Search State Across Detail Navigation

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested that `page_detail` should return to the main map without losing search results and searchbox state, and that state should only be replaced on a new user/autoworkflow search or when returning to landing.
- **Changes**:
  - Updated `HomePage` to hydrate from a preserved route snapshot or `sessionStorage` before persisting, so the initial blank render no longer overwrites previous search state.
  - Expanded the persisted home snapshot to include search filters, selected result, sidebar state, route state, and map focus target.
  - Passed a `returnToMapState` snapshot into detail navigation so the back path can restore the exact map workflow state.
  - Added an explicit `Quay lại bản đồ` action on `PlaceDetailPage` that returns to `/app` with the preserved state payload.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — map/detail navigation now preserves the active search workflow instead of resetting it on route changes.

---

## [2026-05-27 21:40] — Reset Search State On Landing Entry

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested that returning to the landing page should replace the preserved map search state with a fresh one.
- **Changes**:
  - Added a landing-page side effect that clears `home_search_state` from `sessionStorage` as soon as the public landing page mounts.
  - Kept the map workflow restore behavior intact for `/app` and detail back navigation, while ensuring `/` always starts a new session.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — landing page entry now acts as the reset boundary for the map search workflow.

---

## [2026-05-27 21:46] — Add Back To Map Actions On Detail And Profile

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested a dedicated back-to-map button on both the place detail page and the profile page.
- **Changes**:
  - Kept the existing `PlaceDetailPage` back action that returns to `/app` with preserved state.
  - Added a visible `Quay lại bản đồ` button at the top of `ProfilePage` so users can jump back into the main map from their account view.
- **Modified files**:
  - `frontend/src/pages/ProfilePage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — profile navigation now includes a direct return path to the main map workflow.

---

## [2026-05-27 21:52] — Add Persistent Map Entry In Navbar

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested the workflow be optimized further by adding direct map access in the header/avatar menu across the app.
- **Changes**:
  - Updated the app navbar logo to route to `/app`, keeping the primary app workflow inside the map instead of jumping to landing.
  - Added a persistent `Bản đồ` button in the desktop header for quick access to the main map.
  - Added a `Quay lại bản đồ` item inside the avatar dropdown menu so users can recover the map from any page in one click.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — the navbar now serves as a stable, always-available navigation hub for the main map workflow.

---

## [2026-05-27 21:58] — Simplify Navbar And Place Card Badges

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested removing the standalone map button from the navbar and removing the SerpAPI tag from search result cards.
- **Changes**:
  - Removed the dedicated `Bản đồ` button from the desktop navbar while keeping the existing back-to-map entry points in profile and avatar menu.
  - Removed the source badge rendering from `PlaceCard`, so result cards now show only the useful proximity info instead of the SerpAPI/internal label.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/PlaceCard.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — this is a UI simplification and does not change the underlying routing model.

---

## [2026-05-27 22:01] — Remove Place Type Tag From Result Cards

- **Branch**: `feat/improve_searchwf_res`
- **Prompt**: User requested hiding the `hotel` type tag entirely from place cards.
- **Changes**:
  - Removed the `place.type` chip from `PlaceCard` so search results no longer show a hotel/type badge.
  - Kept the internal type value for styling and logic, but stopped rendering it in the visible card header.
- **Modified files**:
  - `frontend/src/components/PlaceCard.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — display-only simplification.

---
