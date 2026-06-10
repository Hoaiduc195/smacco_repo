# Project Changelog

---

## [2026-06-10 18:23] — Keep workflow search out of searchbar state

- **Branch**: `feat/comparison`
- **Prompt**: User wanted workflow search to avoid activating or updating the searchbar.
- **Changes**:
  - Removed `setSearchQuery`, `setPlaceType`, `setLocationInput`, and `setBudget` side effects from `HomePage.handleAiSearch()`.
  - Changed workflow search fallback execution to use only workflow-provided filters instead of reading navbar filter state.
  - Search workflow still updates results/panel/map through `showSearchResults()` / `performUnifiedSearch()`.
- **Modified files**: `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — AI workflow search and navbar input state are now isolated.

---

## [2026-06-10 18:18] — Add persistent save button to search result cards

- **Branch**: `feat/comparison`
- **Prompt**: User wanted search result `PlaceCard`s to include an additional save button.
- **Changes**:
  - Extended `PlaceCard` with a separate persistent save action (`onPersistSave`) alongside the existing tag/save action.
  - Updated `SearchResultsPanel` to pass saved-place state and render the additional `Lưu` / `Đã lưu` button for search results.
  - Wired `HomePage` to sync external search results via `/places` when needed, call `savePlace()`, update saved IDs, and refresh the saved places panel.
- **Modified files**: `frontend/src/components/PlaceCard.jsx`, `frontend/src/components/SearchResultsPanel.jsx`, `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — search result cards now support both temporary AI tagging and persistent saved-place state.

---

## [2026-06-10 18:09] — Reuse PlaceCard in saved places panel

- **Branch**: `feat/comparison`
- **Prompt**: User wanted saved-place cards to use the same place card UI as search results.
- **Changes**:
  - Replaced the custom saved-place card markup in `SavedPlacesPanel` with the shared `PlaceCard` component used by `SearchResultsPanel`.
  - Kept saved panel loading/empty/header states, while card actions now use `PlaceCard`'s saved and directions buttons.
  - Removed the now-unused AI/question action prop from the saved places panel callsite.
- **Modified files**: `frontend/src/components/SavedPlacesPanel.jsx`, `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — UI component reuse only.

---

## [2026-06-10 18:03] — Stop search workflow from using POI lookup

- **Branch**: `feat/comparison`
- **Prompt**: User asked why the search workflow was using POI search.
- **Changes**:
  - Traced the cause to `SEARCH_PLACES -> recommend_places -> RecommendationsService.rankPlaces()`, where `NearbyAmenitiesTool` was always executed for ranking.
  - Added `includeNearbyAmenities?: boolean` to `RankPlacesParams` and made `NearbyAmenitiesTool` opt-in only.
  - Left existing search workflow and REST search calls without the flag, so search/recommendation no longer calls Overpass/POI by default.
- **Modified files**: `backend/src/modules/recommendations/recommendations.service.ts`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — POI lookup is now explicitly scoped to tools/workflows that request it instead of being implicit in generic search ranking.

---

## [2026-06-10 17:55] — Rename workspace label to saved places

- **Branch**: `feat/comparison`
- **Prompt**: User asked to rename the AI context board label to `Địa điểm đã lưu`.
- **Changes**:
  - Replaced visible `Bảng AI` / `Bảng ngữ cảnh AI` labels in the left context panel and mobile workspace UI with `Địa điểm đã lưu` / `Đã lưu`.
  - Updated rail accessibility labels and close button title to match the saved-places naming.
- **Modified files**: `frontend/src/components/LeftContextPanel.jsx`, `frontend/src/pages/HomePage.jsx`, `frontend/src/components/WorkspaceRail.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — UI copy only.

---

## [2026-06-10 17:51] — Move saved rail shortcut and sync with backend saved places

- **Branch**: `feat/comparison`
- **Prompt**: User clarified that the saved icon should sit lower in the rail and must sync with places the user actually saved.
- **Changes**:
  - Extended `WorkspaceRail` with `secondaryItems` so the saved shortcut can render near the bottom separately from primary AI panels.
  - Moved `Địa điểm đã lưu` out of the primary rail item group and into the secondary lower rail group.
  - Changed `HomePage` saved panel data source from Firestore `ownedPlaces` to backend `getSavedPlaces()` / `unsavePlace()` from `savedPlacesService`.
  - Added loading state for the saved places panel and a global `app:saved-places-changed` refresh event after save toggles in `PlaceDetailPage`.
