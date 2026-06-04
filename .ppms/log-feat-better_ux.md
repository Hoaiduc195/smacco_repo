# Persistent Project Memory System - Changelog (Branch: feat-better_ux)

## [2026-06-04 15:20] Implemented Smart Progressive Filtering for Fixture-Only Search Mode
- **Branch**: `feat/better_ux`
- **Prompt**: tôi thấy tìm kiếm có kết quả mà chatbot vẫn trả lời là Xin lỗi, tôi không tìm thấy
- **Changes**:
  - Identified that in test mode (`isFixtureOnlyMode`), `SearchService.search` returned 12 completely random places from the full fixture set, ignoring user filters (location, type, query).
  - This mismatch between the user's requested location/type and the random pool causes the LLM response composer to correctly output "Xin lỗi, tôi không tìm thấy..." because none of the random results match the location.
  - Refactored `SearchService.search` to implement a progressive fallback filtering algorithm when in fixture-only mode:
    1. First tries to filter the local test data strictly by user type, city/location, and query.
    2. Falls back to filtering by city/location only if strict query fails.
    3. Falls back to filtering by query/type anywhere if location matches nothing.
    4. Defaults to the full dataset if all other filters match nothing.
  - Shuffle-selects up to 12 places from the resolved candidate pool, ensuring the map pins/workspace and LLM response remain strictly in sync.
  - Verified successful NestJS compilation.
- **Modified files**:
  - `backend/src/modules/search/search.service.ts`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — Changed search result filtering behaviour in test/fixture-only mode to prevent location mismatches between search results and LLM context.

---

## [2026-06-04 15:15] Supported Fallback Search Results Context for Streaming Chat
- **Branch**: `feat/better_ux`
- **Prompt**: hiện tại vẫn có lỗi là tôi thực hiện workflow tìm kiếm nhưng sau đó thì AI vẫn không có context về result
- **Changes**:
  - Created a helper function `getActivePlacesAndPayload` in `HomePage.jsx` that resolves active place context.
  - If the user has tagged/pinned places (`taggedPlaces.length > 0`), it passes them to the AI; if not, it automatically falls back to the current search results (`places`).
  - Included key metadata mapping for ID, name/title, address/displayAddress, rating/averageRating, category/type, and location coordinates (lat/lng) in the resolved fallback context.
  - Updated `handleSendMessage` and the wizard execution `execute` flow to send the resolved active places context (both `taggedPlaceIds` and `taggedPlaces` payload parameters) to the AI streaming chat endpoint.
  - Verified successful Vite production build.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Refined frontend context forwarding to prevent LLM context loss for search results.

---

## [2026-06-04 15:10] Fixed Questions Service Invalid UUID DB Exception In Test Mode
- **Branch**: `feat/better_ux`
- **Prompt**: Invalid `this.prisma.question.findMany()` invocation in QuestionsService due to invalid UUID: "local-0"
- **Changes**:
  - Injected `RuntimeConfigService` into `QuestionsService`.
  - Added an in-memory questions/answers mock storage (`mockQuestions` and `mockAnswers` arrays) in `QuestionsService` for test mode (`environment === 'test'`) to handle place queries and creates for local mock places (e.g. `local-0`).
  - Added a validation guard `this.isUuid` check in the production/database path of `listByPlace` to ignore non-UUID place IDs and return an empty list instead of causing database exceptions.
  - Implemented mock handling in `createQuestion`, `createAnswer`, `getQuestionThread`, `deleteQuestion`, and `createAiAnswer`.
  - Verified compilation of the NestJS backend.
- **Modified files**:
  - `backend/src/modules/questions/questions.service.ts`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — Q&A features are now backed by an in-memory mock store when in test/fixture-only mode, bypassing DB writes for mock IDs.

---

