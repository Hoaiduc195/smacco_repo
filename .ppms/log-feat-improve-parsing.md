# Project Changelog

---

## [2026-05-13 15:10] — Update PPMS (sync)

- **Branch**: `feat/improve_parsing`
- **Prompt**: User requested "cập nhật ppms" — refresh PPMS files for current branch.
- **Changes**:
  - Re-scanned the project and refreshed PPMS artifacts for branch `feat/improve_parsing`.
  - Updated `.ppms/architecture-feat-improve-parsing.md` with current architecture snapshot.
  - Added this PPMS sync entry at the top of the changelog.
- **Modified files**: `.ppms/architecture-feat-improve-parsing.md`, `.ppms/log-feat-improve-parsing.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — documentation update only.

## [2026-05-13 14:39] — Improve Place Type Filter UI with Multi-Select

- **Prompt**: User requested "hãy cải thiện UI ở filter trong box chat, chỗ loại địa điểm cho user chọn nhiều cái thay vì 1 và làm cho nó đẹp hơn đi" (improve UI at the filter dropdown, allowing multi-select for place type).
- **Changes**:
  - **Frontend (`Navbar.jsx`)**: Replaced the `<select>` dropdown for "Loại địa điểm" with a grid of toggleable pill buttons. Users can now select multiple place types, which are stored as a comma-separated string (e.g. `hotel,resort`). The UI uses cyan styling with smooth transitions and hover effects.
  - **Backend (`SearchService.ts`)**: Modified the search query builder to replace commas in `filters.type` with spaces so that multiple types are passed smoothly to the external providers (e.g. `query="hotel resort"`).
- **Modified files**: `frontend/src/components/Navbar.jsx`, `backend/src/modules/search/search.service.ts`.
- **Architecture impact**: No — UX/UI enhancement for search filtering.

---

## [2026-05-13 14:29] — Fix Overpass API HTTP 406 Not Acceptable Error

- **Prompt**: User requested "overpass API trong tool tìm POI đang bị trả về 406, hãy sửa lại".
- **Changes**:
  - Modified the HTTP POST request sent to the Overpass API in `nearby-amenities.tool.ts`.
  - Changed the body to be URL-encoded (`data=${encodeURIComponent(overpassQuery)}`) and updated the `Content-Type` header to `application/x-www-form-urlencoded`.
  - Added a fallback array of Overpass endpoints (`overpass-api.de` and `overpass.kumi.systems`) to automatically retry if the primary server rate-limits or rejects the request.
- **Modified files**: `common/tools/nearby-amenities.tool.ts`.
- **Architecture impact**: No — Bug fix for an external API integration.

---

## [2026-05-13 14:24] — Hardcode Search Results to Accommodations Only

- **Prompt**: User requested "à tôi muốn search chỉ trả về các địa điẻm lưu trú, hãy hardcode để xử lý cái này".
- **Changes**:
  - Added a hardcoded post-processing filter in `SearchService.search()` immediately before returning `finalResults`.
  - The filter checks `place.types` against an array of valid keywords: `['hotel', 'resort', 'homestay', 'villa', 'guest_house', 'lodging', 'accommodation', 'hostel', 'motel', 'khách sạn', 'khu nghỉ dưỡng', 'chỗ ở', 'phòng', 'biệt thự', 'nhà nghỉ']`.
  - Excludes any place that has types array populated but contains NONE of the valid accommodation keywords.
- **Modified files**: `search/search.service.ts`.
- **Architecture impact**: No — Applied as a hardcoded rule within the existing search logic per user request.

---

## [2026-05-13 14:21] — Enhance AI Intent Parsing for Place Types

- **Prompt**: User noted "hiện tại khi AI parse intent của người dùng, nó vẫn không parse được 'Loại địa điểm'".
- **Changes**:
  - Updated `ROUTER_SYSTEM_PROMPT` in `groq-task-router.service.ts` to instruct the LLM to output specific place types (e.g. `hotel`, `resort`, `villa`, `homestay`, `restaurant`, `cafe`, `park`, `tourist_attraction`) instead of generic categories like `accommodation` or `food`.
  - Expanded `typeKeywords` dictionary in `NlpService` to accurately map Vietnamese keywords like 'khu nghỉ dưỡng', 'biệt thự', 'công viên' to their corresponding detailed place types.
- **Modified files**: `ai/orchestration/router/groq-task-router.service.ts`, `ai/nlp.service.ts`.
- **Architecture impact**: No — Refinement of AI prompt and mapping logic to fix intent parsing issues.

---

## [2026-05-13 14:18] — Apply Recommendations Filter to Basic Search

- **Prompt**: User requested "à vậy tôi muốn khi tìm kiếm cơ bản thì cũng đi qua các tool tương tự như khi chat với AI" (I want basic search to go through the same tools as AI chat).
- **Changes**:
  - Imported `RecommendationsModule` into `SearchModule`.
  - Injected `RecommendationsService` and `GoongPlacesService` into `SearchService`.
  - Added an optional `applyRecommendations` flag to `SearchFilters`.
  - Modified `SearchService.search()` to conditionally execute `GoongPlacesService` (for geocoding location) and `RecommendationsService.rankPlaces()` at the final step before returning results.
  - Set `applyRecommendations: true` by default in `SearchController.search()`.
  - Intentionally left `SearchPlacesTool` (used by AI Workflow) unchanged so it doesn't double-rank (since the AI engine already chains `RecommendPlacesTool` manually).
- **Modified files**: `search/search.module.ts`, `search/search.service.ts`, `search/search.controller.ts`.
- **Architecture impact**: Yes — `SearchModule` now tightly integrates with `RecommendationsModule` to provide uniformly scored/filtered results for both basic UI search and AI chat workflow.

---

## [2026-05-13 14:11] — Update PlaceCard icons for accommodation types

- **Prompt**: User requested "chỗ place card hãy cập nhật lại icon của mấy cái như resort, villa, ...".
- **Changes**:
  - Refactored icon rendering logic in `PlaceCard.jsx` into a `getIconAndColor` helper function.
  - Added dedicated SVG icons and color schemes for `villa` (purple castle), `resort` (teal sun), `homestay` (amber house), `hotel` (blue building), `restaurant`/`cafe` (red utensils), and `park`/`tourist_attraction` (green trees).
- **Modified files**: `frontend/src/components/PlaceCard.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — Minor UI/UX enhancement for place visualization.