- **Modified files**: `frontend/src/components/WorkspaceRail.jsx`, `frontend/src/index.css`, `frontend/src/pages/HomePage.jsx`, `frontend/src/components/SavedPlacesPanel.jsx`, `frontend/src/pages/PlaceDetailPage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — saved-place rail panel now uses the backend saved-place source of truth instead of the separate Firestore owned-place list.

---

## [2026-06-10 17:43] — Add saved places rail panel

- **Branch**: `feat/comparison`
- **Prompt**: User wanted another rail panel that shows saved places.
- **Changes**:
  - Added `SavedPlacesPanel` for `ownedPlaces` with empty state, saved-place cards, map focus, directions, AI prefill, and remove-saved actions.
  - Added a new icon-only `Địa điểm đã lưu` rail item using the `Bookmark` icon.
  - Rendered the saved places panel in `HomePage` and adjusted the mobile panel selector to four columns.
- **Modified files**: `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: `frontend/src/components/SavedPlacesPanel.jsx`
- **Deleted files**: None
- **Architecture impact**: Yes — workspace rail now includes saved-place management backed by `TravelDataContext.ownedPlaces`.

---

## [2026-06-10 17:35] — Clarify search runtime modes

- **Branch**: `feat/comparison`
- **Prompt**: User wanted normal search to use SerpAPI, while test mode should return a few random places.
- **Changes**:
  - Changed production search default `externalProviderPolicy` from `fallback` to `always`, so production searches query the configured SerpAPI provider instead of skipping external search when local results exist.
  - Updated the runtime config helper script production profile to use `externalProviderPolicy: 'always'`.
  - Kept test mode fixture-only and reduced random fixture search results to 6 places.
- **Modified files**: `backend/src/config/runtime-config.ts`, `backend/scripts/config-features.js`, `backend/src/modules/search/search.service.ts`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — search now has explicit mode behavior: production uses SerpAPI, test mode returns random local fixtures without external API calls.

---

## [2026-06-10 17:28] — Remove search bar filters

- **Branch**: `feat/comparison`
- **Prompt**: User asked to remove the filter controls from the search bar.
- **Changes**:
  - Simplified `Navbar` search UI to a plain text search field with the search icon only.
  - Removed the filter dropdown, filter button, place-type chips, location input, budget slider, clear-filter action, and related local state/imports from `Navbar`.
  - Stopped passing filter props from `HomePage` into `Navbar`; retained `HomePage` filter state for AI-driven search events.
- **Modified files**: `frontend/src/components/Navbar.jsx`, `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — top search UX no longer exposes manual filters, while AI/search event filters remain internal to page logic.

---

## [2026-06-10 17:21] — Make POI tool-only and remove Overpass gate

- **Branch**: `feat/comparison`
- **Prompt**: User clarified that POI should be removed from runtime config and always allowed, but only used by tools rather than the normal map UI.
- **Changes**:
  - Removed frontend map's automatic POI fetch/render path from `HomePage`; map POI remains absent unless explicitly provided.
  - Removed `externalApis.overpass.nearbyAmenities` from backend runtime config defaults, `features.json`, and the config helper script.
  - Removed the Overpass disabled branch from `nearby_poi_context` and `nearby_amenities` tools so tool execution can call Overpass directly.
  - Updated `tmp/tool-explain.md` to remove stale disabled-state documentation.
- **Modified files**: `frontend/src/pages/HomePage.jsx`, `backend/src/config/runtime-config.ts`, `backend/src/config/runtime-config.service.ts`, `backend/scripts/config-features.js`, `backend/features.json`, `backend/src/common/tools/nearby-poi-context.tool.ts`, `backend/src/common/tools/nearby-amenities.tool.ts`, `tmp/tool-explain.md`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — POI fetching is now tool-scoped and always allowed for backend tools, while the default map UI no longer initiates POI loading.

---

## [2026-06-10 17:13] — Document insight tools in tmp

- **Branch**: `feat/comparison`
- **Prompt**: User asked for a `tmp/tool-explain.md` document explaining how each tool in the Insight workflow works.
- **Changes**:
  - Added `tmp/tool-explain.md` documenting the `ANALYZE_PLACE` workflow order, each tool's responsibility, main input/output shape, and end-to-end data flow.
  - Included explanations for the shared helpers in `place-insight-utils.ts` and why the split-tool architecture is easier to evolve.
- **Modified files**: `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: `tmp/tool-explain.md`
- **Deleted files**: None
- **Architecture impact**: Yes — project documentation now explicitly describes the split insight-tool pipeline and records `tmp/` as a temporary documentation area.

