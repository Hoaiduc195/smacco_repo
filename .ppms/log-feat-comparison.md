# Project Changelog

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
