# Project Changelog

---

## [2026-06-16 15:34] — Humanize AI prompt mediation

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to optimize all AI prompts so the LLM acts as a human intermediary between system information and users, avoids exposing technical/internal wording, and keeps prompt instructions written in English.
- **Changes**:
  - Rewrote the composer system, compare, and insight prompts in English while requiring natural Vietnamese user-facing output.
  - Added explicit human-mediation rules: synthesize evidence, avoid raw context repetition, use "mình/bạn", and phrase uncertainty as personal advisory judgment rather than internal data limitations.
  - Updated legacy chat/place-question prompts and search-filter extraction prompt to English instructions.
  - Removed user-facing technical fallback wording such as metadata/schema/fallback/data-missing language from compare and insight fallback payloads.
  - Updated composer prompt tests for the new private English evidence labels.
- **Verification**:
  - `npm test -- llm-response-composer.service.spec.ts place-insight-results.service.spec.ts place-comparison-results.service.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/chat.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts`, `backend/src/modules/ai/place-comparison-results.service.ts`, `backend/src/modules/ai/place-insight-results.service.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — AI composition now uses English-maintained prompt instructions with stricter human-facing mediation and non-technical uncertainty language.

---

## [2026-06-16 15:10] — Fix test-mode fixture search URL fallback

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported that the place search workflow returned no places while testing in test mode.
- **Changes**:
  - Fixed local fixture place URL generation so backend workflow/tool calls without an HTTP request no longer require `APP_PUBLIC_BASE_URL`.
  - Applied the same fallback behavior to both local fixture mapping and general place URL formatting: use configured `app.publicBaseUrl` when present, otherwise `http://localhost:<app.port|3001>`.
  - Added a regression test proving fixture search returns places when public base URL is unset.
- **Verification**:
  - `npm test -- local-fixture-places.service.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/places/local-fixture-places.service.ts`, `backend/src/modules/places/places.service.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/src/modules/places/local-fixture-places.service.spec.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — test-mode fixture place mapping now has a runtime-safe URL fallback for workflow/tool execution paths without request context.

---

## [2026-06-15 19:16] — Remove duplicate compare/insight sub-headers

- **Branch**: `feat/insight_wf`
- **Prompt**: User pointed out the panel corners looked duplicated and asked to remove one header.
- **Changes**:
  - Removed the inner compare panel title/description row and kept the shared workspace panel header as the single heading.
  - Removed the inner insight panel title/address row for the same reason.
  - Repositioned PNG export controls as small sticky top-right in-content actions so export remains accessible without reintroducing a second header bar.
- **Verification**:
  - `npm run build` in `frontend`
- **Modified files**: `frontend/src/components/ComparePlacesPanel.jsx`, `frontend/src/components/PlaceInsightPanel.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — compare and insight panels now rely on the shared workspace header only, with export controls moved to sticky in-content actions.

---

## [2026-06-15 19:13] — Fix workspace panel PNG controls and corner clipping

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported the PNG save button position was wrong in compare and insight panels, and the top corners of the current panels had lost their rounded clipping.
- **Changes**:
  - Moved the compare panel PNG export button out of the scroll-overlay positioning and into a stable header row.
  - Aligned the insight panel PNG export button with the same fixed header placement strategy.
  - Wrapped left workspace panel content in an inner clipped container so the outer shell can still expose the resize handle while the panel regains its rounded top-corner masking.
- **Verification**:
  - `npm run build` in `frontend`
- **Modified files**: `frontend/src/components/ComparePlacesPanel.jsx`, `frontend/src/components/LeftContextPanel.jsx`, `frontend/src/components/PlaceInsightPanel.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — workspace panel shell now separates visible resize-handle overflow from inner rounded clipping, and compare/insight export controls now live in fixed panel headers.

---

## [2026-06-15 19:07] — Improve place detail AI auto-reply UX

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to implement AI automatically answering questions in place detail.
- **Changes**:
  - Confirmed the backend already generates a pinned AI answer automatically when a place question is created.
  - Updated `QASection` to insert the created question thread immediately from the create API response instead of always reloading the full list.
  - Added an inline pending AI state for newly created threads when the AI answer is not yet present, plus a short delayed refresh fallback so the pinned answer appears automatically.
- **Verification**:
  - `npm run test -- useStreamingChat.test.jsx` in `frontend`
- **Modified files**: `frontend/src/components/QASection.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — place detail Q&A now shows immediate create results and an explicit pending AI-reply state before the pinned AI answer is available.

---

## [2026-06-15 18:42] — Smooth workspace panel resizing

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported the resize button was half hidden and the resize effect felt laggy instead of following the pointer smoothly.
- **Changes**:
  - Changed the workspace panel shell to allow resize handle overflow so the handle is fully visible.
  - Repositioned and slightly enlarged the resize handle on the panel edge.
  - Disabled workspace layout transition while resizing.
  - Updated resize handling to write `--workspace-panel-width` directly via `requestAnimationFrame` during pointer movement and commit React state only on pointer release.
- **Verification**:
  - Not run per prior user instruction to skip tests/build.
- **Modified files**: `frontend/src/components/LeftContextPanel.jsx`, `frontend/src/pages/HomePage.jsx`, `frontend/src/index.css`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — interaction refinement only.

---

## [2026-06-15 18:39] — Prevent stale conversation reuse in new chat

