# Project Changelog

---

## [2026-06-02 15:10] — In-Memory Local Test Data Query Fallback

- **Branch**: `feat/cloudflare_int`
- **Prompt**: à à vậy là hiện tại trông nó hơi bẩn ấy vì dữ liệu thật nằm trong db với dữ liệu mẫu, có cách nào để cho backend tự đọc file trong folder rồi trả ra không, chứ không cần phải lưu lại trong db
- **Changes**:
  - Implemented dynamic in-memory test data querying from `data.json` directly within `PlacesService` and `SearchService`.
  - Created `findLocalTestData` helper in `PlacesService` to load, filter, and format records from the JSON mock file on-the-fly.
  - Modified `findOne` in `PlacesService` to automatically generate database stub records and insert corresponding reviews dynamically on-demand only when a specific local mock place is requested by ID, maintaining full foreign-key schema integrity.
  - Updated `SearchService.search` to merge database results with local in-memory search results, prioritizing the database stub records when they exist.
  - Created and ran `clean-local-db.js` utility script to purge pre-seeded test data places from the database.
- **Modified files**:
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/modules/search/search.service.ts`
- **Created files**:
  - `backend/scripts/clean-local-db.js`
- **Deleted files**: —
- **Architecture impact**: Yes — eliminated the need to bulk pre-seed mock data inside the database. Local test data is queried in-memory and stubbed in the database on-demand, keeping the persistent database clean of unused mock data while preserving schema relations.

---

## [2026-06-02 14:45] — Refactor AI Module to Interfaces & Clean Directory Structure

- **Branch**: `feat/cloudflare_int`
- **Prompt**: tôi muốn cài lại cấu trúc của AI module, các task như taskrouter, ochestrator phải là interface, LLM client cũng nên là interface, hiện tại thì đang sử dụng 2 loại LLM provider là groq và cloudflare worker AI, hãy cài chi tiết từng class cho tùng cái, cấu trúc lại thư mục một cách sạch sẽ
- **Changes**:
  - Defined abstract class interfaces for all major AI components: `ILlmClient`, `ITaskRouter`, `IResponseComposer`, and `IAiOrchestrator` under the `interfaces/` subfolder.
  - Implemented concrete clients `GroqLlmClientService` and `CloudflareAiLlmClientService` adhering to `ILlmClient`.
  - Removed internal Cloudflare delegation logic from Groq Client, replacing it with a NestJS dynamic factory binding `ILlmClient` at configuration level. Added smart resolution for custom Worker AI proxy base URLs.
  - Refactored `GroqTaskRouterService` and `GroqResponseComposerService` to provider-agnostic versions `LlmTaskRouterService` and `LlmResponseComposerService`, injecting `ILlmClient` instead of concrete client.
  - Refactored `AiOrchestratorService` to implement `IAiOrchestrator` and inject interfaces `ITaskRouter` and `IResponseComposer`.
  - Updated `AiController` to inject `IAiOrchestrator`, and `ChatService` to inject `ILlmClient`.
  - Cleaned up directory structure under `backend/src/modules/ai/` and removed legacy service files.
- **Modified files**:
  - `backend/src/modules/ai/ai.module.ts`
  - `backend/src/modules/ai/ai.controller.ts`
  - `backend/src/modules/ai/chat.service.ts`
  - `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
- **Created files**:
  - `backend/src/modules/ai/interfaces/llm-client.interface.ts`
  - `backend/src/modules/ai/interfaces/task-router.interface.ts`
  - `backend/src/modules/ai/interfaces/response-composer.interface.ts`
  - `backend/src/modules/ai/interfaces/ai-orchestrator.interface.ts`
  - `backend/src/modules/ai/providers/groq-llm-client.service.ts`
  - `backend/src/modules/ai/providers/cloudflare-ai-llm-client.service.ts`
  - `backend/src/modules/ai/orchestration/router/llm-task-router.service.ts`
  - `backend/src/modules/ai/orchestration/composer/llm-response-composer.service.ts`
- **Deleted files**:
  - `backend/src/modules/ai/groq-client.service.ts`
  - `backend/src/modules/ai/cloudflare-ai-client.service.ts`
  - `backend/src/modules/ai/orchestration/router/groq-task-router.service.ts`
  - `backend/src/modules/ai/orchestration/router/task-router.interface.ts`
  - `backend/src/modules/ai/orchestration/composer/groq-response-composer.service.ts`
  - `backend/src/modules/ai/orchestration/composer/response-composer.interface.ts`
- **Architecture impact**: Yes — complete separation of concerns and decoupling of AI infrastructure via interface abstraction. Dynamic multi-provider integration is now managed purely by NestJS Dependency Injection, simplifying LLM swapping and unit-testing.

---

## [2026-06-02 11:45] — Reorganize Test Data to Backend Test Fixtures

- **Branch**: `feat/cloudflare_int`
- **Prompt**: oke làm vậy đi, còn cấu trúc nội bộ trong images thì sao, có nên phân chia thư mục không
- **Changes**:
  - Moved the root `test_data` directory to `backend/test/fixtures`.
  - Updated `import-test-data.js` to read data from `backend/test/fixtures/data.json`.
  - Updated `PlacesController` image search candidates to look inside `backend/test/fixtures/images`.
  - Removed the deprecated `test_data` volume mount from `docker-compose.override.yml` since it is now automatically synced through the backend folder mount.
  - Updated root `.gitignore` to ignore the new `backend/test/fixtures/` directory instead of the old `test_data/`.
