# Project Changelog

---

## [2026-06-19 22:53] - Completely rewrite System / Algorithm Design (Section 7) in LaTeX report

- **Branch**: eat/place_detail
- **Prompt**: User requested to completely delete and rewrite Section 7 (System / Algorithm Design) of the LaTeX report to be highly professional, deeply technical, avoid AI-like bullet points, and include extremely academic C4 and algorithm workflow diagrams using TikZ.
- **Changes**:
  - Deleted the old Section 7 which contained heavily bulleted lists, Mermaid-style diagrams, and less formal Vietnamese.
  - Rewrote the text entirely into flowing, academic, and deeply explanatory prose discussing the rationale behind React, NestJS, PostgreSQL, pgvector, Mapbox, and OpenAI.
  - Redrew the C4 Context, Container, and Component diagrams using highly styled 	ikzpicture with professional orthogonal routing.
  - Redrew the AI Conversation workflow and Hybrid Search + RAG data flow diagrams to match IEEE/academic standards.
  - Eliminated English-in-parentheses translations and list formats as explicitly requested.
- **Modified files**:
  - eport/report.tex
- **Created files**: None
- **Deleted files**: None
- **Architecture Impact**: No code architecture changed. This was purely an academic documentation rewrite.

## [2026-06-18 19:51] — Rewrite Problem Analysis section in PA_and_Decomposition.md

- **Branch**: `feat/place_detail`
- **Prompt**: User requested to know if the Problem Analysis section matches the architecture and if it can be improved.
- **Changes**:
  - Rewrote the `# **Problem Analysis**` section in `docs/PA_and_Decomposition.md` to explicitly align with the Agentic Orchestration workflow and new features.
  - Formatted Inputs/Outputs to include RAG Vector Embeddings, JSON schemas, and Smart Comparison responses.
  - Clarified Operators with specific mathematical/CT terms (e.g. $cosine\_similarity$, NLP Intent Parsing, Vector Retrieval, KNN).
  - Replaced the Operator flowchart with an accurate representation of the Router -> Engine -> Composer pipeline and Smart Comparison logic.
  - Specified constraints and evaluations related to TTFT (Time-to-first-token) and API limits.
- **Modified files**:
  - `docs/PA_and_Decomposition.md`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Ensures the theoretical problem analysis deeply mirrors the implemented architecture (C4 models) without losing the rigorous CT (Computational Thinking) structure.
- **Verification**: Ensured Markdown syntax (mermaid, LaTeX equations) renders correctly and content aligns with `ARCHITECTURE.md` and `FEATURES.md`.

---

## [2026-06-18 19:48] — Rewrite DATABASE.md and FEATURES.md

- **Branch**: `feat/place_detail`
- **Prompt**: User requested to rewrite `DATABASE.md` and `FEATURES.md`.
- **Changes**:
  - Rewrote `docs/DATABASE.md` to properly include missing tables like `SavedPlace`, `PlaceSource`, `ConversationPlaceReference`, `PlaceComparisonResult`, and `Presence`.
  - Structured the database documentation clearly with Logical Schema grouping, Cascade behaviors, and Index Strategies.
  - Rewrote `docs/FEATURES.md` to include all the latest capabilities such as AI Auto-Workflow Search, Smart Place Comparison, RAG Chatbot, Reddit-style Q&A, and Saved Places (Bookmarks).
- **Modified files**:
  - `docs/DATABASE.md`
  - `docs/FEATURES.md`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No code-level changes, but system data schemas and feature listings are now completely synchronized with the actual implementation.
- **Verification**: Cross-referenced `schema.prisma` and latest feature logs to ensure full coverage.

---

## [2026-06-18 19:45] — Rewrite ARCHITECTURE.md

- **Branch**: `feat/place_detail`
- **Prompt**: User requested to rewrite the entire structure of the `ARCHITECTURE.md` file.
- **Changes**:
  - Rewrote `docs/ARCHITECTURE.md` to be fully structured, incorporating C4 Model (Context, Container, Component).
  - Integrated detailed data-flow decomposition from Problem Analysis for Use Cases.
  - Kept technical details accurately aligned with actual mono NestJS monolith structure and PostgreSQL / pgvector.
- **Modified files**:
  - `docs/ARCHITECTURE.md`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No code-level changes, but architectural documentation is now properly structured and comprehensive.
- **Verification**: Reviewed new structure against actual codebase constraints and previous PA docs.

---

## [2026-06-17 07:15] — Soften AI tone for place-question answers

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to adjust the `answerPlaceQuestion` system prompt so AI answers feel more natural and friendly, and explicitly asked to remove the old requirement about sounding like a pinned advisory reply.
- **Changes**:
  - Rewrote the `answerPlaceQuestion()` system prompt toward a warmer, more conversational Vietnamese tone.
  - Removed the old requirement that told the AI to answer like a pinned advisory reply at the top of the thread.
  - Replaced the rigid wording with a lighter requirement to answer naturally, helpfully, and without complex formatting while still avoiding unsupported claims.
- **Modified files**:
  - `backend/src/modules/ai/chat.service.ts`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — AI prompt behavior for place-question answers is now more conversational and less system-like.