- **Branch**: `feat/insight_wf`
- **Prompt**: User still saw the assistant recall an old Dalat/two-person context after the hardcoded greeting and auto-select cleanup.
- **Changes**:
  - Removed `ChatWidget` auto-sync from streamed `conversationId` back into `selectedConversationId`; old backend ids are no longer treated as explicitly selected history.
  - Changed new-conversation action to clear local chat state instead of pre-creating/selecting a backend conversation.
  - Changed history loading so it only runs when a conversation is explicitly selected.
  - Added an `ignoreConversationId` send option so the first message of a fresh UI session cannot accidentally send a stale React-state conversation id.
- **Verification**:
  - Not run per prior user instruction to skip tests/build.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/hooks/useStreamingChat.js`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — chat history reuse is now explicit-history only for restored conversations, while fresh sessions ignore stale conversation ids.

---

## [2026-06-15 18:32] — Fix resize handle Tailwind class

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported Vite/PostCSS failed because `text-ink-400` does not exist in Tailwind config.
- **Changes**:
  - Replaced the resize handle's invalid `text-ink-400` utility with the configured `text-ink-500` utility.
  - Checked nearby `text-ink-*` usages against the configured `ink` palette.
- **Verification**:
  - Not run per prior user instruction to skip tests/build.
- **Modified files**: `frontend/src/index.css`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — build error fix only.

---

## [2026-06-15 18:29] — Add resizable workspace panel

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to implement an interactive feature that lets users expand or narrow the panel.
- **Changes**:
  - Added a draggable resize handle to the desktop left workspace panel.
  - Added bounded workspace panel width state in `HomePage`, backed by the existing `--workspace-panel-width` CSS variable.
  - Persisted the workspace panel width in the existing home session snapshot.
  - Added resize cursor/selection guard styling during drag.
- **Verification**:
  - Not run per prior user instruction to skip tests/build.
- **Modified files**: `frontend/src/components/LeftContextPanel.jsx`, `frontend/src/pages/HomePage.jsx`, `frontend/src/index.css`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — desktop workspace panel width is now user-adjustable and persisted in session state.

---

## [2026-06-15 18:23] — Remove sticky chat context hardcodes

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported the LLM always remembered a Dalat trip context and asked to adjust the app and remove hardcoded context.
- **Changes**:
  - Removed the hardcoded Dalat/two-person example from the default chat greeting.
  - Stopped restoring `chat_selected_conversation` from `localStorage` and now remove the legacy key on provider mount.
  - Removed automatic selection of the most recent conversation when no conversation is explicitly selected.
  - Replaced workspace/insight Dalat fallback copy with neutral labels so the UI does not imply a default destination.
- **Verification**:
  - Not run per prior user instruction to skip tests/build.
- **Modified files**: `frontend/src/components/AIWorkspacePanel.jsx`, `frontend/src/components/AreaInsightPanel.jsx`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/contexts/ConversationContext.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — chat no longer auto-resumes the most recent conversation or persists selected conversation in browser storage.

---

## [2026-06-15 18:05] — Refine panel PNG button visibility

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported the PNG button position was wrong in the compare panel and asked to display it only when the panel has output.
- **Changes**:
  - Updated the comparison panel so the PNG export button only appears after a `comparisonResult` exists.
  - Updated the insight panel so the PNG export button only appears after an `insight` output exists.
  - Repositioned the comparison PNG button as a small overlay on the rendered output area instead of showing it during the tagged-place setup state.
- **Verification**:
  - Not run per user request to skip tests/build.
- **Modified files**: `frontend/src/components/ComparePlacesPanel.jsx`, `frontend/src/components/PlaceInsightPanel.jsx`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — UI behavior refinement only.

---

## [2026-06-15 17:52] — Add panel image export

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked whether the app can support saving an image of the comparison panel or insight panel, and confirmed adding a package is acceptable.
- **Changes**:
  - Added `html-to-image` to the frontend for DOM-to-PNG export.
  - Added a reusable `PanelImageExportButton` with export progress and inline error feedback.
  - Added `exportPanelImage` utilities for full-content PNG capture, filename sanitization, and download triggering.
  - Added compact icon-only image export buttons to the comparison and insight panels with minimal layout changes.
  - Removed the insight panel's nested fixed-height scroll container so exported insight images can include the full rendered insight content.
  - Added temporary export CSS that opens nested overflow during capture so long insight content and horizontally scrollable comparison tables render more completely in the PNG.
- **Verification**:
  - Not rerun after the final UI-minimizing adjustment per user request; previous frontend build passed before removing the extra test file and compacting the button placement.
- **Modified files**: `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/components/AreaInsightPanel.jsx`, `frontend/src/components/ComparePlacesPanel.jsx`, `frontend/src/components/PlaceInsightPanel.jsx`, `frontend/src/index.css`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `frontend/src/components/PanelImageExportButton.jsx`, `frontend/src/utils/exportPanelImage.js`
- **Deleted files**: None
- **Architecture impact**: Yes — comparison and insight panels now expose frontend-only PNG export using `html-to-image`.

---

## [2026-06-15 17:30] — Compact router context

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to optimize all three router-context reductions: remove duplicated current user turn, reduce recent history window, and reduce per-message truncation.
- **Changes**:
  - Added route-specific history shaping in `AiOrchestratorService` so the current user message is not duplicated in router history after being appended to conversation history.
  - Reduced router recent history from 6 messages to 4 messages.
  - Reduced router history message truncation from 800 characters to 500 characters.
  - Updated backend tests to assert compact route history while preserving full composer history.
- **Verification**:
  - `npm test -- --runInBand --silent src/modules/ai/orchestration/ai-orchestrator.service.spec.ts src/modules/ai/orchestration/router/llm-task-router.service.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/router/llm-task-router.service.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.spec.ts`, `backend/src/modules/ai/orchestration/router/llm-task-router.service.spec.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — router context is now smaller and route-specific, while composer history remains unchanged.