---

## [2026-06-10 17:09] — Split insight workflow into small context tools

- **Branch**: `feat/comparison`
- **Prompt**: User wanted the Insight workflow skills/tools split into multiple smaller pieces before a larger function/tool aggregates the context.
- **Changes**:
  - Split the monolithic `PlaceInsightContextTool` responsibilities into smaller tools for place metadata normalization, start-location resolution, travel-time estimation, and nearby POI lookup.
  - Kept `place_insight_context` as the final aggregate tool so the composer continues reading one stable insight context block.
  - Updated `ANALYZE_PLACE` workflow steps to run `place_metadata_context`, `geocode_anchor`, `resolve_start_location_context`, `travel_estimate_context`, `nearby_poi_context`, then final `place_insight_context`.
  - Registered the new tools in `AiModule` and shared coordinate/normalization helpers through `place-insight-utils.ts`.
  - Verified backend build and targeted backend AI tests.
- **Modified files**: `backend/src/common/tools/place-insight-context.tool.ts`, `backend/src/modules/ai/ai.module.ts`, `backend/src/modules/ai/orchestration/engine/workflow-registry.ts`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: `backend/src/common/tools/place-insight-utils.ts`, `backend/src/common/tools/place-metadata-context.tool.ts`, `backend/src/common/tools/resolve-start-location-context.tool.ts`, `backend/src/common/tools/travel-estimate-context.tool.ts`, `backend/src/common/tools/nearby-poi-context.tool.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — `ANALYZE_PLACE` now uses a composable multi-tool context pipeline with a final aggregate context tool instead of one monolithic insight context tool.

---

## [2026-06-10 16:53] — Tool-backed single-place insight workflow

- **Branch**: `feat/comparison`
- **Prompt**: User wanted to install a detailed place insight workflow that only applies when exactly one place is tagged, covering travel time from current/custom start location, strengths/weaknesses, trip purpose fit, nearby landmarks, reasonable time of day, and review analysis. User also asked whether this should be done by AI alone or with registered workflow tools.
- **Changes**:
  - Converted `ANALYZE_PLACE` into a confirmation-gated workflow like search/compare, requiring exactly one tagged place in the frontend prompt card and Insight rail.
  - Added `PlaceInsightContextTool` registered in the AI tool registry to build deterministic context for travel-time estimates and nearby POIs/landmarks via Overpass when enabled.
  - Updated the workflow registry so `ANALYZE_PLACE` runs optional start-location geocoding followed by `place_insight_context` before LLM composition.
  - Rewrote the analyze composer prompt to generate detailed Markdown sections for travel, strengths/weaknesses, trip purposes, surrounding landmarks, time-of-day guidance, reviews, and action conclusions using tool/review evidence only.
  - Extended chat request/user context plumbing so the frontend sends current user coordinates/timezone/locale and the wizard collects optional start location, priority criteria, and trip purposes.
  - Updated the Insight rail panel with a single-tag gate and a CTA to create detailed AI insight for the tagged place.
  - Verified backend build, frontend build, and targeted backend AI tests. Frontend Vite still reports the existing large chunk warning.
- **Modified files**: `backend/src/modules/ai/ai.module.ts`, `backend/src/modules/ai/dto/chat-request.dto.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `backend/src/modules/ai/orchestration/engine/workflow-registry.ts`, `backend/src/modules/ai/orchestration/router/llm-task-router.service.ts`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/PlaceInsightPanel.jsx`, `frontend/src/components/chat/WorkflowPromptCard.jsx`, `frontend/src/components/chat/WizardStepCard.jsx`, `frontend/src/hooks/useStreamingChat.js`, `frontend/src/hooks/useWorkflowWizard.js`, `frontend/src/pages/HomePage.jsx`, `frontend/src/services/aiService.js`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: `backend/src/common/tools/place-insight-context.tool.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — `ANALYZE_PLACE` now has deterministic workflow tools and frontend user-context plumbing instead of relying on prompt-only place analysis.

---

## [2026-06-10 16:29] — Match chat launcher to location control

