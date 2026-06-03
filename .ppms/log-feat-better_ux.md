# Persistent Project Memory System - Changelog (Branch: feat-better_ux)

## [2026-06-02 18:05] Modern Edge-Attached Workspace Tab
- **Branch**: `feat/better_ux`
- **Prompt**: Put the collapsed Workspace control in the center and attached to the side for a modern feel.
- **Changes**:
  - Converted the collapsed Workspace opener into a vertical edge tab attached to the left side of the map.
  - Centered the tab vertically with `top-1/2` and vertical text orientation.
  - Removed the previous bottom-left floating Workspace opener position.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI positioning refinement only.

---

## [2026-06-02 18:03] Move Collapsed Workspace Button to Bottom Left
- **Branch**: `feat/better_ux`
- **Prompt**: Improve the collapsed Workspace button because it looked awkward at the top.
- **Changes**:
  - Removed the collapsed Workspace opener from the top desktop flex row.
  - Added a bottom-left floating Workspace opener above the geolocation control when the workspace panel is collapsed.
  - Kept the bottom-right collapsed AI assistant opener unchanged.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI positioning refinement only.

---

## [2026-06-02 18:02] Move Collapsed AI Assistant Button to Bottom Right
- **Branch**: `feat/better_ux`
- **Prompt**: Move the collapsed AI assistant button to the bottom.
- **Changes**:
  - Removed the collapsed AI assistant opener from the top desktop flex row.
  - Added a bottom-right floating `Trợ lý AI` opener when the chat panel is collapsed.
  - Kept the existing desktop panel and geolocation offsets unchanged.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI positioning refinement only.

---

## [2026-06-02 18:00] Chat History External Popout
- **Branch**: `feat/better_ux`
- **Prompt**: Make chat history open outside the chatbox instead of covering it.
- **Changes**:
  - Changed `AIChatPanel` root to allow overflow so the history panel can render outside the chatbox.
  - Moved the conversation history panel to a `right-full` popout positioned to the left of the chatbox.
  - Kept an invisible fixed backdrop for outside-click close behavior without covering chat contents.
  - Preserved chatbox width and content visibility while history is open.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/components/AIChatPanel.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI behavior refinement only.

---

## [2026-06-02 17:58] Chat History Overlay and Header Cleanup
- **Branch**: `feat/better_ux`
- **Prompt**: Remove the chatbox delete button and make chat history open without pushing the chatbox.
- **Changes**:
  - Removed the header-level clear/delete button from `AIChatPanel`; deletion remains available only on individual history items.
  - Converted the conversation history from a flex side panel into an absolute overlay inside the chat panel.
  - Added a lightweight backdrop button so clicking outside the history overlay closes it without changing chatbox width.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/components/AIChatPanel.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI behavior refinement only.

---