---

## [2026-06-15 17:23] — Normalize chat place context before streaming

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported that after the LLM analyzed search results, the next chat request returned `400 Bad Request` unless they dragged a place.
- **Changes**:
  - Diagnosed the likely cause as raw active search result objects being sent as `taggedPlaces` after search analysis, with values such as object prices, object amenities, numeric IDs, or numeric `sourcePlaceId` violating the backend `ChatRequestDto` validation.
  - Added `chatPlacePayload` normalization for chat place context, coercing IDs/source IDs/prices/amenities to bounded strings, numeric coordinates/ratings/review counts to finite numbers, and dropping invalid fields.
  - Reused the same normalization in both the global `ChatWidget` and `PlaceChatPanel` so active search results and dragged/tagged places use the same DTO-safe payload.
  - Added focused frontend tests for SerpAPI-like place payload normalization.
- **Verification**:
  - `npm test -- src/utils/chatPlacePayload.test.js src/hooks/useStreamingChat.test.jsx` in `frontend`
  - `npm run build` in `frontend` (existing large chunk warning remains)
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/PlaceChatPanel.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `frontend/src/utils/chatPlacePayload.js`, `frontend/src/utils/chatPlacePayload.test.js`
- **Deleted files**: None
- **Architecture impact**: Yes — frontend chat context now has a shared DTO-safe place payload normalization layer before backend AI requests.

---

## [2026-06-15 17:11] — Disable Qwen thinking for OpenAI-compatible provider

- **Branch**: `feat/insight_wf`
- **Prompt**: User clarified they are using qwen2api and want thinking mode disabled to improve response speed.
- **Changes**:
  - Updated `OpenAiCompatibleLlmClientService` to send `enable_thinking: false` and `chat_template_kwargs.enable_thinking: false` for both chat and streaming requests.
  - Added tests that assert the Qwen non-thinking flags are included in non-streaming and streaming OpenAI-compatible SDK calls.
- **Verification**:
  - `npm test -- --runInBand --silent src/modules/ai/providers/openai-compatible-llm-client.service.spec.ts src/modules/ai/llm-provider.selector.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/providers/openai-compatible-llm-client.service.ts`, `backend/src/modules/ai/providers/openai-compatible-llm-client.service.spec.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — OpenAI-compatible LLM calls now default to Qwen non-thinking mode for faster direct responses.

---

## [2026-06-15 17:01] — Rename Freemodel provider to OpenAI-compatible

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to convert the Freemodel provider to OpenAI-compatible by changing the name.
- **Changes**:
  - Renamed the backend runtime provider value from `freemodel` to `openai-compatible` across feature config, runtime selection, Nest config loading, provider class/files, tests, env example, and diagnostic script.
  - Added backward-compatible normalization so existing `freemodel` provider values and `FREEMODEL_*` env vars still map to the OpenAI-compatible client.
  - Updated the feature configuration helper and package script to expose `openai-compatible`.
- **Verification**:
  - `npm test -- --runInBand --silent src/modules/ai/providers/openai-compatible-llm-client.service.spec.ts src/modules/ai/llm-provider.selector.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/.env.example`, `backend/features.json`, `backend/package.json`, `backend/scripts/config-features.js`, `backend/src/app.module.ts`, `backend/src/config/index.ts`, `backend/src/config/runtime-config.ts`, `backend/src/modules/ai/ai.module.ts`, `backend/src/modules/ai/llm-provider.selector.ts`, `backend/src/modules/ai/llm-provider.selector.spec.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/src/config/openai-compatible.config.ts`, `backend/src/modules/ai/providers/openai-compatible-llm-client.service.ts`, `backend/src/modules/ai/providers/openai-compatible-llm-client.service.spec.ts`, `backend/test/test-openai-compatible.ts`
- **Deleted files**: `backend/src/config/freemodel.config.ts`, `backend/src/modules/ai/providers/freemodel-llm-client.service.ts`, `backend/src/modules/ai/providers/freemodel-llm-client.service.spec.ts`, `backend/test/test-freemodel.ts`
- **Architecture impact**: Yes — the app-facing LLM provider name and config namespace changed to OpenAI-compatible while preserving legacy aliases.

---

## [2026-06-13 13:24] — Remove unused frontend recommendation service

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to remove redundant frontend services after confirming backend recommendations are used through search/AI flows.
- **Changes**:
  - Deleted the unused `frontend/src/services/recommendationService.js` API wrapper.
  - Confirmed no frontend references remain for `recommendationService`, `getRecommendations`, or the stale `/recommendations/recommend` endpoint.
  - Kept backend recommendation flows intact; `SearchService`, AI parse, and the AI `recommend_places` tool still use `RecommendationsService`.
- **Verification**:
  - `rg -n "recommendationService|getRecommendations|/recommendations/recommend" frontend\src frontend\test`
  - `npm run build` in `frontend` (existing large chunk warning remains)
- **Modified files**: `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: `frontend/src/services/recommendationService.js`
- **Architecture impact**: Yes — frontend no longer contains a standalone recommendation API service; recommendation ranking remains backend-owned through search and AI flows.