## [2026-06-04 15:05] Detailed PlaceCard and Cleaned Up Redundant Directions Button
- **Branch**: `feat/better_ux`
- **Prompt**: à vậy làm cho place card chi tiết hơn với các thông tin sau: địa chỉ, đánh giá (có làm tròn), nút chỉ đường. Đồng thời, bỏ một nút chỉ đường ở trang thông tin chung đi, hiện tại đang có 2 nút, bỏ nút mà không nằm chung với bản đồ
- **Changes**:
  - Added address line rendering (`displayAddress`) back to the `PlaceCard` component layout.
  - Corrected `roundedRating` calculation in `PlaceCard` to properly read and check `averageRating` as well, ensuring rating display is shown for DB places.
  - Removed the redundant directions button from the text overview block in `PlaceDetailPage.jsx` to keep only the directions button inside the sidebar map preview card.
  - Verified compilation of frontend code.
- **Modified files**:
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — UI refinement and bug correction.

---

## [2026-06-04 15:00] Replaced Custom Search Results Cards With Redesigned PlaceCard
- **Branch**: `feat/better_ux`
- **Prompt**: à hiện tại đang có lỗi là do claude lỡ generate ra thêm một cái searchresult panel, toi thấy nó không đúng ý tôi, hãy sửa lại để kết quả hiện ra ở AIworkflowPanel là PlaceCard
- **Changes**:
  - Rewrote the frontend `SearchResultsPanel.jsx` component to render the unified `PlaceCard` component for each search result instead of its own custom card layout.
  - Added prop routing for `onDirections` callback from `HomePage.jsx` down to `AIWorkspacePanel.jsx` and finally to `SearchResultsPanel.jsx` and `PlaceCard.jsx`.
  - Allowed search results cards to natively leverage map focusing (`onSelect`), detail route navigation (`onNavigate`), place saving/pinning (`onSave`), and routing calculation (`onDirections`).
  - Removed obsolete compare and ask AI buttons from the search results panel cards to align with the simplified PlaceCard design requested.
  - Verified frontend Vite compilation.
- **Modified files**:
  - `frontend/src/components/SearchResultsPanel.jsx`
  - `frontend/src/components/AIWorkspacePanel.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual/interactive card unification.

---

## [2026-06-04 14:55] Updated PlaceDetailPage to Display All New Place Fields
- **Branch**: `feat/better_ux`
- **Prompt**: à đúng rồi, với các trường dữ liệu mới đó, tôi muốn bạn cập nhật lại place detail để có thể hiển thị đầy đủ thông tin
- **Changes**:
  - Updated the frontend `PlaceDetailPage` component to parse and display all new place fields (rating, review count, price, description, amenities, email, phone, website, opening hours, rooms).
  - Implemented fallbacks for rating (`place.rating || place.averageRating || place.rawSerpApiPropertyDetails?.rating || 0`), review count (`place.reviewCount || place.review_count || place.userRatingsTotal || place.rawSerpApiPropertyDetails?.reviewCount || 0`), price description, description text, and amenities list to cleanly support both DB records, local fixtures, and search results.
  - Dynamically resolved budget level to text representations (e.g. "Bình dân ($$)") using price levels.
  - Added visual cards for "Email" and "Số phòng" in the Overview details grid when email or rooms are available from raw details.
  - Verified compilation of both frontend and backend projects.
- **Modified files**:
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual metadata display enhancement.

---

## [2026-06-04 14:48] Fixed Search Context Retention in Recommendations Module (Test Mode)
- **Branch**: `feat/better_ux`
- **Prompt**: à hiện tại khi tôi ở test mode thì mặc dù result có trả ra kết quả nhưng LLM lại không có context về result đó, kiểm tra xem
- **Changes**:
  - Identified that the `recommend_places` workflow tool was stripping crucial place metadata (amenities, review counts, images, descriptions, prices) from search results when copying them to `RankedPlace` objects in `RecommendationsService.rankPlaces`.
  - Added optional fields `userRatingsTotal`, `price`, `amenities`, `imageUrl`, and `description` to the `RankedPlace` interface.
  - Updated `RecommendationsService.rankPlaces` mapping block to copy these fields from input `PlaceResult` objects into the ranked results list.
  - This ensures `SearchResultContextBuilder` successfully formats complete context stats (price ranges, review counts, amenities) for the LLM during test mode execution, preventing safety fallbacks.
  - Verified backend compilation.
- **Modified files**:
  - `backend/src/modules/recommendations/recommendations.service.ts`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual metadata mapping enhancement.

---

## [2026-06-04 14:42] Simplified PlaceCard UI & Test-Mode Saved Places DB Bypass
- **Branch**: `feat/better_ux`
- **Prompt**: Chỉnh lại placecard, tôi chỉ muốn nó hiện các thông tin như sau: tên, ảnh đại diện, đánh giá (làm tròn), nút chỉ đường, nút chi tiết (trỏ về trang chi tiết), nút lưu (lưu vào trang của người dùng). À nhớ là trong chế độ test thì không đụng tới db nhé, chế độ test sẽ được định nghĩa trong file features.config
- **Changes**:
  - Rewrote the frontend `PlaceCard` component to strictly render only the place's name, image (or category icon fallback), rounded rating (rounded using `Math.round`), save button, directions button, and details button.
  - Removed unused fields (address, description, reviews count, price, price level, distance from you, travel time, reviews text, amenities list).
  - Modified the backend `SavedPlacesModule` and `SavedPlacesService` to inject `RuntimeConfigService` and intercept database interactions.
  - Implemented an in-memory mock saved places store (`mockSavedPlaces` map) inside `SavedPlacesService` when running under test mode (`environment === 'test'`) to prevent any Prisma database reads/writes for user upserts and saved place record CRUD.
  - Verified compilation of both frontend and backend projects.
- **Modified files**:
  - `frontend/src/components/PlaceCard.jsx`
  - `backend/src/modules/saved-places/saved-places.module.ts`
  - `backend/src/modules/saved-places/saved-places.service.ts`
  - `.ppms/log-feat-better_ux.md`
  - `.ppms/architecture-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — backend saves now dynamically bypass PostgreSQL when test mode configuration is enabled, using process-level memory instead.