## [2026-06-02 17:56] Restore Chat Bubble Animations
- **Branch**: `feat/better_ux`
- **Prompt**: Restore the chat bubble effects that were lost during UI cleanup.
- **Changes**:
  - Added dedicated `bubbleInUser` and `bubbleInAssistant` keyframes in `frontend/src/index.css`.
  - Added `chat-bubble-user` and `chat-bubble-assistant` classes with directional entrance animation and subtle bubble shadow.
  - Applied the bubble classes to user and assistant messages in `AIChatPanel`.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/components/AIChatPanel.jsx`
  - `frontend/src/index.css`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI animation refinement only.

---

## [2026-06-02 17:53] Restore Professional UI Icons Without Emoji
- **Branch**: `feat/better_ux`
- **Prompt**: Keep professional icons, remove only emoji-like icons.
- **Changes**:
  - Restored lucide professional icons across the AI workspace shell, navbar, chat panel, wizard cards, wizard inputs, and workspace content panels.
  - Kept emoji-style symbols removed from the edited AI workspace UI files.
  - Preserved the smoother panel animations, default collapsed sidebars, and aligned desktop offsets from the previous UI cleanup.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/AIChatPanel.jsx`
  - `frontend/src/components/AIWorkspacePanel.jsx`
  - `frontend/src/components/SearchResultsPanel.jsx`
  - `frontend/src/components/PinnedPlacesPanel.jsx`
  - `frontend/src/components/ComparisonPanel.jsx`
  - `frontend/src/components/FoodRecommendationPanel.jsx`
  - `frontend/src/components/ItineraryPanel.jsx`
  - `frontend/src/components/AreaInsightPanel.jsx`
  - `frontend/src/components/BudgetPanel.jsx`
  - `frontend/src/components/chat/WorkflowPromptCard.jsx`
  - `frontend/src/components/chat/WizardStepCard.jsx`
  - `frontend/src/components/chat/WizardSummaryCard.jsx`
  - `frontend/src/components/chat/wizard-inputs/ChipMultiSelector.jsx`
  - `frontend/src/components/chat/wizard-inputs/BudgetCardSelector.jsx`
  - `frontend/src/components/chat/wizard-inputs/LocationInput.jsx`
  - `frontend/src/components/chat/wizard-inputs/GuestStepper.jsx`
  - `frontend/src/components/chat/wizard-inputs/CriteriaChecklist.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — visual refinement only.

---

## [2026-06-02 17:42] Cleaner Text-Only AI Workspace UI
- **Branch**: `feat/better_ux`
- **Prompt**: Remove UI icons, make component appearance smoother, hide sidebars by default, and align offsets consistently.
- **Changes**:
  - Removed icon/emoji-heavy UI from the main AI workspace shell, chat panel, navbar, wizard cards, wizard inputs, and workspace panels.
  - Changed default desktop state so both workspace and chat sidebars start collapsed, exposing the map first.
  - Standardized desktop panel sizing/offsets with a 20px gutter, 380px workspace width, 400px chat width, and geolocator alignment that respects the workspace panel.
  - Added smoother panel/control entrance animations in `frontend/src/index.css`.
  - Replaced icon-only controls with text controls for better alignment and readability.
  - Verified frontend production build.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/AIChatPanel.jsx`
  - `frontend/src/components/AIWorkspacePanel.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SearchResultsPanel.jsx`
  - `frontend/src/components/PinnedPlacesPanel.jsx`
  - `frontend/src/components/ComparisonPanel.jsx`
  - `frontend/src/components/FoodRecommendationPanel.jsx`
  - `frontend/src/components/ItineraryPanel.jsx`
  - `frontend/src/components/AreaInsightPanel.jsx`
  - `frontend/src/components/BudgetPanel.jsx`
  - `frontend/src/components/chat/WorkflowPromptCard.jsx`
  - `frontend/src/components/chat/WizardStepCard.jsx`
  - `frontend/src/components/chat/WizardSummaryCard.jsx`
  - `frontend/src/components/chat/wizard-inputs/ChipMultiSelector.jsx`
  - `frontend/src/components/chat/wizard-inputs/BudgetCardSelector.jsx`
  - `frontend/src/components/chat/wizard-inputs/LocationInput.jsx`
  - `frontend/src/components/chat/wizard-inputs/GuestStepper.jsx`
  - `frontend/src/components/chat/wizard-inputs/CriteriaChecklist.jsx`
  - `frontend/src/hooks/useWorkflowWizard.js`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-better_ux.md`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — updates the default AI workspace layout behavior and frontend visual system conventions.

---

## [2026-06-02 17:24] English Runtime Config Script Text
- **Branch**: `feat/better_ux`
- **Prompt**: Change the runtime config script text to English.
- **Changes**:
  - Replaced Vietnamese/romanized Vietnamese prompts and output messages in `backend/scripts/config-features.js` with English text.
  - Smoke-tested the interactive script with empty input to keep the current config.
- **Modified files**:
  - `backend/scripts/config-features.js`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — text-only script UI change.

---

## [2026-06-02 17:20] Runtime Config Profiles for Test and Production
- **Branch**: `feat/better_ux`
- **Prompt**: Split SerpAPI/local search behavior clearly between test and production and clean up runtime configuration.
- **Changes**:
  - Added centralized `RuntimeConfigModule` / `RuntimeConfigService` and `readRuntimeConfig()` helper for `backend/features.json`.
  - Replaced repeated direct `features.json` reads in SerpAPI search, place media/reviews, Overpass amenities, and AI provider config.
  - Converted `features.json` to an explicit `environment`, `search`, `externalApis`, and `ai` schema.
  - Updated `SearchService` so `test` mode uses local fixture data and never calls external providers by default, while `production` mode disables local fixture loading and can use SerpAPI by `fallback`, `always`, or `never` policy.
  - Updated the config script to switch between `test` and `production` profiles instead of toggling loosely related flags.
  - Verified backend build and config script smoke test.
- **Modified files**:
  - `backend/features.json`
  - `backend/scripts/config-features.js`
  - `backend/src/app.module.ts`
  - `backend/src/config/groq.config.ts`
  - `backend/src/common/tools/nearby-amenities.tool.ts`
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/modules/search/search.service.ts`
  - `backend/src/modules/search/serpapi-hotels.service.ts`
  - `.ppms/architecture-feat-better_ux.md`
  - `.ppms/log-feat-better_ux.md`