---

## [2026-06-11 22:07] — Add Freemodel direct diagnostic script

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to write and run a direct Freemodel script because app calls were failing.
- **Changes**:
  - Added `backend/test/test-freemodel.ts`, a standalone diagnostic script that loads `.env`, masks the API key in output, checks `/models`, tests raw REST non-streaming `/chat/completions`, tests raw REST streaming, and tests the OpenAI SDK path used by the app.
  - Added `npm run test:freemodel` for repeatable Freemodel diagnostics.
  - Added CLI overrides for `--model=` and `--base-url=` while preserving shell env overrides over `.env` values.
- **Observed results**:
  - Real key: `/v1/models` returned `200 OK` with `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, and `gpt-5.3-codex`.
  - Real key: `/v1/chat/completions` returned `503 Service Unavailable` with body `ChatGPT Service Unavailable` for non-streaming, streaming, and OpenAI SDK calls.
  - Invalid key override: `/v1/chat/completions` returned `401 Unauthorized - Invalid token`, confirming the real key passes auth and the current failure is Freemodel chat/upstream availability or account-side chat access rather than the Nest wrapper.
- **Verification**:
  - `npm run test:freemodel -- --model=gpt-5.5` in `backend`
  - `npm run test:freemodel -- --model=gpt-4o-mini` in `backend`
  - `npm run test:freemodel -- --model=gpt-5.4-mini` in `backend`
  - `npm run test:freemodel -- --model=gpt-5.3-codex` in `backend`
- **Modified files**: `backend/package.json`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/test/test-freemodel.ts`
- **Deleted files**: None
- **Architecture impact**: No — diagnostic tooling only.

---

## [2026-06-11 21:39] — Improve Freemodel 401 diagnostics

- **Branch**: `feat/insight_wf`
- **Prompt**: User shared runtime logs showing Freemodel `streamChat` failing with `401 "Internal server error"`.
- **Findings**:
  - `backend/features.json` selects `ai.provider = "freemodel"`, so the stack trace is using the Freemodel OpenAI-compatible client.
  - The 401 is an upstream Freemodel authentication/authorization response, most likely API key, account access, base URL, or unsupported model access rather than a routing/composer issue.
- **Changes**:
  - Added Freemodel request error normalization so chat and stream errors include HTTP status, provider error type/status/message/code/param, request id, retry-after, model, and base URL.
  - Added an explicit missing-key configuration error before requests.
  - Avoided OpenAI SDK constructor failure for missing Freemodel key by using an internal placeholder and blocking requests with the clearer config error.
  - Added focused tests for missing API key, formatted upstream 401 errors, and normalized runtime config.
- **Verification**:
  - `npm test -- --runInBand --silent src/modules/ai/providers/freemodel-llm-client.service.spec.ts src/modules/ai/providers/gemini-llm-client.service.spec.ts src/modules/ai/llm-provider.selector.spec.ts` in `backend`
  - `npm test -- --runInBand --silent src/modules/ai/place-insight-results.service.spec.ts src/modules/ai/orchestration/ai-orchestrator.service.spec.ts src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/providers/freemodel-llm-client.service.ts`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/src/modules/ai/providers/freemodel-llm-client.service.spec.ts`
- **Deleted files**: None
- **Architecture impact**: No — Freemodel provider behavior is unchanged except for clearer upstream/config error reporting.

---

## [2026-06-11 21:13] — Render insight workflow like compare workflow

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to adjust the insight feature so AI must output structured content in the left panel and a general analysis in the right panel, similar to the compare workflow.
- **Changes**:
  - Changed `ANALYZE_PLACE` composer instructions to request raw `place_insight` JSON instead of Markdown.
  - Added `PlaceInsightResultsService` to parse/fallback-build structured insight payloads and convert `overallAssessment` into chat-friendly analysis text.
  - Updated the orchestrator to suppress raw insight JSON streaming, persist/send only the right-panel analysis, and stream `messageMeta.insightPayload` for the left panel.
  - Added frontend handling for `insightPayload` metadata: `ChatWidget` dispatches `app:open-place-insight`, `HomePage` opens the insight rail panel, and messages expose a manual `Xem insight` button.
  - Updated `PlaceInsightPanel` to render AI-provided insight payloads even when the currently tagged-place state changes.
  - Added focused backend/frontend tests for insight payload parsing, streaming metadata, JSON mode, and hook metadata application.
- **Verification**:
  - `npm test -- --runInBand --silent src/modules/ai/place-insight-results.service.spec.ts src/modules/ai/orchestration/ai-orchestrator.service.spec.ts src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts` in `backend`
  - `npm test -- src/hooks/useStreamingChat.test.jsx` in `frontend`
  - `npm run build` in `backend`
  - `npm run build` in `frontend` (existing large chunk warning remains)
- **Modified files**: `backend/src/modules/ai/ai.module.ts`, `backend/src/modules/ai/dto/chat-response.dto.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.spec.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/PlaceInsightPanel.jsx`, `frontend/src/hooks/useStreamingChat.test.jsx`, `frontend/src/pages/HomePage.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/src/modules/ai/place-insight-results.service.ts`, `backend/src/modules/ai/place-insight-results.service.spec.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — insight workflow now mirrors compare workflow with structured left-panel metadata and separate right-panel summary text.

