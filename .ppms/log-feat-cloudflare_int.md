# Project Changelog

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