---

## [2026-06-04 14:38] Configurable Chat History Persistence With Test-Mode Memory Only
- **Branch**: `feat/better_ux`
- **Prompt**: Add both behaviors: a dedicated config flag for chat-history persistence and automatic no-DB chat history in test mode.
- **Changes**:
  - Extended `RuntimeConfig` and `features.json` with `chat.persistHistory`.
  - Set test defaults to `persistHistory: false` and production defaults to `persistHistory: true`.
  - Updated `config-features.js` so production profile selection can explicitly toggle chat-history persistence.
  - Updated `ConversationStoreService` to skip Prisma persistence and DB reloads whenever `chat.persistHistory` is disabled, while continuing to keep recent messages in process memory.
  - Updated `ConversationsService` so list/create/read/delete conversation APIs fall back to in-memory conversations when persistence is disabled.
  - Verified backend production build after the persistence change.
- **Modified files**:
  - `backend/src/config/runtime-config.ts`
  - `backend/src/config/runtime-config.service.ts`
  - `backend/features.json`
  - `backend/scripts/config-features.js`
  - `backend/src/modules/ai/conversation-store.service.ts`
  - `backend/src/modules/ai/conversations.service.ts`
  - `.ppms/architecture-feat-better_ux.md`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — chat history persistence is now independently configurable, and test mode uses memory-only conversation history with no chat DB writes.

---

## [2026-06-04 14:31] Search Workflow Proposal Without Assistant Fallback Text
- **Branch**: `feat/better_ux`
- **Prompt**: Fix the remaining bug where AI still replied with a no-results message before showing the search workflow cards.
- **Changes**:
  - Updated `AiOrchestratorService` so unconfirmed `SEARCH_PLACES` turns stop immediately after yielding `workflowAction`, without running the response composer.
  - Prevented assistant text from being appended to conversation history during the initial search-intent proposal turn.
  - Updated `useStreamingChat` so workflow-only turns automatically remove the trailing empty assistant bubble when no text delta is received.
  - Verified backend and frontend production builds after the workflow change.
