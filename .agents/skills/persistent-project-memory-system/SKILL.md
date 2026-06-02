---
name: persistent-project-memory-system
description: >
  Automatically maintains long-term project memory. The agent MUST create and
  update architecture & changelog files after EVERY prompt that modifies code
  or when the user requests a PPMS update.
license: MIT
metadata:
  author: Hoaiduc195
  version: 3.0.0
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
├── architecture-<branch>.md   # Full architecture description (per branch)
└── log-<branch>.md            # Chronological changelog (per branch)
```

**Branch naming convention**: The `<branch>` part is derived from the current
git branch name by replacing `/` with `-`.
Examples:
- Branch `main` -> `architecture-main.md`, `log-main.md`
- Branch `feat/improve_parsing` -> `architecture-feat-improve-parsing.md`, `log-feat-improve-parsing.md`
- Branch `fix/auth-bug` -> `architecture-fix-auth-bug.md`, `log-fix-auth-bug.md`

To get the current branch name, run: `git branch --show-current`

If the `.ppms/` directory or any of the files do not exist, the agent **MUST create them automatically**.

---

## Initialization

When starting a session, if `.ppms/` or any files inside are missing:

1. **Determine current branch** by running `git branch --show-current`.

2. **Scan the entire project** to understand the architecture:
   - Read `package.json`, `tsconfig.json`, `prisma/schema.prisma`, `docker-compose.yml`, and other config files (if they exist).
   - Browse directory structure: `src/`, `app/`, `pages/`, `api/`, `server/`, `client/`, etc.
   - Identify frameworks, libraries, and technologies in use.
   - Discover API routes/endpoints, database schemas, and main modules.

3. **Create the required files** following the formats defined below.

---

## File Formats

### 1. `.ppms/architecture-<branch>.md` — Full Architecture

```md
# Project Architecture: [Project Name]

> Last updated: [YYYY-MM-DD HH:MM]
> Branch: [branch-name]

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

### 2. `.ppms/log-<branch>.md` — Changelog

Records all changes for the current branch in chronological order (newest entries at the top):

```md
# Project Changelog

---

## [YYYY-MM-DD HH:MM] — Short title

- **Branch**: `branch-name`
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

1. Determine the current branch with `git branch --show-current`.
2. Read `.ppms/architecture-<branch>.md` for project context.
   - If the file for this branch doesn't exist yet, check if another branch's
     architecture file exists and use it as a starting point, then create the
     new branch-specific file.
3. Read `.ppms/log-<branch>.md` (last 5-10 entries) to understand recent changes.
   - If the log file for this branch doesn't exist yet, create a new one.

### DURING the task

- Track all architectural changes, new files, deleted files, new endpoints, etc.
- If changes affect the architecture, plan to update the architecture file.

### AFTER each task (MANDATORY)

The agent **MUST complete ALL** of the following steps before ending the session:

#### Step 1: Update `.ppms/log-<branch>.md`
- Add a new entry **at the top of the file** (after the title) using the format above.
- Use the user's local timezone for the timestamp.

#### Step 2: Update `.ppms/architecture-<branch>.md` (if architecture changed)
Update if any of the following occurred:
- Added/removed/changed a dependency or framework
- Added/removed/modified an API endpoint
- Changed directory structure
- Added/removed a module, component, or service
- Changed database schema
- Added a new feature or completed an existing one

---

## Update Triggers

The agent must update PPMS when:

1. **Automatic**: After every prompt where the agent modifies code or configuration.
2. **On request**: When the user says any of the following:
   - "update ppms" / "sync ppms"
   - "update architecture"
   - "refresh ppms"

When triggered on request, the agent must **re-scan the entire project** and update all files.

---

## Strict Rules

1. **NEVER** skip updating PPMS after making code changes.
2. **DO NOT** place memory files outside the `.ppms/` directory.
3. **DO NOT** delete old entries in log files — only add new ones at the top.
4. **ALWAYS** check if `.ppms/` exists before reading/writing.
5. If unsure whether architecture changed -> **update it to be safe**.
6. Timestamps in log files must use the user's local timezone.
7. **Both architecture and log files are branch-specific.** Always use the correct branch name in the filename.
8. When switching branches, read the architecture and log files for that branch. If they don't exist, create new ones (architecture can optionally be based on the closest parent branch's file).