---

## [2026-06-11 20:38] — Improve Gemini quota error diagnostics

- **Branch**: `feat/insight_wf`
- **Prompt**: User shared Gemini runtime logs showing HTTP 429 failures from router and streaming composer calls.
- **Changes**:
  - Diagnosed the failure as Gemini API quota/rate limiting rather than a missing provider setup.
  - Normalized Gemini Axios errors so chat and streaming failures include HTTP status, provider error status/message/details, and `retry-after` when present.
  - Updated JSON-mode retry warning logs to include normalized Gemini request error details.
  - Added test coverage for formatting Gemini `RESOURCE_EXHAUSTED` quota errors.
- **Verification**:
  - `npm test -- --runInBand src/modules/ai/providers/gemini-llm-client.service.spec.ts src/modules/ai/llm-provider.selector.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/providers/gemini-llm-client.service.ts`, `backend/src/modules/ai/providers/gemini-llm-client.service.spec.ts`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — Gemini provider behavior is unchanged except for clearer upstream error reporting.

---

## [2026-06-11 20:16] — Reorganize backend env example LLM settings

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to adjust the env example after adding Gemini.
- **Changes**:
  - Moved `AI_PROVIDER` and supported provider values before individual LLM credential blocks.
  - Grouped Groq, Cloudflare, FreeModel, and Gemini configuration together for easier setup.
  - Added a Gemini note that `GEMINI_API_KEY` is preferred and `GOOGLE_GENERATIVE_AI_API_KEY` is supported as a fallback.
- **Modified files**: `backend/.env.example`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — documentation/config example only.

---

## [2026-06-11 20:04] — Add Gemini LLM provider

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to add an LLM client for the Gemini API.
- **Changes**:
  - Added `GeminiLlmClientService` implementing `ILlmClient` with Gemini `generateContent` and SSE `streamGenerateContent` support.
  - Added Gemini config namespace and environment variables, including `GEMINI_API_KEY`, `GEMINI_BASE_URL`, `GEMINI_MODEL`, and `GEMINI_TIMEOUT`.
  - Extended runtime provider normalization, NestJS AI module injection, and provider selector support for `AI_PROVIDER=gemini`.
  - Updated the runtime feature configuration script to allow `groq`, `cloudflare`, `freemodel`, and `gemini`.
  - Added focused tests for Gemini payload conversion, JSON response MIME handling, retry behavior, and provider selection.
- **Verification**:
  - `npm test -- --runInBand src/modules/ai/llm-provider.selector.spec.ts src/modules/ai/providers/gemini-llm-client.service.spec.ts` in `backend`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/config/runtime-config.ts`, `backend/src/config/index.ts`, `backend/src/app.module.ts`, `backend/src/modules/ai/ai.module.ts`, `backend/src/modules/ai/llm-provider.selector.ts`, `backend/src/modules/ai/llm-provider.selector.spec.ts`, `backend/scripts/config-features.js`, `backend/.env.example`, `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: `backend/src/config/gemini.config.ts`, `backend/src/modules/ai/providers/gemini-llm-client.service.ts`, `backend/src/modules/ai/providers/gemini-llm-client.service.spec.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — AI provider selection now includes Gemini as a first-class runtime-selectable LLM client.

---

## [2026-06-11 19:45] — Fix truncated chatbox responses

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to check why text in the chatbox was being cut off.
- **Findings**:
  - `useStreamingChat` still appended the generic error marker when an SSE error chunk arrived after partial assistant deltas, even though the earlier `onError` path had already been cleaned up.
  - `LlmResponseComposerService.streamCompose` swallowed upstream stream failures after partial output and allowed the orchestrator to send a normal `finishReason: stop`, making incomplete text look like a completed answer.
  - Chat markdown bubbles kept typography classes directly on the constrained bubble element, so long markdown/link content had weak wrapping safeguards.
- **Changes**:
  - Kept partial assistant text clean for both `onError` failures and SSE error chunks by only appending the generic error marker when no assistant text has been received.
  - Propagated partial-stream failures and non-`stop` finish reasons for non-compare workflows so the stream reports an error instead of persisting/sending a fake successful completion.
  - Added `min-w-0`/`break-words` to chat bubbles and moved Markdown typography styling into an inner wrapper in `ChatWidget` and `PlaceChatPanel`.
  - Added tests covering frontend SSE error chunks after deltas and backend partial-stream failure/length handling.
- **Verification**:
  - `npm test -- src/hooks/useStreamingChat.test.jsx` in `frontend`
  - `npm test -- --runInBand src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts` in `backend` (`EXIT=0`)
  - `npm run build` in `frontend` (existing large chunk warning remains)
  - `npm run build` in `backend`
- **Modified files**: `frontend/src/hooks/useStreamingChat.js`, `frontend/src/hooks/useStreamingChat.test.jsx`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/PlaceChatPanel.jsx`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts`, `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — streaming error/finish handling now preserves visible partial text but reports incomplete streams as errors instead of successful completion, and chat bubble rendering has stronger wrapping behavior.