- **Modified files**:
  - `.gitignore`
  - `backend/scripts/import-test-data.js`
  - `backend/src/modules/places/places.controller.ts`
  - `docker-compose.override.yml`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — cleaned up the root directory and improved Docker architecture by containerizing mock data strictly within the backend scope.

---

## [2026-06-02 10:53] — Dynamic Test Data Images Serving from Backend

- **Branch**: `feat/cloudflare_int`
- **Prompt**: tôi chỉ muốn để im ảnh trong folder test_data, nếu chương trình đang ở chế độ test thì backend phải tự tìm thư mục test_data trong root của dự án để trả về cho frontend, frontend không nên chủ động gọi như vậy mất tính chất interface của backend quá
- **Changes**:
  - Added backend endpoint `@Get('test-data/images/:filename')` in `PlacesController` to serve static test data images from `test_data/images`.
  - Configured `PlacesService` to dynamically rewrite relative `/images/` path prefixes to absolute backend API URLs based on request host details.
  - Modified `import-test-data.js` to stop copying test data images into the frontend public directory, keeping them exclusively in `test_data/images`.
  - Added host `test_data` directory volume mount configuration to the `backend` service in `docker-compose.override.yml`.
  - Reorganized project test folders by creating `backend/test/` and `frontend/test/`.
  - Moved Cloudflare test script to `backend/test/test-cloudflare.ts` and added NPM run shortcut `test:cloudflare` in `backend/package.json`.
  - Created backend connectivity test script `frontend/test/connection-check.js` and added NPM run shortcut `test:connection` in `frontend/package.json`.
- **Modified files**:
  - `backend/package.json`
  - `backend/scripts/import-test-data.js`
  - `backend/src/modules/places/places.service.ts`
  - `backend/src/modules/places/places.controller.ts`
  - `docker-compose.override.yml`
  - `frontend/package.json`
- **Created files**:
  - `backend/test/test-cloudflare.ts`
  - `frontend/test/connection-check.js`
- **Deleted files**:
  - `backend/scripts/test-cloudflare.ts`
- **Architecture impact**: Yes — test images are now encapsulated in the backend interface instead of static frontend bundles, maintaining backend-frontend contract separation. Also standardized test directory structures across frontend and backend.

---

## [2026-06-02 10:13] — Support configuring AI provider in config-features script

- **Branch**: `feat/cloudflare_int`
- **Prompt**: Chỗ AI provider, bạn thêm config-features chưa
- **Changes**:
  - Added option to select/toggle AI provider in `backend/scripts/config-features.js`.
  - Added default `aiProvider` key to `backend/features.json`.
  - Modified `backend/src/config/groq.config.ts` to dynamically read the configured AI provider from `features.json` if present.
- **Modified files**:
  - `backend/features.json`
  - `backend/scripts/config-features.js`
  - `backend/src/config/groq.config.ts`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No.

---

## [2026-06-01 21:44] — Configure Cloudflare R2 image storage and Cloudflare Workers AI LLM client

- **Branch**: `feat/cloudflare_int`
- **Prompt**: Cài đặt để lưu các file ảnh như (ảnh đại diện người dùng, ảnh các địa điểm, ảnh được dùng đăng tải lên) sẽ được đăng lên cloudflare r2 và cài thêm một LLM client sử dụng worker AI của cloudflare có cấu hình endpoint và api key sẵn trong .env.example
- **Changes**:
  - Installed `@aws-sdk/client-s3` and `@types/multer` dependencies in NestJS backend.
  - Created NestJS Upload module, service, and controller to enable image uploads (user avatars, place photos, and post attachments) directly to Cloudflare R2 bucket.
  - Created `CloudflareAiClientService` which implements the OpenAI-compatible completions API of Cloudflare Workers AI for standard and streaming LLM chat completions.
  - Integrated `CloudflareAiClientService` into `GroqClientService` as a transparent provider multiplexer, allowing runtime switching via `AI_PROVIDER` environment variable without changing existing AI orchestration modules.
  - Declared and registered configurations `r2` and `cloudflareAi` from environment variables, and updated both `.env` and `.env.example` with standard Cloudflare credential placeholders.
- **Modified files**:
  - `backend/package.json`
  - `backend/src/config/index.ts`
  - `backend/src/config/groq.config.ts`
  - `backend/src/app.module.ts`
  - `backend/src/modules/ai/ai.module.ts`
  - `backend/src/modules/ai/groq-client.service.ts`
  - `backend/.env.example`
  - `backend/.env`
- **Created files**:
  - `backend/src/config/r2.config.ts`
  - `backend/src/config/cloudflare-ai.config.ts`
  - `backend/src/modules/upload/upload.module.ts`
  - `backend/src/modules/upload/upload.service.ts`
  - `backend/src/modules/upload/upload.controller.ts`
  - `backend/src/modules/ai/cloudflare-ai-client.service.ts`
- **Deleted files**: —
- **Architecture impact**: Extends the platform's media capabilities by providing a robust, scalable, S3-compatible cloud storage solution through Cloudflare R2. Adds flexibility in LLM inference providers by enabling seamless support for Cloudflare Workers AI alongside Groq, making the system highly adaptable to different cloud models and pricing.