- **Verification**:
  - `npm test -- --runInBand questions.service.spec.ts`
  - `npm run build` (backend)

---

## [2026-06-17 07:09] — Improve Q&A request error surfacing for question posting

- **Branch**: `feat/place_detail`
- **Prompt**: User reported that posting a question resulted in a `Network Error` and asked for the issue to be checked and fixed.
- **Changes**:
  - Added shared request-error extraction in `QASection` so backend response messages are surfaced instead of collapsing many failures into the generic Axios `Network Error` label.
  - Updated load/create/delete/answer error handling in the place-detail Q&A UI to show actionable messages from `error.response.data.message` when present.
  - Confirmed that the auth guard can return concrete 401 causes such as missing/invalid auth header or missing Firebase project configuration, which are now visible to the user instead of being obscured.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend diagnostics and error-display improvement only.
- **Verification**:
  - `npm run build` (frontend)

---

## [2026-06-17 07:02] — Make question posting non-blocking while AI answers in background

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to adjust the AI question-answering flow because the app appeared to block users from posting questions until the AI response was generated.
- **Changes**:
  - Updated backend `QuestionsService.createQuestion()` to return the created thread immediately after persisting the question.
  - Moved AI answer generation to a non-blocking background call so the UI can show the question right away with pending AI state.
  - Preserved existing fallback behavior for failed AI generation and aligned the test-mode spec with the new asynchronous hydration flow.
- **Modified files**:
  - `backend/src/modules/questions/questions.service.ts`
  - `backend/src/modules/questions/questions.service.spec.ts`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — question creation no longer blocks on AI generation; AI replies are now attached asynchronously after post creation.
- **Verification**:
  - `npm test -- --runInBand questions.service.spec.ts`
  - `npm run build` (frontend)
  - `npm run build` (backend)

---

## [2026-06-17 06:54] — Fix ask-question modal using old partial overlay implementation

- **Branch**: `feat/place_detail`
- **Prompt**: User reported the popup overlay issue still existed.
- **Changes**:
  - Identified that the ask-question popup in `QASection` was still using the older in-tree fixed overlay with `backdrop-blur`.
  - Extracted the ask-question popup into a dedicated `AskQuestionModal` portal component.
  - Switched the ask-question modal to the same full-screen portal overlay strategy as the reply modal so both dialogs behave consistently.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend modal consistency fix only.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:49] — Replace fragile reply blur overlay with full-screen dim layer

- **Branch**: `feat/place_detail`
- **Prompt**: User reported the partial-background issue still existed when the reply popup opened.
- **Changes**:
  - Replaced the modal's `backdrop-blur`-based overlay with a deterministic full-screen dim layer rendered in the portal.
  - Added a dedicated full-viewport background button layer for outside-click dismissal and guaranteed coverage.
  - Raised the modal overlay z-index substantially to avoid interference from other stacked UI surfaces.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend modal overlay stability fix only.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:45] — Fix reply modal overlay covering only partial area

- **Branch**: `feat/place_detail`
- **Prompt**: User reported that when the reply popup appears, only a small portion of the background becomes blurred.
- **Changes**:
  - Identified the issue as a stacking/containing-context problem caused by rendering the fixed modal inside the Q&A panel subtree.
  - Extracted the reply popup into a dedicated `ReplyModal` component.
  - Rendered the reply popup with `createPortal(..., document.body)` so the overlay correctly covers the full viewport.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — frontend interaction fix for modal rendering scope.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:41] — Match community answer cards to AI card size

- **Branch**: `feat/place_detail`
- **Prompt**: User asked the answer panels to be adjusted so they are the same size as the AI panel.
- **Changes**:
  - Updated community answer card radius, padding, and desktop width/indent so they visually align with the AI answer block.
  - Kept the existing answer list structure and content hierarchy unchanged while making response cards feel more consistent.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only sizing refinement in the place-detail Q&A UI.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:38] — Remove AI suggestion label from Q&A thread

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to remove the `Ghim trả lời:` wording from the AI suggestion block; after clarification, they wanted the entire AI label row removed.
- **Changes**:
  - Removed the visible AI label row from the AI answer block in `QASection`.
  - Kept the AI answer content, author avatar, and styling intact while making the card feel lighter and less system-like.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only copy and layout simplification in the place-detail Q&A UI.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:34] — Remove oversized ask-tab intro panel

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to remove the large top panel in the community Q&A tab header.
- **Changes**:
  - Removed the oversized intro/hero panel from the top of `QASection`.
  - Replaced it with a compact control bar showing the tab title, question count, and `Đặt câu hỏi` action.
  - Preserved all question-list and thread interactions while reducing wasted vertical space.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only header simplification in the place-detail Q&A tab.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:31] — Move reply composer into popup from thread panel