---

## [2026-06-11 13:52] — Make AI responses more advisory and less context-dumpy

- **Branch**: `feat/insight_wf`
- **Prompt**: User said responses were fast but sentence flow was choppy, and asked to make AI answer like an assistant and analyze more humanly instead of merely repeating provided context.
- **Changes**:
  - Reframed the global composer prompt from a “response formatting engine” to a Vietnamese travel/accommodation assistant that synthesizes evidence into practical advice.
  - Added style rules requiring complete Vietnamese sentences, natural transitions, tradeoff analysis, and clean endings instead of terse labels or raw context dumps.
  - Reworked `ANALYZE_PLACE` instructions to favor verdict, practical interpretation, grouped human analysis, and action-oriented conclusion instead of a long checklist of metadata sections.
  - Added explicit reminders in workflow context prompts to use context as evidence and convert it into advice rather than copying context line by line.
- **Verification**:
  - `npm test -- --runInBand src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — prompt/behavior tuning only.

---

## [2026-06-11 13:47] — Avoid mid-stream error text and raise Cloudflare timeout

- **Branch**: `feat/insight_wf`
- **Prompt**: User observed an insight response ending mid-sentence with an error and asked whether chat output was token-limited.
- **Findings**:
  - Cloudflare provider payloads do not set `max_tokens`, so there is no explicit chat token cap in the application code.
  - The configured Cloudflare timeout was `20s`, which can interrupt longer streaming insight answers.
  - Frontend appended the generic error text even when partial assistant text had already streamed, making partial responses look like broken content.
- **Changes**:
  - Raised Cloudflare AI timeout default and local `.env`/example value from `20` to `60` seconds.
  - Updated `LlmResponseComposerService.streamCompose` to avoid yielding the generic stream error if some assistant text has already been emitted.
  - Updated `useStreamingChat` so partial assistant text remains clean when a stream fails after deltas; the error state is still set, but the chat bubble is not polluted with appended error text.
  - Added frontend coverage for partial stream failure behavior.
- **Verification**:
  - `npm test -- src/hooks/useStreamingChat.test.jsx`
  - `npm test -- --runInBand src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts src/modules/ai/providers/cloudflare-ai-llm-client.service.spec.ts`
  - `npm run build` in `backend`
  - `npm run build` in `frontend` (existing large chunk warning remains)
- **Modified files**: `backend/.env`, `backend/.env.example`, `backend/src/config/cloudflare-ai.config.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `frontend/src/hooks/useStreamingChat.js`, `frontend/src/hooks/useStreamingChat.test.jsx`, `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — streaming error handling now preserves partial output and Cloudflare calls have a longer timeout window.

---

## [2026-06-11 13:37] — Smoke test Cloudflare workflows and harden compare fallback

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to send several mock workflow tests and observe how Cloudflare responds.
- **Changes**:
  - Ran Cloudflare-backed workflow smoke tests for `SEARCH_PLACES`, `COMPARE_PLACES`, and `ANALYZE_PLACE` using mocked/local place context.
  - Found current `.env` model `@cf/openai/gpt-oss-120b` often returns OpenAI-style responses with `reasoning_content` but empty `message.content` for workflow prompts.
  - Verified `@cf/meta/llama-3.1-8b-instruct` returns usable search/analyze Markdown responses, but Cloudflare rejects `response_format` with HTTP 400 and may return Markdown instead of JSON for compare after retry.
  - Updated `CloudflareAiLlmClientService` to retry without `response_format` when Cloudflare rejects the request, not only when extraction finds empty content.
  - Extended `PlaceComparisonResultsService` parsing to extract JSON objects from fenced/surrounded output and added a metadata-based fallback comparison payload when AI compare output is not valid schema JSON.
  - Reduced compare prompt/schema to encourage short JSON and avoid cut-off outputs.
  - Added/updated tests for response-format rejection retry, comparison JSON parsing, metadata fallback comparison payloads, and orchestrator mock dependencies.
- **Verification**:
  - `npm test -- --runInBand src/modules/ai/place-comparison-results.service.spec.ts src/modules/ai/providers/cloudflare-ai-llm-client.service.spec.ts src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts src/modules/ai/orchestration/ai-orchestrator.service.spec.ts src/modules/ai/orchestration/router/llm-task-router.service.spec.ts`
  - `npm run build` in `backend`
- **Modified files**: `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts`, `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.spec.ts`, `backend/src/modules/ai/place-comparison-results.service.ts`, `backend/src/modules/ai/place-comparison-results.service.spec.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.spec.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: `backend/src/modules/ai/place-comparison-results.service.spec.ts`
- **Deleted files**: Temporary smoke scripts under `tmp/` and `backend/test/` after use.
- **Architecture impact**: Yes — compare workflow now has a deterministic metadata fallback for non-JSON Cloudflare responses.

---

