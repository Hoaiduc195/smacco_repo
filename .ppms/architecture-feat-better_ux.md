# Project Architecture: Smacco — Smart Travel & Accommodation Platform (Branch: feat-better_ux)

> Last updated: 2026-06-10 10:56
> Branch: feat-better_ux

## Overview
A modular monolith web application for discovering accommodations, dining spots, and smart itinerary planning under the brand name **Smacco**. Features AI-powered chat, multi-provider search, interactive maps, Firebase authentication, saved places, check-ins, Q&A, and user-contributed content management. Built with a React (Vite) frontend and a NestJS backend backed by PostgreSQL with pgvector.

This branch (`feat-better_ux`) refactors the layout into an **AI-agent-first travel workspace**, placing the AI chat panel as the central control surface on the right, and using an accordion-style left AI Workspace Panel to display structured AI-generated outputs (search results, comparison tables, itineraries, area insights, food recommendations, and budgets) synced with Map markers.

It supports collapsing panels on desktop to free up map screen space and dynamically moves the geolocation tracker button coordinates to prevent overlaps.

The default workspace state now prioritizes the map: both side panels start collapsed and can be opened with compact text controls. The AI workspace UI uses text-first controls instead of decorative icons, with consistent 20px desktop gutters and smoother panel entrance animations.

## Tech Stack

| Component   | Technology                          | Version   |
|-------------|-------------|-----------|
| Frontend    | React (Vite + Tailwind CSS)         | 18.2      |
| Backend     | NestJS (TypeScript)                 | 10.x      |
| Database    | PostgreSQL + pgvector               | 16        |
| ORM         | Prisma                              | 7.6.0     |
| AI/LLM      | OpenRouter / Groq integrations      | —         |
| Auth        | Firebase Admin SDK + Firebase Client| 12.x / 10.7 |
| Maps        | Mapbox GL + OSM/CARTO fallback      | 3.24      |
| Search      | Goong + OSM + SerpAPI integrations  | —         |
| Container   | Docker Compose                      | —         |

## System Architecture

### Frontend
- **Framework**: React 18 + Vite 7 + Tailwind CSS 3.4.
- **Routing**: `react-router-dom` v6 with public intro/auth routes and protected application routes.
- **State Management**: React Context API (`AuthContext`, `TravelDataContext`, `ConversationContext`).
- **Main Layout**: `MainLayout` now supports the AI-agent-first structure on desktop (Map background, left AI Workspace Panel, right AI Chat control panel) and is responsive for mobile/tablet.
- **Workspace Layout Defaults**: `HomePage` initializes both `AIWorkspacePanel` and `AIChatPanel` collapsed on desktop. Panels use a consistent 20px gutter, 380px left workspace width, 400px right chat width, and matching geolocator offsets.
- **Visual System**: The AI workspace branch now uses text-only shell controls and reduced iconography in chat/workspace/wizard panels. `index.css` defines panel/control entrance animations for smoother component appearance.
- **Workflow Wizard**: `useWorkflowWizard` coordinates detected AI intents through confirmation, slot collection, summary review, and execution. The visible `ChatWidget` now owns the workflow proposal cards and wizard flow directly from backend `workflowAction` metadata, then sends confirmed workflow payloads back through `workflowExecution`.
- **Search Context Fallback**: If no accommodations are explicitly tagged/pinned (`taggedPlaces` is empty), `HomePage` maps and forwards the currently loaded search results (`places`) as fallback context (`taggedPlaceIds` and `taggedPlaces` payloads) in SSE chat requests. This ensures the AI always has the latest search context in follow-up chat turns.
- **Components**:
  - `ChatWidget` — The single workflow-capable AI chat surface. Supports history toggle, close, workflow proposal cards, wizard step/summary cards, quick replies, streaming replies, and conversation actions. Tagged-place context supports up to 5 places and renders as a vertical pill stack to the left of the open chat frame. Dragged place cards absorb toward the message input area when dropped into the open chat.
  - `AIWorkspacePanel` — Multi-accordion left workspace displaying panels for search results, comparison, pinned places, itineraries, insights, budgets, and food recommendations. Has collapse controls.
  - `SearchResultsPanel` — Renders accommodation search results with match scores, AI reasoning, and sync.
  - `AmenityBadge` — Shared amenity display component that normalizes fixture keys and SerpAPI-style amenity strings to consistent labels and Lucide icons.
  - `ComparisonPanel` — Displays comparisons of price, location, pros/cons, and conditional AI choices.
  - `PinnedPlacesPanel` — Lists saved accommodations with bulk options.
  - `ItineraryPanel` — Detail 3-day travel plan with schedule, route map triggers, and options.
  - `AreaInsightPanel` — Structural review of neighborhood characteristics, safety, and transit.
  - `BudgetPanel` — Expense estimates including room, transport, food, ticket pricing, and saving tips.
  - `FoodRecommendationPanel` — Food recommendation cards near accommodations.
  - `MapComponent` — Background map displaying markers synced with active workspace items.
  - `Navbar` — Simplified top header with a command-style AI input search bar.