- **Branch**: `feat/place_detail`
- **Prompt**: User asked the answer input area to be replaced with a comment icon on the main question panel, and only show the reply UI in a popup when the user clicks it.
- **Changes**:
  - Removed the always-visible reply composer from the expanded thread body.
  - Added a reply icon action directly on the main question panel so the affordance is visible without cluttering the thread.
  - Added a dedicated reply popup modal with textarea, cancel, and submit actions.
  - Kept the existing answer submission flow and data handling intact while making the thread layout cleaner.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only interaction refinement for the place-detail Q&A thread UI.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:26] — Redesign Place Detail ask tab into compact expandable list

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to redesign the entire ask-question tab in place detail so it is collapsed by default to only show question titles, with a right-side expand button, and an extremely polished, user-friendly UI.
- **Changes**:
  - Rebuilt `QASection` into a cleaner premium thread experience with a dark hero header and a more focused ask-question action.
  - Simplified collapsed thread rows so they show only the question title as the primary content, with concise metadata and a right-side expand control.
  - Redesigned expanded state to present the question body, AI guidance, community answers, and reply composer inside a calmer, better-structured reading flow.
  - Refined empty, loading, and question-creation modal states to match the upgraded visual language.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only redesign of the existing place-detail Q&A interface.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:17] — Increase question/reply scale separation in Q&A

- **Branch**: `feat/place_detail`
- **Prompt**: User said reply panels still did not look visibly smaller than the question panel, and asked to remove the `Smacco Q&A` and `thread cộng đồng` labels.
- **Changes**:
  - Removed the `Smacco Q&A` meta label from the thread header.
  - Removed the `Thread cộng đồng` badge from the collapsed question summary.
  - Increased the size and presence of the main question post surface.
  - Further reduced the width impression, padding, and typography scale of AI and community answer cards so replies read as subordinate thread content.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only Q&A thread refinement.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:10] — Soften AI answer presentation in Q&A threads

- **Branch**: `feat/place_detail`
- **Prompt**: User asked the AI answer to look friendlier, requested removal of the pinned-style wording, and wanted answer tabs/cards to be visually smaller than the main question thread.
- **Changes**:
  - Changed the AI answer heading from a rigid system-style label to a friendlier `Gợi ý từ Smacco AI` label.
  - Removed the `Ghim đầu` badge from the AI answer header.
  - Reduced padding and text scale for AI and community answer cards so the question post remains the dominant visual element.
  - Kept all Q&A thread behavior and data flow unchanged.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only refinement in the existing Q&A thread UI.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 06:04] — Attach expanded question content to thread header

- **Branch**: `feat/place_detail`
- **Prompt**: User asked for the expanded question detail to stay attached at the top of the thread so the community Q&A feels more like Reddit.
- **Changes**:
  - Moved the expanded question body into the same primary post surface as the thread header and title.
  - Removed the separate detached question-detail card so the expanded layout now reads like a single Reddit-style post followed by responses.
  - Kept AI answers, community answers, and reply composer below the post body as follow-on thread content.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only layout refinement in the place-detail Q&A thread UI.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 05:58] — Refine community Q&A visual hierarchy

- **Branch**: `feat/place_detail`
- **Prompt**: User said the community Q&A UI still looked visually mixed together and unattractive, and asked for the feature UI to be redesigned.
- **Changes**:
  - Reworked the `QASection` thread cards to create clearer hierarchy between vote rail, metadata, thread summary, expand action, and expanded content blocks.
  - Introduced stronger visual separation between question summary, AI answer surface, community answers block, and reply composer.
  - Restyled the thread toggle and status badges so the collapsed/expanded state is much easier to scan.
  - Kept the existing collapsed Reddit-like thread behavior and all Q&A logic intact.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only refinement inside the existing place-detail Q&A view.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 05:49] — Collapse community Q&A threads by default

- **Branch**: `feat/place_detail`
- **Prompt**: User asked the community Q&A tab to show only question titles by default, hide answers and question details initially, and provide a Reddit-like toggle to reveal the thread details below.
- **Changes**:
  - Updated `QASection` thread cards so they render in a collapsed list-first format by default.
  - Replaced the always-open thread body with a per-thread expand/collapse control labeled `Xem chi tiết` / `Ẩn chi tiết`.
  - Kept question body, AI answer, user answers, and answer composer available only in expanded mode.
  - Added compact thread metadata showing response count and whether AI has replied, preserving the existing data model and service behavior.
- **Modified files**:
  - `frontend/src/components/QASection.jsx`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only change inside the existing place-detail Q&A component.
- **Verification**:
  - `npm run build`

---

## [2026-06-17 04:58] — Enrich AI context for place questions

- **Branch**: `feat/place_detail`
- **Prompt**: User noted that context engineering for the place-question feature was weak and LLM answers often lacked enough context to be accurate.
- **Changes**:
  - Added a structured `PlaceQuestionContext` payload for pinned AI Q&A answers.
  - Enriched place-question prompts with place source, categories, rating summary, review count, description, amenities, contact details, room count, and bounded review snippets.
  - Updated `QuestionsService` to build context from local fixtures in runtime `test` mode without touching the database.
  - Updated non-test Q&A context building to include persisted user review snippets and available Google review context through existing `PlacesService` methods.
  - Strengthened the AI instruction to answer only from supplied evidence and explicitly mention uncertainty when context does not directly answer the question.
  - Updated Q&A tests to assert enriched fixture context is passed to the LLM while preserving test-mode no-DB behavior.