- **Modified files**:
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
  - `frontend/src/hooks/useStreamingChat.js`
  - `.ppms/architecture-feat-better_ux.md`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — the first `SEARCH_PLACES` turn is now metadata-only and cannot emit fallback assistant prose before the workflow cards appear.

---

## [2026-06-04 14:25] Semicircle Workspace Opener Button Shape
- **Branch**: `feat/better_ux`
- **Prompt**: Nhìn nó hơi thô, hãy chỉnh lại thành nửa hình tròn đi.
- **Changes**:
  - Replaced the custom SVG triangle workspace toggle button with a CSS-based semicircle button (`w-8 h-16 rounded-r-full`) flush with the left screen edge.
  - Added a hover width transition (`hover:w-9`) and smooth hover background transition (`hover:bg-ink-700`) using the theme's colors (`bg-ink-900` and `text-primary-200`).
  - Centered the `Layers` icon inside the semicircle with `pl-2` alignment.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual layout adjustment.

---

## [2026-06-04 14:22] Horizontal Rounded Triangle Workspace Opener Button Shape
- **Branch**: `feat/better_ux`
- **Prompt**: Change the shape of the workspace button to a horizontal triangle pointing into the map, keeping the Layers icon.
- **Changes**:
  - Restored the `Layers` icon on the collapsed desktop Workspace panel button.
  - Replaced the button HTML styling with a custom inline SVG rounded triangle path pointing horizontally to the right (`M 0,5 L 0,45 Q 0,48 3,47 L 45,27 Q 48,25 45,23 L 3,3 Q 0,2 0,5 Z`).
  - Flush-aligned the flat left side of the triangle to the left screen edge while centering the `Layers` icon in the pointer.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual button layout shape adjustment only.

---

## [2026-06-04 14:18] Change Workspace collapsed button icon to Triangle
- **Branch**: `feat/better_ux`
- **Prompt**: Change workspace button to a rounded triangle icon.
- **Changes**:
  - Replaced the `Layers` icon on the collapsed desktop Workspace panel button with the `Triangle` icon.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual icon adjustment only.

---

## [2026-06-04 14:15] Icon-Only Compact Location and Workspace Floating Buttons
- **Branch**: `feat/better_ux`
- **Prompt**: Change icons of the location button and workspace button, and remove their text.
- **Changes**:
  - Removed text and converted the collapsed floating Workspace panel opener on desktop from a tall vertical bar to a compact square `h-11 w-11` button with a `Layers` icon.
  - Removed text and converted the desktop floating Current Location button from a wide button to a compact square `h-11 w-11` button with a `Navigation` icon that spins during loading.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual control layout refinement only.

---

## [2026-06-04 14:08] Random Fixture Search Results In Test Mode
- **Branch**: `feat/better_ux`
- **Prompt**: Make search in test mode return random places, and verify place detail behavior under test mode.
- **Changes**:
  - Updated `SearchService` so fixture-only test mode exits early and returns a random sample of up to 12 places from the full merged local fixture dataset.
  - Removed dependency on incoming search filters, recommendations, database queries, and provider logic for test-mode search responses.
  - Re-verified the fixture-only place detail path in `PlacesService`: `findOne('local-*')`, reviews, and photos continue to resolve through `LocalFixturePlacesService` without Prisma writes.
  - Verified backend production build after the search behavior change.
- **Modified files**:
  - `backend/src/modules/search/search.service.ts`
  - `.ppms/architecture-feat-better_ux.md`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: Yes — test mode search semantics are now explicitly random-fixture sampling instead of deterministic filtered search.

---

## [2026-06-04 13:50] Balanced Bottom Chat Panel Controls Height
- **Branch**: `feat/better_ux`
- **Prompt**: Make the 3 buttons/controls at the bottom of the chatbox have the same height.
- **Changes**:
  - Replaced `items-end` with `items-stretch` inside the chat form flex row container.
  - Removed fixed `h-9` heights from the Plus (New Chat) and Send buttons, enabling them to stretch and match the height of the multiline text input area dynamically.
