# Project Changelog

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