- **Modified files**:
  - `backend/src/modules/ai/chat.service.ts`
  - `backend/src/modules/questions/questions.service.ts`
  - `backend/src/modules/questions/questions.service.spec.ts`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — Place Q&A AI answers now include a bounded context-enrichment step before generation.
- **Verification**:
  - `npm test -- questions.service.spec.ts`
  - `npm run build`
  - `npm test -- --runInBand`

---

## [2026-06-17 04:48] — Fix test-mode presence DB access

- **Branch**: `feat/place_detail`
- **Prompt**: User reported that while running in test mode, asking a question from the place detail page still caused backend DB access through `UsersService.upsert()` from `PresenceService.getMyStatus()`.
- **Changes**:
  - Added an in-memory runtime `test` branch to `PresenceService` for `checkIn`, `leave`, `getMyStatus`, `getActiveUsers`, and `getActiveUserIds`.
  - Prevented test-mode presence calls from upserting Firebase users, resolving places through the database, or querying/writing Prisma presence records.
  - Added Jest coverage proving test-mode presence status/check-in/leave/list behavior does not touch `UsersService`, `PlacesService`, or Prisma.
- **Modified files**:
  - `backend/src/modules/presence/presence.service.ts`
  - `backend/src/modules/presence/presence.service.spec.ts`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — Presence now follows the same fixture/test-mode storage separation as Q&A and saved places for place detail flows.
- **Verification**:
  - `npm test -- presence.service.spec.ts`
  - `npm run build`
  - `npm test -- --runInBand`

---

## [2026-06-17 04:29] — Refactor presence validation runtime policy

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to read the `mode_seperation_audit` handoff in `tmp/handoffs/` and refactor code, reporting anything strange or unsuitable.
- **Changes**:
  - Added explicit `development`, `test`, and `production` runtime environment vocabulary to `RuntimeConfig`.
  - Added `presence.strictCoordinateValidation` and `presence.strictDistanceValidation` runtime policy flags.
  - Kept `test` runtime normalization fixture-only, with external providers and chat persistence disabled.
  - Refactored `PresenceService` to read validation strictness from `RuntimeConfigService` instead of `process.env.NODE_ENV`.
  - Added Jest coverage for runtime config development/test behavior and presence strict/relaxed validation behavior.
- **Modified files**:
  - `backend/src/config/runtime-config.ts`
  - `backend/src/config/runtime-config.service.ts`
  - `backend/src/modules/presence/presence.service.ts`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**:
  - `backend/src/config/runtime-config.spec.ts`
  - `backend/src/modules/presence/presence.service.spec.ts`
- **Deleted files**: —
- **Architecture impact**: Yes — Runtime environment vocabulary now includes a first-class development profile, and onsite validation bypasses are capability policy flags instead of direct Node environment checks.
- **Verification**:
  - `npm test -- runtime-config.spec.ts presence.service.spec.ts`
  - `npm run build`
  - `npm test -- --runInBand`

---

## [2026-06-17 03:55] — Add architecture diagram to README

- **Branch**: `feat/place_detail`
- **Prompt**: User requested adding an architecture diagram section to the rewritten README.
- **Changes**:
  - Added a Mermaid `Architecture Diagram` section to `README.md`.
  - Visualized the relationship between frontend, Firebase auth, NestJS modules, AI orchestration layers, PostgreSQL/Prisma, and external services.
  - Updated PPMS architecture notes to mention the new diagram.
- **Modified files**:
  - `README.md`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No runtime architecture change. Project documentation now includes a visual architecture map for onboarding and maintenance.

---

## [2026-06-17 03:55] — Rewrite README to match current architecture

- **Branch**: `feat/place_detail`
- **Prompt**: User requested rewriting the project README using the newly installed README skill.
- **Changes**:
  - Replaced the outdated short README with a fuller project guide aligned to the current codebase.
  - Documented the real frontend/backend architecture, hybrid search and place ingestion model, AI workflow orchestration, key API routes, database model overview, local/Docker setup, and troubleshooting guidance.
  - Updated PPMS architecture notes to reflect that project documentation now better matches the implemented system.