- **Modified files**:
  - `frontend/src/components/AIChatPanel.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual control layout refinement only.

---

## [2026-06-04 13:48] Shortened Input Placeholders
- **Branch**: `feat/better_ux`
- **Prompt**: Make the query search and chatbot input placeholders shorter/cleaner.
- **Changes**:
  - Shortened Navbar search input placeholder to: `Tìm homestay, khách sạn hoặc lịch trình...`
  - Shortened AIChatPanel chatbox input placeholder to: `Nhập yêu cầu (VD: Homestay Đà Lạt dưới 1 triệu)...`
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/AIChatPanel.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Text placeholder content refinement only.

---

## [2026-06-04 13:46] Chat Message Bubble Shrink-to-Fit Widths
- **Branch**: `feat/better_ux`
- **Prompt**: Adjust chat message boxes so they fit the text.
- **Changes**:
  - Added `w-fit` utility class to the base chat message bubble container.
  - Removed `max-w-none` override from the assistant bubble class list to allow it to respect the `max-w-[85%]` boundary while letting short replies shrink dynamically.
- **Modified files**:
  - `frontend/src/components/AIChatPanel.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual layout refinement only.

---

## [2026-06-04 13:42] More Professional Placeholders in Inputs
- **Branch**: `feat/better_ux`
- **Prompt**: Make the placeholders in search and chat frames more professional.
- **Changes**:
  - Replaced placeholders in Navbar search input, advanced location filter, chat panel prompt input, and wizard location input field with cleaner, prompt-guiding examples in Vietnamese.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/AIChatPanel.jsx`
  - `frontend/src/components/chat/wizard-inputs/LocationInput.jsx`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Text placeholders refinement only.

---

## [2026-06-04 13:35] Redesigned Chat Panel UI and Bouncing Typing Dots
- **Branch**: `feat/better_ux`
- **Prompt**: Improve UI of chatbox (redesign top buttons, move new conversation to bottom with plus icon, attach history panel flush to chatbox like a panel drawer, and add Instagram-like 3-dots typing animation during streaming).
- **Changes**:
  - Removed top "Lịch sử" and "Mới" buttons from the header.
  - Replaced the top right collapse chevron with a clean `X` close icon.
  - Added a toggle history button `History` icon to the top right header.
  - Aligned the bot profile and title to the left of the header.
  - Docked the history drawer flush to the left of the main chatbox by removing the margin offset and matching the borders and rounded corners dynamically (`showHistory ? 'rounded-r-3xl rounded-l-none border-l-0' : 'rounded-3xl'`).
  - Added a new conversation `Plus` button on the far left of the text input form.
  - Added an Instagram-like bouncing dot typing animation inside the assistant's chat bubble when the message content is empty while streaming.
  - Removed the redundant "AI đang phản hồi..." text loader from the bottom of the input form to simplify the UI.
  - Appended `.typing-indicator` and `.typing-dot` styling rules to `index.css`.
- **Modified files**:
  - `frontend/src/components/AIChatPanel.jsx`
  - `frontend/src/index.css`
  - `.ppms/log-feat-better_ux.md`
- **Created files**: (none)
- **Deleted files**: (none)
- **Architecture impact**: No — Visual/UI refinement only.

---

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

## [2026-06-04 05:13] Fixture-Only Test Runtime Mode
- **Prompt**: Check and adjust test config so test mode uses only fixture mock data, with no database queries and no external API calls.
- **Changes**:
  - Changed test runtime defaults and `config-features.js` test profile to `localDatabase: false`, `localFixture: true`, `externalProviders: false`, and `externalProviderPolicy: never`.
  - Added runtime normalization that forcibly locks `environment: test` to fixture-only search and disables SerpAPI/Overpass flags, even if stale config values are present.
  - Updated `SearchService` so recommendation ranking does not geocode through Goong when external providers are disabled.
  - Updated `PlacesService` so fixture-only mode returns list/detail/reviews/photos from `backend/test/fixtures` without querying Prisma for `local-*` places.
  - Updated `GeocodeAnchorTool` to skip Goong geocoding whenever external providers are disabled.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/backend/src/config/runtime-config.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/scripts/config-features.js` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/search/search.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/places/places.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/common/tools/geocode-anchor.tool.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/architecture-feat-better_ux.md` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: The test runtime is now deterministic fixture-only mode. Search and local place detail flows avoid database and external provider paths when `environment` is `test`.

## [2026-06-04 05:19] Prevent Detail Page DB Sync For Local Fixtures
- **Prompt**: Check whether opening the detail page in test mode saves fixture places to the database.
- **Changes**:
  - Confirmed `PlaceDetailPage` had an automatic `createPlace()` sync for any non-UUID place, which included `local-*` fixture records.
  - Updated `PlaceDetailPage` to skip automatic database sync when the place id starts with `local-`.
  - Added a backend guard in `PlacesService.create()` so fixture-only mode never writes place records to Prisma; `local` sources return the fixture item directly, and non-local creation is disabled.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/pages/PlaceDetailPage.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/places/places.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: Opening a local fixture detail page in test mode no longer writes stub places, place sources, or seeded reviews to the database.

## [2026-06-04 12:48] Extracted Local Fixture Places Service
- **Prompt**: Split mock data extraction into dedicated functions/services so test mode is complete and isolated.
- **Changes**:
  - Added `LocalFixturePlacesService` to own fixture JSON loading, caching, filtering, local place mapping, review mapping, and photo URL generation.
  - Registered and exported `LocalFixturePlacesService` from `PlacesModule`.
  - Simplified `PlacesService` fixture-only branches so they delegate to `LocalFixturePlacesService` instead of reading fixture files or mapping mock records inline.
  - Kept legacy wrapper methods (`loadLocalTestData`, `getLocalTestDataItem`, `findLocalTestData`) delegating to the fixture service for existing search call sites.
  - Removed the `as any` fixture call from `SearchService`.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/places/local-fixture-places.service.ts` (Created)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/places/places.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/places/places.module.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/search/search.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/architecture-feat-better_ux.md` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: Fixture-only behavior is now isolated behind a dedicated Nest provider, reducing the chance of accidental database access in test mode and making mock fixture behavior easier to audit.

## [2026-06-04 13:14] Cloudflare Content Normalization
- **Prompt**: Fix Cloudflare AI routing failure where `(response.content || '').trim is not a function`.
- **Changes**:
  - Added content normalization in `CloudflareAiLlmClientService` so chat and stream responses accept string content, `{ text }` objects, or content-part arrays.
  - Hardened `LlmTaskRouterService` to trim only when `response.content` is actually a string.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/backend/src/modules/ai/orchestration/router/llm-task-router.service.ts` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: The LLM provider boundary now normalizes Cloudflare content shapes before orchestration code consumes them, preventing routing failures caused by non-string message payloads.

## [2026-06-04 13:26] Frontend Guard For Confirmed Search Execution
- **Prompt**: Search workflow still triggered map search and workflow cards at the same time; the initial search request should only open AI workflow cards first.
- **Changes**:
  - Added a confirmed-search guard ref in `HomePage` so `onSearchAction` ignores any premature `searchAction` chunks before the wizard-confirmed search request is sent.
  - Set the guard only for confirmed `SEARCH_PLACES` execution and reset it on manual chat sends, wizard cancel, and failed confirmed-search requests.
- **Modified/Created Files**:
  - `S:/workspace/computational_thinking/proj/mono/frontend/src/pages/HomePage.jsx` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/architecture-feat-better_ux.md` (Modified)
  - `S:/workspace/computational_thinking/proj/mono/.ppms/log-feat-better_ux.md` (Modified)
- **Architecture Impact**: The frontend now treats `SEARCH_PLACES` as a two-phase contract and will not update map/workspace results unless the search came from a wizard-confirmed execution pass.