- **Branch**: `feat/comparison`
- **Prompt**: User wanted the AI chat button shape to match the current-location button, removed suggested chat prompts inside the chatbox, and removed the bottom `[X]` button while the chatbox is open.
- **Changes**:
  - Changed the closed AI chat launcher to a compact `h-11 w-11 rounded-2xl` icon button matching the current-location control styling.
  - Removed quick-reply prompt chips and all associated quick-reply state/handlers from `ChatWidget`.
  - Hid the floating launcher/close button while the chatbox is open, leaving the header close button as the only close affordance.
  - Verified frontend production build; Vite still reports the existing large chunk warning.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — chat overlay presentation changed by removing suggested prompt chips and simplifying the floating launcher behavior.

---

## [2026-06-10 16:24] — Compact rail and comparison table polish

- **Branch**: `feat/comparison`
- **Prompt**: User requested shrinking the rail width and improving the detailed comparison table UI, with the top label changed to `Đánh giá chi tiết`.
- **Changes**:
  - Reduced the left workspace rail width and tightened rail padding/button sizing for an icon-only layout.
  - Restyled `PlaceComparisonTable` from a dark table to a lighter card/table treatment that better matches the surrounding app UI.
  - Changed the comparison table header to only show `Đánh giá chi tiết`.
  - Verified frontend production build; Vite still reports the existing large chunk warning.
- **Modified files**: `frontend/src/index.css`, `frontend/src/components/chat/PlaceComparisonResult.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — the comparison panel/table presentation and workspace rail sizing changed.

---

## [2026-06-10 16:19] — Persist comparison tables separately

- **Branch**: `feat/comparison`
- **Prompt**: User wanted new comparison tables stored in a dedicated relation, with AI analysis messages showing a `Xem chi tiết` button that queries the DB to render the full table. User explicitly allowed dropping old comparison data and required test mode not to touch the DB.
- **Changes**:
  - Added Prisma `PlaceComparisonResult` model and migration SQL for `place_comparison_results`, linked to `Conversation` and optionally one `Message`.
  - Added `PlaceComparisonResultsService` to parse LLM `place_comparison` JSON, convert it into normal assistant analysis text, persist the full table payload only when `chat.persistHistory=true`, and fetch comparison payloads for the authenticated owner.
  - Updated `AiOrchestratorService` so new `COMPARE_PLACES` responses store assistant analysis in `messages` and store the full table in `place_comparison_results`; streaming compare responses no longer expose raw JSON chunks and emit `comparisonResultId` metadata.
  - Extended conversation message responses to include `id` and `comparisonResultId`, and added guarded `GET /api/v1/ai/comparisons/:id`.
  - Updated frontend streaming state to attach message metadata, render `Xem chi tiết` for messages with `comparisonResultId`, and fetch/render the comparison table on demand in the left rail.
  - Preserved test-mode DB safety by relying on `runtimeConfig.chat.persistHistory=false`; comparison persistence returns null and fetch endpoint returns not found before Prisma DB access in test mode.
  - Generated Prisma Client from schema only; no database migration was applied.
  - Verified targeted backend AI tests, backend production build, and frontend production build. Frontend Vite still reports the existing large chunk warning.
- **Modified files**: `backend/prisma/schema.prisma`, `backend/src/modules/ai/ai.controller.ts`, `backend/src/modules/ai/ai.controller.spec.ts`, `backend/src/modules/ai/ai.module.ts`, `backend/src/modules/ai/conversation-store.service.ts`, `backend/src/modules/ai/conversations.service.ts`, `backend/src/modules/ai/dto/chat-response.dto.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.spec.ts`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/hooks/useStreamingChat.js`, `frontend/src/pages/HomePage.jsx`, `frontend/src/services/aiService.js`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: `backend/prisma/migrations/202606101555_add_place_comparison_results/migration.sql`, `backend/src/modules/ai/place-comparison-results.service.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — structured comparison tables are now first-class persisted records loaded on demand instead of being parsed from assistant message history.

---

## [2026-06-10 15:52] — Icon-only controls and normal assessment message

- **Branch**: `feat/comparison`
- **Prompt**: User requested removing visible text from the `Kết quả`, `So sánh`, `Insight`, and `Mở AI Chat` buttons while keeping icons, and making the overall assessment look more like a regular chat message.
- **Changes**:
  - Removed visible labels from desktop workspace rail buttons while preserving `title` and `aria-label` accessibility text.
  - Removed visible labels from mobile workspace panel selector buttons.
  - Changed the closed chat launcher from `Mở AI Chat` text plus icon to an icon-only button with accessible label.
  - Restyled `PlaceComparisonAnalysis` to render inline text/list content inside the normal assistant bubble instead of a separate bordered assessment card.
  - Verified frontend production build; Vite still reports the existing large chunk warning.
- **Modified files**: `frontend/src/components/WorkspaceRail.jsx`, `frontend/src/index.css`, `frontend/src/pages/HomePage.jsx`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/chat/PlaceComparisonResult.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — comparison assessment presentation and workspace/chat controls are now icon-only/standard-message UI patterns.

---

## [2026-06-10 15:48] — Remove comparison panel actions

- **Branch**: `feat/comparison`
- **Prompt**: User requested removing the `Chỉ đường`, `So sánh bằng AI`, and `Hỏi AI` buttons from the comparison panel.
- **Changes**:
  - Removed the comparison panel footer action buttons.
  - Removed unused action props and icons from `ComparePlacesPanel`.
  - Stopped passing now-unused comparison panel action handlers from `HomePage`.
  - Verified frontend production build; Vite still reports the existing large chunk warning.
- **Modified files**: `frontend/src/components/ComparePlacesPanel.jsx`, `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — comparison panel is now display-only for tagged-place list/table content and no longer exposes footer actions.