- **Created files**:
  - `backend/src/config/runtime-config.ts`
  - `backend/src/config/runtime-config.service.ts`
  - `backend/src/config/runtime-config.module.ts`
- **Deleted files**: (none)
- **Architecture impact**: Yes — runtime feature flags are now centralized and define distinct test/production data-provider behavior.

---

## [2026-06-02 17:05] Workflow Wizard Wiring Completion
- **Branch**: `feat/better_ux`
- **Prompt**: Continue Claude Opus' unfinished workflow feature implementation after quota ran out, using PPMS for context.
- **Changes**:
  - Completed AI workspace runtime wiring by passing `onCreateItinerary` into `AIWorkspacePanel` and declaring it as a supported prop.
  - Fixed food recommendation map focus callbacks that referenced an undefined `center` variable; callbacks now fall back to user location or the Hanoi fallback center.
  - Synced `useStreamingChat` conversation IDs with `ConversationContext` in `HomePage`, including selected conversation loading and new conversation creation.
  - Added `app:select-place` handling in `HomePage` so place links emitted by AI markdown can focus the map/workspace item.
  - Verified frontend and backend production builds.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/AIWorkspacePanel.jsx`
  - `.ppms/architecture-feat-better_ux.md`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — completes frontend workflow integration between AI chat, conversation history, workspace panels, and map focus events.

---

## [2026-06-02 15:48] Backend AI Intent Expansion — COMPARE_PLACES & ANALYZE_PLACE
- **Prompt**: Implement two new AI intents: place comparison (so sánh) and place analysis with user preferences (phân tích + ưu nhược điểm).
- **Changes**:
  - **Router**: Expanded `ROUTER_SYSTEM_PROMPT` with 2 new workflow definitions, output schema parameters (`placeNames`, `criteria`, `placeName`, `preferences`), routing rules, and 5 new few-shot examples. Updated multi-turn follow-up instruction to handle ANALYZE_PLACE preference responses.
  - **Workflow Registry**: Added `COMPARE_PLACES` and `ANALYZE_PLACE` as zero-step (composer-only) workflows.
  - **Orchestrator**: Added `workflowAction` metadata emission for both `processQuery` and `streamQuery` methods. Frontend receives `{ type: 'compare' | 'analyze', parameters }` via SSE.
  - **Composer**: Added `COMPARE_COMPOSER_PROMPT` (structured table comparison with evidence-backed strengths/weaknesses) and `ANALYZE_COMPOSER_PROMPT` (two-phase: Phase 1 asks preferences, Phase 2 analyzes with review evidence). Added `getWorkflowInstructions()` method and injected workflow-specific system messages in `buildMessages()`.
  - **DTO**: Added `workflowAction` field to both `ChatResponseDto` and `StreamChunkDto`.
- **Modified Files**:
  - `backend/src/modules/ai/orchestration/router/llm-task-router.service.ts`
  - `backend/src/modules/ai/orchestration/engine/workflow-registry.ts`
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
  - `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`
  - `backend/src/modules/ai/dto/chat-response.dto.ts`
- **Architecture Impact**: The AI orchestration pipeline now supports 4 intents (up from 2). COMPARE and ANALYZE are composer-heavy workflows that leverage the existing tagged-place RAG pipeline without requiring new tool implementations. The two-phase ANALYZE flow uses conversation history to maintain state across turns.

## [2026-06-02 15:30] Collapsible Workspace Panels & Dynamic Geolocator Alignment
- **Prompt**: Adjust so that panels can be hidden and the 'back to current location' button does not overlap with the expanded left workspace panel.
- **Changes**:
  - Implemented `isWorkspaceExpanded` and `isChatExpanded` states in `HomePage.jsx` to manage side-panel visibility.
  - Added toggle collapse buttons inside headers: `ChevronLeft` in `AIWorkspacePanel.jsx` and `ChevronRight` in `AIChatPanel.jsx`.
  - Added mini floating toggle buttons (`Mở Workspace`, `Mở Chat AI`) on the map sides when side panels are collapsed.
  - Repositioned the geolocator navigation control `left` coordinate to `422px` if `isWorkspaceExpanded` is true on desktop, and fallback to `20px` if it is collapsed, preventing overlaps.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/components/AIWorkspacePanel.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/components/AIChatPanel.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/pages/HomePage.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/architecture-feat-better_ux.md` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: The AI travel workspace layout is now highly flexible, allowing desktop users to toggle overlay sidebars on-demand to inspect the maps full viewport, with adaptive geolocator button alignment.