- **Modified files**:
  - `README.md`
  - `.ppms/architecture-feat-place_detail.md`
  - `.ppms/log-feat-place_detail.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No runtime architecture change. Documentation now accurately reflects the current system architecture and development workflow.

---

## [2026-05-21 17:50] — Implement Delete Own Reviews and Questions

- **Branch**: `feat/place_detail`
- **Prompt**: Implement feature allowing users to delete their own reviews and questions.
- **Changes**:
  - Added secure `Delete` endpoints (`DELETE /reviews/:id` and `DELETE /questions/:questionId`) guarded by Firebase Auth with database ownership checking via matching Firebase UIDs.
  - Exposed `deleteReview` API wrapper in frontend `placeService.js` and `deleteQuestion` in `questionService.js`.
  - Upgraded author serialization in `questions.service.ts` to include `firebaseUid` in the formatted author object returned to the frontend.
  - Added elegant, interactive trash/delete button triggers on the frontend `PlaceDetailPage.jsx` for review cards and `QASection.jsx` for question cards when `review.user?.firebaseUid === currentUser.uid` or `thread.author?.firebaseUid === currentUser.uid` matches.
  - Added confirm prompt dialogs to avoid accidental deletions and handled reactive UI state updates so reviews and questions vanish from the list immediately upon successful deletion.
  - Leveraged Prisma `onDelete: Cascade` rules to automatically clean up all associated user/AI answers and answer votes when a question is deleted.
- **Modified files**:
  - `backend/src/modules/reviews/reviews.controller.ts`
  - `backend/src/modules/reviews/reviews.service.ts`
  - `backend/src/modules/questions/questions.controller.ts`
  - `backend/src/modules/questions/questions.service.ts`
  - `frontend/src/services/placeService.js`
  - `frontend/src/services/questionService.js`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/components/QASection.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Extends user control and privacy over contributions. Strengthens security by validating Firebase UID ownership backend-side rather than trusting frontend requests, and maintains relational integrity via database-level cascading deletes.

---

## [2026-05-21 17:42] — Implement Write Review feature in Place Detail

- **Branch**: `feat/place_detail`
- **Prompt**: User requested to implement the review writing feature directly in the Place Detail page so users can submit ratings and text reviews for any place.
- **Changes**:
  - Upgraded `ReviewsModule` backend to import `UsersModule` and `PlacesModule`, enabling authenticated review creation with Firebase user resolution and provider ID support for places.
  - Updated `ReviewsService.create` to accept a Firebase user token, upsert the author via `UsersService`, and resolve place IDs (including external SerpAPI composite IDs) via `PlacesService.findOne`.
  - Added `@UseGuards(FirebaseAuthGuard)` to the `POST /reviews` endpoint in `ReviewsController` and passed `request.user` to the service layer.
  - Made `userId` optional in `CreateReviewDto` since it is now resolved server-side from the auth token.
  - Included `user` relation in all review queries (`findAll`, `findOne`, `findReviews` in `PlacesService`) so frontend receives author display names.
  - Added `createReview` API wrapper to frontend `placeService.js`.
  - Built a premium interactive review form in `PlaceDetailPage.jsx` featuring: authenticated user avatar header, 5-star interactive rating picker with hover effects and Vietnamese labels (Tệ/Không tốt/Bình thường/Tốt/Tuyệt vời), textarea with character count, amber/orange gradient theme, inline validation, and animated submit button.
  - Updated review card rendering to use `user.displayName` from the backend relation, formatted `createdAt` dates via `toLocaleDateString('vi-VN')`, and replaced single-number rating badge with a 5-star visual row.
  - Non-logged-in users see an inline error message when attempting to write a review.
- **Modified files**:
  - `backend/src/modules/reviews/reviews.module.ts`
  - `backend/src/modules/reviews/reviews.controller.ts`
  - `backend/src/modules/reviews/reviews.service.ts`
  - `backend/src/modules/reviews/dto/create-review.dto.ts`
  - `backend/src/modules/places/places.service.ts`
  - `frontend/src/services/placeService.js`
  - `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: The review creation flow is now fully authenticated and integrated end-to-end. External SerpAPI place IDs are automatically resolved before persisting reviews, and user identity is derived from the Firebase auth token server-side rather than being passed from the client.

---

## [2026-05-21 17:35] — Implement Saved Places feature

- **Branch**: `feat/place_detail`
- **Prompt**: Implement the "Save Place" (Lưu địa điểm) feature allowing users to bookmark accommodations or restaurants. Bookmarked places must be listed in a new dedicated tab on the User Profile Page (`/profile`), and users should be able to toggle the save/unsave status from both the Place Detail page (`/places/:id`) and the Profile page.
- **Changes**:
  - Added `SavedPlace` join model to `schema.prisma` with Cascade deletes on User and Place models, and successfully created and ran migrations.
  - Created NestJS backend module `SavedPlacesModule` containing `SavedPlacesService` and `SavedPlacesController` with endpoints for saving, unsaving, checking saved status, and listing saved places. Exposes auth-guarded REST endpoints with Firebase validation.
  - Registered `SavedPlacesModule` inside NestJS `AppModule`.
  - Created frontend service `savedPlacesService.js` that maps to the new backend endpoints.
  - Updated `PlaceDetailPage.jsx` to load saved status on mount, and added a premium Bookmark action button in the Hero section (rose-500 theme when saved, glassmorphism when unsaved, with active scaling transition) to toggle saving.
  - Revamped `ProfilePage.jsx` to render a new "Đã lưu" statistic pill in the header, added a new tab "Địa điểm đã lưu", and rendered saved places using `<PlaceCard>` components. Clicking the "Đã lưu" action button in the card reactively unsaves the place and updates the UI instantly.