---

## [2026-05-13 14:05] — Move all tools to common directory

- **Prompt**: User asked "mà sao tất cả tool không nằm chung một thư mục" (Why don't all tools reside in the same directory?).
- **Changes**:
  - Moved `search-places.tool.ts`, `geocode-anchor.tool.ts`, `recommend-places.tool.ts`, `tool-registry.service.ts` from `ai/orchestration/tools/` to `common/tools/`.
  - Moved `nearby-amenities.tool.ts`, `proximity-checker.tool.ts` from `recommendations/tools/` to `common/tools/`.
  - Moved `vietnam-filter.ts` to `common/utils/`.
  - Updated all import paths across `AiModule`, `RecommendationsModule`, `WorkflowEngineService`.
- **Modified files**: `ai/ai.module.ts`, `recommendations/recommendations.module.ts`, `recommendations/recommendations.service.ts`, `ai/orchestration/engine/workflow-engine.service.ts`, and all moved tool files.
- **Created files**: —
- **Deleted files**: Removed `ai/orchestration/tools/` and `recommendations/tools/` directories completely.
- **Architecture impact**: Yes — Consolidated physical file structure, all tools now reside exclusively in `src/common/tools/` matching the unified interface abstraction.

---

## [2026-05-13 13:58] — Unify Tool Interfaces (AI Orchestration & Recommendations)

- **Prompt**: User requested "vậy làm theo C đi" (Unify into a single interface).
- **Changes**:
  - Created `IUnifiedTool`, `UnifiedToolInput`, `UnifiedToolOutput` in `src/common/tools/tool.interface.ts`.
  - Moved geo utilities to `src/common/utils/geo.util.ts`.
  - Refactored `SearchPlacesTool`, `GeocodeAnchorTool`, `RecommendPlacesTool`, `NearbyAmenitiesTool`, and `ProximityCheckerTool` to use `IUnifiedTool`.
  - Removed duplicate unused `RecommenderService` in AI module.
  - Updated `RecommendationsService` and `WorkflowEngineService` to use unified input/output logic.
- **Modified files**: `ai/orchestration/tools/*`, `ai/orchestration/engine/workflow-engine.service.ts`, `ai/ai.module.ts`, `recommendations/recommendations.service.ts`, `recommendations/tools/*`
- **Created files**: `common/tools/tool.interface.ts`, `common/utils/geo.util.ts`
- **Deleted files**: `ai/orchestration/tools/tool.interface.ts`, `recommendations/tools/recommender-tool.interface.ts`, `ai/orchestration/tools/recommender.service.ts`
- **Architecture impact**: Yes — Consolidated tool execution logic under a single interface `IUnifiedTool`, improving reusability across domains.

---

## [2026-05-13 10:25] — Disable frontend chat auto-scroll completely

- **Prompt**: User requested "tắt hết autoscroll đi" (turn off all autoscroll).
- **Changes**:
  - Removed all `autoScroll` state, side-effects (`useEffect`), and `onScroll` event handlers from `ChatWidget.jsx` and `PlaceChatPanel.jsx`. The chatbox will no longer scroll to the bottom automatically under any circumstances.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/PlaceChatPanel.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — UX behavior change.

---

## [2026-05-13 10:18] — Fix backend TypeScript error in RecommenderService

- **Prompt**: User reported "I got an error: Property 'anchorLocation' does not exist on type...".
- **Changes**:
  - Updated `params` object type definition in `scorePlaces` method within `RecommenderService`.
  - Added optional properties `anchorLocation` and `anchorLabel` to fix the `TS2339` error.
- **Modified files**: `backend/src/modules/ai/orchestration/tools/recommender.service.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — minor TypeScript typing fix.

---

## [2026-05-13 10:15] — Fix frontend chat auto-scroll issue

- **Prompt**: User reported "frontend đang bị lỗi: khi chat trong chatbox khi AI trả lời thì không kéo lên được" (frontend chatbox scrolling locked while AI is responding).
- **Changes**:
  - Replaced smooth scrolling behavior with instant auto scrolling (`behavior: 'auto'`) inside `ChatWidget.jsx` and `PlaceChatPanel.jsx` to prevent continuous scrolling interruption from high-frequency message updates.
  - Increased scroll distance tolerance from `80px` to `120px` to reliably disable auto-scroll when user manually scrolls up.
  - Added proper `autoScroll` state detection inside `PlaceChatPanel.jsx`.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/PlaceChatPanel.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — minor UX fix for chat component.

---

## [2026-05-12 09:57] — PPMS Full Re-scan & Initialization

- **Prompt**: User requested "update ppms" — triggered a full project re-scan and PPMS file creation.
- **Changes**:
  - Re-scanned entire project structure (backend modules, frontend components, Prisma schema, dependencies)
  - Created `architecture.md` with full architecture documentation
  - Created `architecture-short.md` with condensed quick reference
  - Created `log.md` (this file)
- **Modified files**: —
- **Created files**: `.ppms/architecture.md`, `.ppms/architecture-short.md`, `.ppms/log.md`
- **Deleted files**: —
- **Architecture impact**: No — documentation-only update reflecting current project state

---