- **Cross-component Events**:
  - `app:select-place` from AI markdown place links focuses the map marker and opens the relevant workspace panel.
  - `app:chat-send` and `app:chat-prefill` let `HomePage` and workspace actions route all AI prompts through the visible `ChatWidget` instead of a hidden page-local chat state.
  - Conversation IDs emitted by `useStreamingChat` are mirrored into `ConversationContext`, keeping SSE chat requests, selected history, and new conversation creation aligned.
- **Chat Result Cache**: `ChatWidget` now keeps the latest confirmed search results in a local ref and uses that as the primary context source for follow-up turns, only falling back to `window.activeSearchResults` when needed. This reduces context loss in test mode when follow-up questions are asked immediately after a search.

### Backend — AI Orchestration Pipeline
- **Runtime Config**: `RuntimeConfigModule` exposes `RuntimeConfigService`, backed by `backend/features.json`. The schema separates `environment`, `search`, `chat`, `externalApis`, and `ai` settings.
- **AI Conversation Ownership**: Authenticated AI chat/conversation endpoints resolve the Firebase user into an app-user scope. Persisted conversations are filtered by `Conversation.userId`; memory/test-mode conversations are scoped by Firebase UID. The conversation store rejects writes to conversations owned by another user and can attach legacy unowned conversations to the current user.
- **AI Payload Limits**: `ChatRequestDto` constrains chat text, tagged context arrays, tagged place fields, user context, and wizard preferences with agentic-style budgets: up to 8,000 characters of user text and up to 50 place context items. `AiOrchestratorService` also sanitizes/truncates incoming chat payloads before routing/composition so LLM context size remains large but bounded even when bypassing Nest validation.
- **AI Context Budget**: Search result context summarizes up to 20 top places with expanded amenity evidence, active search-result context can include up to 50 places, and tagged persisted places can contribute up to 16 selected reviews each for compare/analyze workflows.
- **Runtime Profiles**:
  - `test`: uses only `backend/test/fixtures/data.json` fixture data and `backend/test/fixtures/images`; local database and external providers are disabled, and chat history persistence is forced off.
  - `production`: uses production database/cache, disables local fixture loading, and can call SerpAPI/Overpass according to `externalProviderPolicy` (`fallback`, `always`, or `never`). Chat history persistence is configurable with `chat.persistHistory`.