---

## [2026-06-10 15:45] — Move comparison table to left rail

- **Branch**: `feat/comparison`
- **Prompt**: User liked the comparison feature but requested the comparison table be shown in the left rail panel while AI analysis remains in chat.
- **Changes**:
  - Split structured comparison rendering into `PlaceComparisonTable` for the workspace rail and `PlaceComparisonAnalysis` for the chat bubble.
  - Updated `ChatWidget` to parse comparison JSON, render only the AI assessment in chat, hide partial JSON while streaming, and dispatch `app:place-comparison` with the parsed table data.
  - Updated `HomePage` to store the latest comparison result, auto-open the left comparison panel when comparison data arrives, persist the result in session state, and clear stale data when changing conversations.
  - Updated `ComparePlacesPanel` to render the structured comparison table when available while retaining the tagged-place list and AI compare action before a result exists.
  - Verified frontend production build; Vite still reports the existing large chunk warning.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/ComparePlacesPanel.jsx`, `frontend/src/components/chat/PlaceComparisonResult.jsx`, `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — structured comparison display is now split between chat analysis and left rail table state/rendering.

---

## [2026-06-10 15:24] — Structured AI place comparison

- **Branch**: `feat/comparison`
- **Prompt**: User requested reinstalling the current two-place comparison feature so results display as a table, with chatbot overall evaluation/analysis on the right, preferably by forcing AI JSON output.
- **Changes**:
  - Updated `COMPARE_PLACES` composer instructions to force raw JSON output with a stable `place_comparison` schema.
  - Passed `response_format: { type: 'json_object' }` to LLM compose and stream compose for comparison workflows.
  - Extended LLM provider streaming interfaces so Groq and Cloudflare streaming requests can forward `response_format`; FreeModel keeps compatibility by ignoring the option.
  - Added `PlaceComparisonResult` React renderer that parses comparison JSON, displays a criteria table on the left, and displays overall assessment/recommendation/tradeoffs on the right.
  - Updated `ChatWidget` to detect structured comparison assistant messages, hide partial raw JSON during streaming, and widen the chat panel when comparison cards are present.
  - Verified targeted backend AI tests, backend build, and frontend production build. Frontend lint could not run because the project currently has no ESLint configuration file.
- **Modified files**: `backend/src/modules/ai/interfaces/llm-client.interface.ts`, `backend/src/modules/ai/providers/groq-llm-client.service.ts`, `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts`, `backend/src/modules/ai/providers/freemodel-llm-client.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `frontend/src/components/ChatWidget.jsx`
- **Created files**: `frontend/src/components/chat/PlaceComparisonResult.jsx`, `.ppms/architecture-feat-comparison.md`, `.ppms/log-feat-comparison.md`
- **Deleted files**: None
- **Architecture impact**: Yes — comparison workflow now has a structured JSON contract between backend AI composer and frontend chat renderer.

---