## [2026-06-02 18:15] Stronger Chat Bubble Entrance
- **Prompt**: The chat bubble animation still is not visible enough.
- **Changes**:
  - Increased the bubble entrance distance and added a mid-point overshoot so the motion reads as a real bubble pop instead of a subtle fade.
  - Added staggered delays to chat message rows and explicit `animation-fill-mode: both` on message wrappers and bubbles so the entrance effect stays visible during render.
  - Kept the bubble layout unchanged so the update does not affect chatbox offsets or panel sizing.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/components/AIChatPanel.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/index.css` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: Chat messages now mount with a more legible entrance animation, improving perceived responsiveness without changing layout geometry.

## [2026-06-04 04:42] Deferred Search Workflow Execution
- **Prompt**: Fix the place search workflow so search does not run before AI workflow cards extract and confirm user intent.
- **Changes**:
  - Added `workflowExecution` to `ChatRequestDto` so the frontend can explicitly mark a workflow as confirmed and pass final wizard parameters.
  - Changed `AiOrchestratorService` so `SEARCH_PLACES` emits `workflowAction: { type: 'search' }` on the initial routed message and only executes `hybrid_search -> geocode_anchor -> recommend_places` when `workflowExecution.confirmed` is true.
  - Updated streaming/non-streaming orchestration to avoid emitting `searchAction` until the confirmed execution pass has completed tool execution.
  - Updated `useStreamingChat` and `aiService` to forward `workflowExecution` and `wizardPreferences` through chat/stream requests.
  - Updated `HomePage` so search workflow cards open from `workflowAction.type === 'search'`, removed premature `pendingSearchResults`, and sends the wizard summary as the confirmed search criteria.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/ai/dto/chat-request.dto.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/ai/orchestration/ai-orchestrator.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/hooks/useStreamingChat.js` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/services/aiService.js` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/pages/HomePage.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/architecture-feat-better_ux.md` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: Place search is now a two-pass workflow: natural language routing proposes the workflow and extracts initial slots; confirmed wizard execution sends final slots back to the backend and only then runs search tools and emits map results.

## [2026-06-04 05:01] Merged Team Local Fixture Dataset
- **Prompt**: Merge team test data from `tmp/data` while preserving the JSON-to-image filename linking rule; delete the old fixture first.
- **Changes**:
  - Reset the old `backend/test/fixtures/data.json` and `backend/test/fixtures/images` contents.
  - Merged contributor folders `d`, `ha`, `hi`, and `t` into one fixture dataset with 160 places.
  - Renamed copied images to global JSON indexes (`0-*` through `159-*`) and updated every place `images` array to match the copied files.
  - Copied only images referenced by JSON, producing 556 fixture images.
  - Corrected two source reference mismatches during merge: `d#34 34-4-.jpg -> 34-4.jpg` and `t#23 23-2.jpg -> 23-2.png`.
  - Validated that every merged JSON image reference exists and starts with the correct record index.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/backend/test/fixtures/data.json` (Recreated)
  - `S:/workspace/computational_thinking/proj/mono/backend/test/fixtures/images/` (Recreated)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/architecture-feat-better_ux.md` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: Local fixture search now uses the merged 160-place team dataset with stable local image references served through the existing backend test-data image endpoint.
