---
name: persistent-project-memory-system
description: >
  Automatically maintains long-term project memory. The agent MUST create and
  update architecture & changelog files after EVERY prompt that modifies code
  or when the user requests a PPMS update.
license: MIT
metadata:
  author: Hoaiduc195
  version: 2.0.0
---

# Persistent Project Memory System (PPMS)

> **GOLDEN RULE**: After EVERY prompt where the agent makes code or architectural
> changes, or when the user requests "update ppms" / "sync ppms", the agent
> **MUST** update ALL files in the `.ppms/` directory.

---

## Directory Structure

All memory files are stored in the `.ppms/` directory at the project root:

```
.ppms/
├── architecture.md          # Full architecture description
├── architecture-short.md    # Condensed version for quick AI reading
└── log.md                   # Chronological changelog
```

If the `.ppms/` directory or any of the files do not exist, the agent **MUST create them automatically**.

---

## Initialization

When starting a session, if `.ppms/` or any files inside are missing:

1. **Scan the entire project** to understand the architecture:
   - Read `package.json`, `tsconfig.json`, `prisma/schema.prisma`, `docker-compose.yml`, and other config files (if they exist).
   - Browse directory structure: `src/`, `app/`, `pages/`, `api/`, `server/`, `client/`, etc.
   - Identify frameworks, libraries, and technologies in use.
   - Discover API routes/endpoints, database schemas, and main modules.

2. **Create all 3 files** following the formats defined below.

---

## File Formats

### 1. `.ppms/architecture.md` — Full Architecture

```md
# Project Architecture: [Project Name]

> Last updated: [YYYY-MM-DD HH:MM]

## Overview
Brief description of the project's purpose (1-3 sentences).

## Tech Stack

| Component   | Technology                 | Version   |
|-------------|----------------------------|-----------|
| Frontend    | React / Next.js / Vue / …  | x.x.x     |
| Backend     | Express / NestJS / …       | x.x.x     |
| Database    | PostgreSQL / MongoDB / …   | x.x.x     |
| ORM         | Prisma / TypeORM / …       | x.x.x     |
| Hosting     | Vercel / Cloudflare / …    | —         |
| Other       | …                          | —         |

## System Architecture

### Frontend
- **Framework**: …
- **Module structure**: List main modules/pages and their functions
- **State management**: …
- **Routing**: …

### Backend
- **Framework**: …
- **Module structure**: List main modules/controllers/services
- **Authentication**: …
- **Middleware**: …

### Frontend ↔ Backend Interaction
Describe how frontend communicates with backend (REST API, GraphQL, WebSocket, …)

## API Endpoints

| Method | Path               | Description              | Auth |
|--------|--------------------|--------------------------|------|
| GET    | /api/…             | …                        | yes/no |
| POST   | /api/…             | …                        | yes/no |

## Database Schema
Describe main tables/collections and their relationships.

## Completed Features
- [x] Feature 1: brief description
- [x] Feature 2: brief description

## In-Progress Features
- [ ] Feature X: brief description

## Directory Structure
(Simple tree of important directories)
```

---

### 2. `.ppms/architecture-short.md` — Condensed Architecture

A short version of `architecture.md`, **max 50 lines**, so the AI can read it in seconds:

```md
# [Project Name] — Quick Architecture Reference

> Updated: [YYYY-MM-DD HH:MM]

## Stack
- FE: [framework] | BE: [framework] | DB: [database] | ORM: [orm]

## Modules
- **Frontend**: [module1], [module2], …
- **Backend**: [module1], [module2], …

## Key Endpoints
- `GET /api/…` → …
- `POST /api/…` → …

## DB Tables
- `users`, `posts`, … (key relationships)

## Completed Features
- Feature 1, Feature 2, …

## In Progress
- Feature X
```

---

### 3. `.ppms/log.md` — Changelog

Records all changes in chronological order (newest entries at the top):

```md
# Project Changelog

---

## [YYYY-MM-DD HH:MM] — Short title

- **Prompt**: Summary of the user's request (1-2 sentences)
- **Changes**:
  - Change description 1
  - Change description 2
- **Modified files**: `file1.ts`, `file2.tsx`, …
- **Created files**: `file3.ts`, …
- **Deleted files**: (if any)
- **Architecture impact**: Yes / No — (if yes, brief description)

---
```

---

## Workflow

### BEFORE each task

1. Read `.ppms/architecture-short.md` for quick project context.
2. If more detail is needed, read `.ppms/architecture.md`.
3. Read `.ppms/log.md` (last 5-10 entries) to understand recent changes.

### DURING the task

- Track all architectural changes, new files, deleted files, new endpoints, etc.
- If changes affect the architecture, plan to update the architecture files.

### AFTER each task (MANDATORY)

The agent **MUST complete ALL** of the following steps before ending the session:

#### Step 1: Update `.ppms/log.md`
- Add a new entry **at the top of the file** (after the title) using the format above.
- Use the user's local timezone for the timestamp.

#### Step 2: Update `.ppms/architecture.md` (if architecture changed)
Update if any of the following occurred:
- Added/removed/changed a dependency or framework
- Added/removed/modified an API endpoint
- Changed directory structure
- Added/removed a module, component, or service
- Changed database schema
- Added a new feature or completed an existing one

#### Step 3: Update `.ppms/architecture-short.md`
- Keep it in sync with `architecture.md` but concise.

---

## Update Triggers

The agent must update PPMS when:

1. **Automatic**: After every prompt where the agent modifies code or configuration.
2. **On request**: When the user says any of the following:
   - "update ppms" / "sync ppms"
   - "update architecture"
   - "refresh ppms"

When triggered on request, the agent must **re-scan the entire project** and update all 3 files.

---

## Strict Rules

1. **NEVER** skip updating PPMS after making code changes.
2. **DO NOT** place memory files outside the `.ppms/` directory.
3. **DO NOT** delete old entries in `log.md` — only add new ones at the top.
4. **ALWAYS** check if `.ppms/` exists before reading/writing.
5. If unsure whether architecture changed → **update it to be safe**.
6. Timestamps in `log.md` must use the user's local timezone.
7. `architecture-short.md` must always stay in sync with `architecture.md`.