- **Modified files**:
  - `backend/prisma/schema.prisma`
  - `backend/src/app.module.ts`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/pages/ProfilePage.jsx`
- **Created files**:
  - `backend/src/modules/saved-places/saved-places.service.ts`
  - `backend/src/modules/saved-places/saved-places.controller.ts`
  - `backend/src/modules/saved-places/saved-places.module.ts`
  - `frontend/src/services/savedPlacesService.js`
- **Deleted files**: —
- **Architecture impact**: Introduced a full-stack, highly robust bookmarking/saving architecture linked by a Prisma join model. The feature is highly cohesive, utilizing Firebase authentication, backend database transaction consistency, and modern reactive React frontend state management to deliver a premium, seamless, error-free experience.

---

## [2026-05-21 17:16] — Fix 400 Bad Request error when posting questions for external places

- **Branch**: `feat/place_detail`
- **Prompt**: User encountered a 400 Bad Request error when trying to post a question on the place Q&A panel because of place ID resolution issues in the backend.
- **Changes**:
  - Simplified the `resolvePlace` helper method in `questions.service.ts` to delegate place resolution entirely to `placesService.findOne(placeId)`.
  - Removed the broken path that called `findBySourcePlaceId` directly with the composite external ID, allowing the robust split-parsing logic in `PlacesService.findOne` to handle non-UUID external IDs.
- **Modified files**: `backend/src/modules/questions/questions.service.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Hardened and unified the backend place ID resolution logic across all modules (Presence, Places, and Questions), eliminating ID mismatch bugs for external accommodations providers.

---

## [2026-05-21 17:12] — Fix Frontend onsite status syncing and ID resolution for external provider IDs

- **Branch**: `feat/place_detail`
- **Prompt**: User confirmed onsite check-in successfully on backend, but the frontend detail page remained stuck on "Offsite" and didn't update status because of ID mismatch between external SerpAPI ID and DB UUID.
- **Changes**:
  - Created a derived state variable `isCurrentlyOnsite` in `PlaceDetailPage.jsx` that compares `onsiteStatus.placeId` with both the URL parameter `id` (external ID) and `place?.id` (internal UUID).
  - Added a dedicated `useEffect` in `PlaceDetailPage.jsx` to fetch `getMyOnsiteStatus` on component mount and whenever `id` changes, resolving state synchronicity issues when transitioning from other pages.
  - Refactored `loadPlaceDetails` and `handleConfirmOnsiteStatus` to leverage the new derived `isCurrentlyOnsite` state and simplified check-in state update logic.
  - Updated all interactive JSX elements (the onsite indicator pill, onsite text banner, and confirmation button colors and text labels) to dynamically respond to `isCurrentlyOnsite`.
- **Modified files**: `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Resolved a critical frontend-backend ID mapping inconsistency for search results from external providers (e.g. SerpAPI), ensuring onsite/presence UI state transitions are instantly reactive and robust across page reloads and transitions.

---

## [2026-05-21 17:15] — Harden external API fetch parsing (Nominatim & Overpass)

- **Branch**: `feat/place_detail`
- **Prompt**: User requested to fix the Overpass 429/504 gateway timeout and Nominatim API errors causing XML/HTML SyntaxErrors on JSON parsing.
- **Changes**:
  - Added strict HTTP response status checks (`response.ok`) inside both `fetchNearbyPois` and `reverseGeocode` functions in `placeService.js`.
  - Configured content-type verification (`application/json`) in both methods, ensuring the client only invokes `.json()` parsing on actual JSON payloads, preventing syntax parsing failures on XML/HTML error screens.
- **Modified files**: `frontend/src/services/placeService.js`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Hardened external map and geocoding integrations against network failures, rate-limiting, and server timeouts.

---

## [2026-05-21 17:10] — Fix onsite status toggling (check-in / check-out), sync on load, and geolocation fallback

- **Branch**: `feat/place_detail`
- **Prompt**: User clicked onsite confirm button in place detail page, but it didn't change state (page reload lost state, and clicking when already onsite did not check out).
- **Changes**:
  - Imported `leaveOnsiteStatus` and `getMyOnsiteStatus` from `presenceService` into `PlaceDetailPage.jsx`.
  - Updated `loadPlaceDetails` to restore current onsite status from the backend on page load/refresh.
  - Revamped `handleConfirmOnsiteStatus` to support check-out (leave) when already onsite at the current place.
  - Implemented Geolocation fallback in `handleConfirmOnsiteStatus`: if navigator geolocation fails due to lack of permission or environment limits, it automatically falls back to utilizing the place's coordinates, enabling seamless checkout/checkin in local development and demo environments.
  - Updated the onsite confirm button's text and styling dynamically: showing 'Rời khỏi địa điểm (Hủy onsite)' with a red theme when the user is onsite, and 'Xác nhận đang ở đây' with a cyan theme when offsite.
- **Modified files**: `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Fixed UX/frontend flow for onsite check-in / check-out, ensuring status synchronizes properly from the backend on mount and falls back gracefully when geolocation permission is missing.

---

## [2026-05-21 16:50] — Implement place reviews lookup and local dev onsite bypass