## [2026-06-11 13:21] — Compact LLM chat payloads to reduce Cloudflare quota usage

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to shorten chat payloads to save Cloudflare quota.
- **Changes**:
  - Reduced frontend tagged/search place context sent with chat requests to 12 places and 8 amenities per place.
  - Reduced backend sanitized chat place context from 50 to 12 places and 8 amenities per place.
  - Reduced composer prompt size by using compact JSON, lowering search summaries from 20 to 10 top places, lowering reasons/amenities per search result, and removing duplicated active-search context for compare/analyze flows.
  - Reduced composer history from 10 messages/1200 chars to 6 messages/700 chars and capped tagged-place review evidence at 6 reviews/place with 420 chars/review.
  - Updated composer tests to assert compare prompts no longer include duplicated active search context.
  - Verified focused AI tests, frontend streaming chat tests, backend/frontend builds, and Cloudflare-backed chat smoke test.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`, `backend/src/modules/ai/orchestration/composer/search-result-context.builder.ts`, `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.spec.ts`, `.ppms/log-feat-insight_wf.md`, `.ppms/architecture-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — AI chat prompt construction now uses smaller bounded context windows for Cloudflare quota efficiency.

---

## [2026-06-11 13:03] — Update Cloudflare env example

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to update `.env.example` after switching Cloudflare AI to the official API by default.
- **Changes**:
  - Updated `backend/.env.example` Cloudflare AI section to document official API defaults with `CLOUDFLARE_AI_OFFICIAL_BASE_URL`.
  - Replaced the old worker proxy `CLOUDFLARE_AI_BASE_URL` example with opt-in proxy variables `CLOUDFLARE_AI_USE_PROXY` and `CLOUDFLARE_AI_PROXY_BASE_URL`.
  - Set the example model to `@cf/meta/llama-3.1-8b-instruct`, which returned normal content during official API testing.
- **Modified files**: `backend/.env.example`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: No — documentation/config example only.

---

## [2026-06-11 13:01] — Switch Cloudflare AI to official API by default

- **Branch**: `feat/insight_wf`
- **Prompt**: User created a Cloudflare API token and asked to adjust code to use the official Cloudflare API instead of the custom worker proxy.
- **Changes**:
  - Changed Cloudflare AI config/client behavior to use the official `https://api.cloudflare.com/client/v4/accounts/<account>/ai/v1` endpoint by default.
  - Added explicit proxy opt-in via `CLOUDFLARE_AI_USE_PROXY=true` with `CLOUDFLARE_AI_PROXY_BASE_URL`/legacy `CLOUDFLARE_AI_BASE_URL` for custom worker proxy usage.
  - Updated `test/test-cloudflare.ts` to test official mode by default and avoid low `max_tokens` values that cut off reasoning-heavy models before final `message.content` is emitted.
  - Verified official Cloudflare AI connection succeeds and returns content for `@cf/openai/gpt-oss-120b` with the current token/account.
- **Modified files**: `backend/src/config/cloudflare-ai.config.ts`, `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts`, `backend/test/test-cloudflare.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — Cloudflare AI provider now defaults to official Cloudflare API and treats custom worker proxy as opt-in.

---

## [2026-06-11 12:28] — Add deterministic router fallback for Cloudflare empty choices

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported Cloudflare still returning an empty/unsupported OpenAI-style response with top-level `choices`, causing router fallback to `GENERAL_CHAT`.
- **Changes**:
  - Expanded Cloudflare response shape diagnostics and extraction to inspect choice/message-level fields such as `choice.content`, `choice.response`, `message.response`, and `message.text`.
  - Added deterministic intent fallback in `LlmTaskRouterService` so explicit compare/analyze/search queries still route correctly when the LLM returns empty content or throws.
  - Extracted common comparison criteria (`rating`, `location`, `amenities`, `quiet`, `cleanliness`, `price`) from user text for fallback `COMPARE_PLACES` routing.
  - Added router fallback tests covering empty Cloudflare content for explicit compare and thrown LLM errors for analysis.
- **Modified files**: `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts`, `backend/src/modules/ai/orchestration/router/llm-task-router.service.ts`, `backend/src/modules/ai/orchestration/router/llm-task-router.service.spec.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/src/modules/ai/orchestration/router/llm-task-router.service.spec.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — task routing now has deterministic fallback behavior when the configured LLM provider returns unusable router output.

---

## [2026-06-11 12:24] — Fix Cloudflare empty router response handling

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported `LlmTaskRouterService` logging `Unexpected end of JSON input. Clean content was: ""` when using Cloudflare as the AI provider.
- **Changes**:
  - Updated `CloudflareAiLlmClientService` to extract text from multiple Cloudflare/OpenAI-compatible response shapes, including `choices[0].message.content`, top-level response/content/text fields, and Workers AI `result.response` envelopes.
  - Added explicit upstream error extraction and clear errors when Cloudflare returns an empty/unsupported response shape instead of silently returning empty content.
  - Added retry without `response_format` when Cloudflare returns no usable content for JSON-mode requests, allowing the router prompt to still obtain JSON from models/endpoints that do not support `response_format` reliably.
  - Added focused Cloudflare provider tests for Workers AI response envelopes and JSON-mode retry behavior.
- **Modified files**: `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts`, `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.spec.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.spec.ts`
- **Deleted files**: None
- **Architecture impact**: Yes — Cloudflare AI provider response parsing and JSON-mode compatibility behavior changed.

---

## [2026-06-11 12:15] — Prevent hidden workflow prompts from reappearing in history

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported that the generated compare prompt such as `So sánh các địa điểm tôi đã tag...` still appeared after parse/workflow execution.
- **Changes**:
  - Traced the remaining issue to backend conversation persistence: frontend hid the generated prompt locally, but backend still stored it as a normal user message and history reload made it visible again.
  - Added `hideUserMessage` to frontend chat/stream API payloads and backend `ChatRequestDto`.
  - Updated `AiOrchestratorService` to skip appending hidden generated user prompts to conversation history while still using their text as the LLM `userQuery` for workflow execution.
  - Added backend coverage to ensure hidden generated compare prompts are not stored in stream history and frontend coverage to ensure `hideUserMessage` reaches `streamChat`.