- **Local Fixture Dataset**: `backend/test/fixtures/data.json` contains the merged team accommodation dataset with 160 places. Local fixture images live in `backend/test/fixtures/images/`, use global record-index filenames (`<recordIndex>-<imageIndex>.<ext>`), and are served through `GET /api/v1/places/test-data/images/:filename`.
- **Search Provider Policy**: `SearchService` always respects `search.localDatabase`, `search.localFixture`, and `search.externalProviderPolicy`. `environment: test` is forcibly normalized to fixture-only mode (`localDatabase: false`, `localFixture: true`, external policy `never`) and skips Goong geocoding. In that mode, search filters matching places from the fixture dataset using progressive fallbacks (1: location + type + query, 2: location only, 3: type + query anywhere, 4: full dataset), then shuffle-selects up to 12 places. This keeps the UI results and the LLM context aligned. Production excludes DB rows with `source = local` from search results to avoid leaking test fixture data.
- **Fixture-Only Place Reads**: `LocalFixturePlacesService` owns fixture JSON loading/caching, filtering, local place mapping, review mapping, and photo URL generation. In fixture-only mode, `PlacesService` delegates `findAll`, `findOne(local-*)`, `findReviews(local-*)`, `findPhotos(local-*)`, and guarded local `create()` calls to this provider without Prisma reads or writes.
- **Amenity Persistence**: Fixture places expose amenities at the top level and in `rawSerpApiPropertyDetails`. External places can send optional `amenities` through `POST /api/v1/places`; `PlacesService` stores them in existing `rawSerpApiPropertyDetails.amenities` JSON and backfills that JSON when an existing source/fuzzy-matched place lacks amenities, avoiding a schema migration while preserving SerpAPI/fixture compatibility.
- **Router** (`LlmTaskRouterService`): Classifies user intent via LLM into workflow IDs.
  - Supported intents: `SEARCH_PLACES`, `GENERAL_CHAT`, `COMPARE_PLACES`, `ANALYZE_PLACE`
  - Uses conversation history for multi-turn intent continuations (e.g., ANALYZE_PLACE preference follow-up).
- **Workflow Engine** (`WorkflowEngineService`): Executes deterministic tool pipelines defined in `WORKFLOW_REGISTRY`.
  - `SEARCH_PLACES`: `hybrid_search` → `geocode_anchor` → `recommend_places`
  - `COMPARE_PLACES`: Zero-step (composer-only, uses tagged place context)
  - `ANALYZE_PLACE`: Zero-step, two-phase (Phase 1: ask preferences, Phase 2: analyze with evidence)
  - `GENERAL_CHAT`: Zero-step (straight to composer)
- **Composer** (`LlmResponseComposerService`): Generates final Markdown response with workflow-specific system prompts injected via `getWorkflowInstructions()`.
- **Active Result Context Bridging**: For follow-up turns after a search, `LlmResponseComposerService` now also builds an `[ACTIVE SEARCH RESULTS CONTEXT]` block from frontend metadata (`taggedPlaces` / fallback active search results). This lets the LLM reason over the current result set even when those places have not been persisted in the database yet, which is especially important in fixture-only test mode.
- **Orchestrator** (`AiOrchestratorService`): Coordinates the pipeline. For `SEARCH_PLACES`, the initial routed request yields `workflowAction: { type: 'search' }` for frontend intent confirmation, stops before running the response composer, and therefore emits no assistant prose on that first turn. Confirmed wizard requests carry `workflowExecution.confirmed`, execute `hybrid_search -> geocode_anchor -> recommend_places`, then yield `searchAction` with final results. Compare/analyze intents still use `workflowAction` metadata for their cards.
- **LLM Providers**: `CloudflareAiLlmClientService` normalizes non-stream and stream content parts into plain strings before returning through `ILlmClient`, so orchestration/router code can treat provider output uniformly.
- **Conversation Persistence**: `ConversationStoreService` now respects `chat.persistHistory`. When disabled, chat turns are kept only in the in-process memory cache and are never written back to Prisma. `ConversationsService` mirrors that behavior so list/create/read/delete conversation endpoints operate against memory-only conversations during test runs.
- **Tools**: `hybrid_search`, `geocode_anchor`, `recommend_places`, `nearby_amenities` (registered via `ToolRegistryService`).

### Frontend — Chat Motion and Layout Polish
- **Chat Bubble Animation**: `AIChatPanel` now applies staggered entrance timing to each message row, with stronger left/right bubble keyframes, overshoot, and `animation-fill-mode: both` so the effect is visible on mount.
- **Layout Stability**: The bubble animation changes do not alter flex alignment, panel width, or sidebar offsets. Chat history remains an external popout and the chatbox geometry stays fixed.
- **Confirmed Search Guard**: `ChatWidget` now ignores `searchAction` chunks unless they belong to a wizard-confirmed `SEARCH_PLACES` execution pass, preventing map/workspace updates during the initial intent-collection step.
- **Workflow-Only Turn Cleanup**: `useStreamingChat` removes the trailing empty assistant message whenever a stream finishes without any text delta, which keeps metadata-only workflow proposal turns visually clean.