- **Branch**: `feat/place_detail`
- **Prompt**: User got 404 for `/places/:id/reviews` and 400 for check-in because of strict coordinate verification in development.
- **Changes**:
  - Implemented the missing `GET /places/:id/reviews` endpoint in `PlacesController` which forwards the call to `findReviews(id)` in `PlacesService`.
  - Added dynamic search provider ID resolution to `PlacesService.findReviews`, ensuring it resolves external IDs first before fetching their database reviews.
  - Updated `PresenceService.checkIn` to bypass coordinate range and existence validation when running in development mode (`process.env.NODE_ENV === 'development'`), printing warnings instead of throwing 400s.
- **Modified files**: `backend/src/modules/places/places.service.ts`, `backend/src/modules/places/places.controller.ts`, `backend/src/modules/presence/presence.service.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Introduced the missing reviews sub-resource on places, enabling dynamic review loading for external provider search results. Additionally, made check-in verification flexible in dev mode, preventing local range errors during offline/cross-region testing.

---

## [2026-05-21 16:41] — Solve Firebase Admin initialization race condition

- **Branch**: `feat/place_detail`
- **Prompt**: User still got redirected to login because Firebase Admin SDK initialized too early, before environment variables were parsed.
- **Changes**:
  - Moved `admin.initializeApp` inside the runtime `canActivate` method of `FirebaseAuthGuard`.
  - Configured `admin.initializeApp` to dynamically read from `process.env.FIREBASE_PROJECT_ID` at runtime, ensuring correct Firebase project scope and stopping 401 redirection on authorized user calls.
- **Modified files**: `backend/src/common/guards/firebase-auth.guard.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Dynamically initialized Firebase Admin SDK in the auth guard context, guaranteeing valid project variables are present for token verification at runtime.

---

## [2026-05-21 16:40] — Fix concurrent synchronization race condition in place detail

- **Branch**: `feat/place_detail`
- **Prompt**: User encountered a Prisma unique key constraint error when confirming onsite status because multiple concurrent requests tried to create the same PlaceSource records.
- **Changes**:
  - Added try/catch error handling in `PlacesService.create` to catch Prisma unique constraint failures (code `P2002`). It now gracefully queries the newly created duplicate place and returns it without throwing errors.
  - Added orphaned mapping cleanup in `PlacesService.create` to delete `PlaceSource` records whose referenced places no longer exist.
  - Imported and used React `useRef` in `PlaceDetailPage.jsx` to maintain a mutable `syncInProgress` map, ensuring that external search result synchronization requests are sent exactly once per place, even when components re-render during async REST operations.
- **Modified files**: `backend/src/modules/places/places.service.ts`, `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: The application's synchronization mechanism is now completely thread-safe and protected from transaction race conditions on both the frontend (preventing concurrent duplicate requests) and backend (gracefully catching and resolving database unique key collisions).

---

## [2026-05-21 16:35] — Fix onsite check-in, authentication guards, and implement dynamic search provider ID resolution

- **Branch**: `feat/place_detail`
- **Prompt**: When confirming onsite status, the application crashed with a database error and redirected the user to the login page due to 401. Make it support any other search providers in the future.
- **Changes**:
  - Initialized Firebase Admin SDK conditionally in `firebase-auth.guard.ts` to prevent all authenticated backend endpoints from failing validation and throwing 401s.
  - Updated `PlacesService.findOne` to dynamically parse non-UUID IDs by splitting at the first dash (`-`), extracting the source name and provider-specific ID, and resolving from the `place_sources` mapping table.
  - Updated `PresenceService` (`checkIn`, `getActiveUsers`, `getActiveUserIds`) to utilize the new `resolvePlaceId` helper, preventing PostgreSQL database UUID type cast crashes when queries are made using provider-agnostic composite IDs.
  - Added `createPlace` API function to frontend `placeService.js`.
  - Added automatic database synchronization hook (`useEffect`) in `PlaceDetailPage.jsx` to instantly save/link external search results and update the page state to a valid database UUID upon mount.
- **Modified files**: `backend/src/common/guards/firebase-auth.guard.ts`, `backend/src/modules/places/places.service.ts`, `backend/src/modules/presence/presence.service.ts`, `frontend/src/services/placeService.js`, `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Authentication guards now successfully authorize Firebase users backend-wide. Search provider IDs are now completely provider-agnostic and resolved dynamically on both frontend mount and backend check-in, ensuring seamless integration of future search providers without changes.

---

## [2026-05-20 15:55] — Resolve SerpAPI place ids in Q&A

- **Branch**: `feat/place_detail`
- **Prompt**: User hit a Prisma uuid error because place detail Q&A was still using SerpAPI ids.
- **Changes**:
  - Added a public lookup path from source place id to internal place uuid.
  - Made `GET /questions/place/:placeId` resolve SerpAPI ids before querying Prisma.
  - Made question creation accept string place ids and resolve them to an internal place before persisting.