- **Modified files**: `frontend/src/services/aiService.js`, `frontend/src/hooks/useStreamingChat.js`, `frontend/src/hooks/useStreamingChat.test.jsx`, `backend/src/modules/ai/dto/chat-request.dto.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.spec.ts`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — chat API requests now support hidden generated user turns that execute workflows without being persisted to transcript history.

---

## [2026-06-11 12:09] — Implement intent parse message handoff

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked to read and execute `tmp/handoffs/intent-parse-message-handoff.md`, which specified keeping the original user message visible while hiding auto-generated workflow execution prompts.
- **Changes**:
  - Added `hideUserMessage` support to `useStreamingChat.sendMessage()` so generated workflow execution prompts can be appended as hidden transcript turns.
  - Updated `ChatWidget` to stop hiding original workflow trigger messages from `onWorkflowAction` and instead pass `hideUserMessage: true` only when executing generated search/compare/analyze prompts after wizard confirmation.
  - Removed the now-unused workflow-trigger hiding path from `useStreamingChat`.
  - Updated hook tests so normal workflow trigger turns remain visible and explicitly hidden generated prompts are marked `hidden`/`intentTrigger`.
- **Modified files**: `frontend/src/hooks/useStreamingChat.js`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/hooks/useStreamingChat.test.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — chat transcript visibility now distinguishes user-authored intent turns from frontend-generated workflow execution prompts.

---

## [2026-06-11 11:35] — Hide workflow intent trigger turns globally

- **Branch**: `feat/insight_wf`
- **Prompt**: User requested that after chatbox wizard intent extraction, no workflow should show the trigger/output message; the chat should only show the final LLM answer after workflow execution.
- **Changes**:
  - Replaced the search-only `hideSearchWorkflowTrigger` behavior with workflow-wide `hideWorkflowTrigger` handling in `useStreamingChat`.
  - Updated `ChatWidget` so compare and analyze workflow prompts also request hiding the intent trigger turn, matching search behavior.
  - Updated streaming hook tests to cover hiding for a non-search workflow trigger.
- **Modified files**: `frontend/src/hooks/useStreamingChat.js`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/hooks/useStreamingChat.test.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — workflow intent extraction display behavior is now shared across all wizard workflows.

---

## [2026-06-11 11:28] — Restore compare table fallback rendering

- **Branch**: `feat/insight_wf`
- **Prompt**: User asked why the current compare workflow no longer showed the comparison table in the left panel and no longer showed the `Xem chi tiết` button in chatbot messages.
- **Changes**:
  - Identified that `backend/features.json` is in test mode with `chat.persistHistory=false`, so compare JSON could be parsed into chat text but no persisted `comparisonResultId` was created for frontend table loading.
  - Added `comparisonPayload` to chat response and stream metadata so compare tables can still render directly when no persisted DB result exists.
  - Updated `ChatWidget` to auto-open the compare panel and show `Xem chi tiết` when either `comparisonResultId` or inline `comparisonPayload` is present.
  - Updated `HomePage` to render the left comparison panel directly from inline payload before falling back to `GET /api/v1/ai/comparisons/:id`.
  - Added backend and frontend tests covering payload-only compare metadata.
- **Modified files**: `backend/src/modules/ai/dto/chat-response.dto.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`, `backend/src/modules/ai/orchestration/ai-orchestrator.service.spec.ts`, `frontend/src/components/ChatWidget.jsx`, `frontend/src/pages/HomePage.jsx`, `frontend/src/hooks/useStreamingChat.test.jsx`, `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Created files**: None
- **Deleted files**: None
- **Architecture impact**: Yes — comparison workflow SSE metadata can now carry inline table payloads as a non-persistence fallback.

---

## [2026-06-10 21:35] — Fix workspace panel labels and auto-open comparison table

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported that all panel names had become saved-place labels and that the compare panel did not show the table after running the comparison workflow.
- **Changes**:
  - Replaced hard-coded saved-place copy in `LeftContextPanel` with per-panel metadata for search results, compare, insight, and saved places.
  - Restored generic workspace rail accessibility/close labels while preserving the active panel label in the close button.
  - Added `onAssistantMeta` support to `useStreamingChat` so consumers can react when streamed assistant metadata arrives.
  - Wired `ChatWidget` to auto-dispatch `app:open-place-comparison` once per streamed `comparisonResultId`, causing `HomePage` to fetch and render the structured comparison table in the compare panel immediately after workflow completion.
  - Added a targeted `useStreamingChat` test covering assistant metadata notification and message metadata application.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/LeftContextPanel.jsx`, `frontend/src/components/WorkspaceRail.jsx`, `frontend/src/hooks/useStreamingChat.js`, `frontend/src/hooks/useStreamingChat.test.jsx`
- **Created files**: `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Deleted files**: None
- **Architecture impact**: Yes — frontend streaming chat now exposes assistant metadata for workflow-driven panel behavior, and comparison workflow results auto-open in the compare panel.

---