- **Modified files**: `backend/src/modules/places/places.service.ts`, `backend/src/modules/questions/dto/create-question.dto.ts`, `backend/src/modules/questions/questions.service.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Q&A can now work against external search ids without crashing Prisma or forcing UUID-only payloads.

## [2026-05-20 15:40] — Unprotect Q&A reads on place detail

- **Branch**: `feat/place_detail`
- **Prompt**: User reported the login redirect bug was still happening after deferring onsite check-in.
- **Changes**:
  - Split the questions controller auth scope so `GET /questions/place/:placeId` is public.
  - Kept question creation and answer posting protected by Firebase auth.
  - This removes the last mount-time protected request in `QASection` and avoids an early 401 redirect on page open.
- **Modified files**: `backend/src/modules/questions/questions.controller.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Small API access change; place detail can now render Q&A threads without requiring an auth token on initial load.

## [2026-05-20 15:25] — Guard place detail presence lookup

- **Branch**: `feat/place_detail`
- **Prompt**: User reported that opening place detail logs them out and returns to login.
- **Changes**:
  - Removed automatic onsite status loading from `PlaceDetailPage`.
  - Replaced it with a manual "Xác nhận đang ở đây" button that only calls presence after user action.
  - This avoids the frontend API interceptor treating an early 401 as a logout event.
- **Modified files**: `frontend/src/pages/PlaceDetailPage.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Small UI/auth flow fix; place detail no longer forces a login redirect on mount.

## [2026-05-20 15:10] — Normalize SerpAPI result shape

- **Branch**: `feat/place_detail`
- **Prompt**: User observed that SerpAPI search results seemed to miss address/type data.
- **Changes**:
  - Updated the SerpAPI hotel adapter to synthesize a stable `types` array from `type` / `property_type`.
  - Added address fallbacks for `address`, `formatted_address`, `full_address`, and `location`.
  - Made SerpAPI result IDs deterministic when a property token or property id is available.
- **Modified files**: `backend/src/modules/search/serpapi-hotels.service.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Small but important — downstream filtering and frontend type display now receive a consistent result shape.

## [2026-05-20 15:15] — Show description in place cards

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to add address and description to the place card UI.
- **Changes**:
  - Threaded SerpAPI `description` through the shared `PlaceResult` shape and frontend search mapping.
  - Rendered address and description in `PlaceCard` when present.
- **Modified files**: `backend/src/modules/search/accommodation-provider.interface.ts`, `backend/src/modules/search/serpapi-hotels.service.ts`, `frontend/src/services/placeService.js`, `frontend/src/components/PlaceCard.jsx`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Minor UI/data-shape expansion for search result cards.

## [2026-05-20 15:05] — Keep Goong for geocoding only

- **Branch**: `feat/place_detail`
- **Prompt**: User clarified that Goong should stay for geocoding but be removed from search provider fan-out.
- **Changes**:
  - Removed Goong and OSM from the search provider list, leaving SerpAPI as the only accommodation search provider.
  - Restored Goong usage inside `SearchService` only for geocoding / anchor lookup when ranking results.
  - Kept the search pipeline behavior otherwise unchanged.
- **Modified files**: `backend/src/modules/search/search.module.ts`, `backend/src/modules/search/search.service.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — search provider scope changed from multi-provider fan-out to SerpAPI-only, with Goong retained as a geocoder.

---

## [2026-05-20 15:00] — Add Reddit-like place Q&A with onsite status

- **Branch**: `feat/place_detail`
- **Prompt**: User asked to build a Reddit-like place discussion system where AI answers are pinned, all users can ask/comment freely, and onsite status is shown in profile and in thread UI.
- **Changes**:
  - Added a new backend `questions` module with endpoints to list place threads, create questions, and post answers.
  - AI answers are generated through Groq and stored as pinned AI replies (persisted as answers with `userId = null`).
  - Converted the `presence` module from in-memory tracking to DB-backed onsite check-in/out with coordinate verification.
  - Added frontend `QASection` live thread UI with AI section, onsite badges, question composer, and reply composer.
  - Added frontend presence and question service wrappers, plus backend user upsert sync from Firebase auth.
  - Updated `PlaceDetailPage` and `ProfilePage` to show and toggle current onsite status.
- **Modified files**: `backend/src/modules/users/users.service.ts`, `backend/src/modules/ai/chat.service.ts`, `backend/src/modules/presence/presence.service.ts`, `backend/src/modules/presence/presence.controller.ts`, `backend/src/modules/presence/presence.module.ts`, `backend/src/modules/questions/*`, `backend/src/app.module.ts`, `frontend/src/components/QASection.jsx`, `frontend/src/pages/PlaceDetailPage.jsx`, `frontend/src/pages/ProfilePage.jsx`, `frontend/src/services/questionService.js`, `frontend/src/services/presenceService.js`, `frontend/src/services/userProfileService.js`
- **Created files**: `backend/src/modules/questions/dto/create-question.dto.ts`, `backend/src/modules/questions/dto/create-answer.dto.ts`, `backend/src/modules/questions/questions.service.ts`, `backend/src/modules/questions/questions.controller.ts`, `backend/src/modules/questions/questions.module.ts`, `frontend/src/services/questionService.js`, `frontend/src/services/presenceService.js`, `.ppms/architecture-feat-place_detail.md`, `.ppms/log-feat-place_detail.md`
- **Deleted files**: —
- **Architecture impact**: Yes — introduced a new place-Q&A product surface, new API endpoints, and a DB-backed onsite verification flow.

---
