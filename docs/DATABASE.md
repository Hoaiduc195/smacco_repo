
# Database Architecture

This document describes the PostgreSQL schema used by the `mono` application, including Prisma mapping, deployment setup, table responsibilities, relationships, and index design.

## Stack and runtime

- Database: PostgreSQL 16
- Vector extension: `pgvector` (`vector` extension)
- ORM: Prisma
- Database URLs: defined in `mono/.env` / `mono/.env.example`
- Docker container: `pgvector/pgvector:pg16`

## Setup and migration

The application expects a standard PostgreSQL connection string defined in `DATABASE_URL`.

Example from `mono/.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accommodation_db?schema=public
```

With Docker Compose, the database is started as:

- service: `postgres`
- image: `pgvector/pgvector:pg16`
- exposed port: `5433:5432`

Migration / schema initialization commands:

```bash
cd mono
npx prisma migrate deploy
# or if migrations are not yet applied
npx prisma db push
```

The backend also generates Prisma client code as part of install/start workflows.

## Prisma configuration

The Prisma schema is located in `mono/backend/prisma/schema.prisma`.

Key database configuration:

- `provider = "postgresql"`
- `extensions = [vector]`
- `previewFeatures = ["postgresqlExtensions"]`
- `Unsupported("vector")` is used for the `chunks.embedding` field
- Table names are mapped explicitly with `@@map(...)`
- Many-to-one relations are defined in Prisma and enforced by PostgreSQL foreign keys in migrations
- Prisma client is generated with `prisma-client-js`

## Logical schema overview

The database supports the following data models:

1. `app_users`
   - Stores authenticated users linked to Firebase.
   - Indexed by `firebase_uid` for quick lookup.
2. `places`
   - Stores places, search sources, location coordinates, and categories.
3. `reviews`
   - Stores place reviews and optional author information.
4. `files`
   - Stores user-uploaded files associated with places.
   - Tracks upload status and parsing/processing state.
5. `chunks`
   - Core Retrieval-Augmented Generation (RAG) table.
   - Stores tokenized content, embeddings, and optional metadata.
6. `conversations`
   - Stores chat sessions scoped to a place and optional authenticated user.
7. `messages`
   - Stores chat transcript entries for a conversation.
8. `questions`
   - Stores user questions about a place with optional author and status metadata.
9. `answers`
   - Stores answer content for a question with vote counts and author association.
10. `answer_votes`
   - Stores per-user votes on answers to enforce one vote per answer/user.

## Table relationships

- `app_users` can have many `reviews`, `files`, `chunks`, and `conversations`.
- `places` can have many `reviews`, `files`, `chunks`, and `conversations`.
- `reviews.place_id` references `places.id` and cascades on delete.
- `reviews.user_id` references `app_users.id` and is set to `NULL` on delete.
- `files.place_id` references `places.id` and cascades on delete.
- `files.user_id` references `app_users.id` and is set to `NULL` on delete.
- `chunks.place_id` references `places.id` and cascades on delete.
- `chunks.user_id` references `app_users.id` and is set to `NULL` on delete.
- `conversations.place_id` references `places.id` and cascades on delete.
- `conversations.user_id` references `app_users.id` and is set to `NULL` on delete.
- `questions.place_id` references `places.id` and cascades on delete.
- `questions.user_id` references `app_users.id` and is set to `NULL` on delete.
- `answers.question_id` references `questions.id` and cascades on delete.
- `answers.user_id` references `app_users.id` and is set to `NULL` on delete.
- `answer_votes.answer_id` references `answers.id` and cascades on delete.
- `answer_votes.user_id` references `app_users.id` and cascades on delete.
- `messages.conversation_id` references `conversations.id` and cascades on delete.

## Special fields and semantics

### `chunks` table

- `source_type`: indicates the origin of the chunk, typically `review` or `file`.
- `source_id`: stores the UUID of the originating source record.
- `chunk_index`: optional chunk ordering index.
- `content`: raw text used for retrieval and embedding.
- `metadata`: JSONB payload for additional structured metadata.
- `embedding`: vector column used by pgvector for semantic search.

### `messages` table

- `sender_role`: `user` or `assistant`.
- `retrieved_chunk_ids`: array of chunk UUIDs returned during retrieval.
- `token_input` / `token_output`: token counts recorded for model usage.
- `latency_ms`: measured response latency for analytics.

## Index strategy

Current indexes optimize key query patterns:

- `app_users(firebase_uid)`
- `places(lat, lng)`
- `reviews(place_id)`
- `files(place_id)`
- `files(file_status)`
- `chunks(place_id)`
- `chunks(source_type)`
- `chunks(source_id)`
- `conversations(place_id)`
- `questions(place_id)`
- `answers(question_id)`
- `answer_votes(answer_id)`
- `answer_votes(user_id)`
- `messages(conversation_id)`

## Notes

- PostgreSQL UUID generation is handled by Prisma via `@default(uuid())`, so SQL schema does not require `uuid-ossp`.
- The `vector` extension is required before creating the `chunks` table.
- `rating` is stored as an integer but current schema does not enforce a database-level range constraint.
- The Prisma schema and the generated migration SQL are the source of truth for this project.

## Current SQL schema reference

```sql
-- ================================
-- EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================
-- USERS
-- ================================
-- Prisma model: `User` (maps to table `app_users`)
CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX app_users_firebase_uid_key ON app_users(firebase_uid);
CREATE INDEX idx_app_users_firebase_uid ON app_users(firebase_uid);

-- ================================
-- PLACES
-- ================================
-- Prisma model: `Place` (maps to table `places`)
CREATE TABLE places (
    id UUID PRIMARY KEY,
    source TEXT NOT NULL,
    source_place_id TEXT,
    place_name TEXT NOT NULL,
    place_address TEXT,
    categories TEXT[],
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_places_location ON places(lat, lng);

-- ================================
-- REVIEWS
-- ================================
-- Prisma model: `Review` (maps to table `reviews`)
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    place_id UUID NOT NULL,
    user_id UUID,
    rating INTEGER NOT NULL,
    review_text TEXT,
    source TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_place_id ON reviews(place_id);

-- ================================
-- FILES
-- ================================
-- Prisma model: `File` (maps to table `files`)
CREATE TABLE files (
    id UUID PRIMARY KEY,
    user_id UUID,
    place_id UUID NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    file_size INTEGER,
    storage_url TEXT,
    file_status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_place_id ON files(place_id);
CREATE INDEX idx_files_status ON files(file_status);

-- ================================
-- CHUNKS (CORE RAG TABLE)
-- ================================
-- Prisma model: `Chunk` (maps to table `chunks`)
CREATE TABLE chunks (
    id UUID PRIMARY KEY,
    place_id UUID NOT NULL,
    user_id UUID,
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    chunk_index INTEGER,
    content TEXT NOT NULL,
    token_count INTEGER,
    metadata JSONB,
    embedding vector NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chunks_place_id ON chunks(place_id);
CREATE INDEX idx_chunks_source_type ON chunks(source_type);
CREATE INDEX idx_chunks_source_id ON chunks(source_id);

-- ================================
-- CONVERSATIONS
-- ================================
-- Prisma model: `Conversation` (maps to table `conversations`)
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    place_id UUID NOT NULL,
    user_id UUID,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_place_id ON conversations(place_id);

-- ================================
-- QUESTIONS
-- ================================
-- Prisma model: `Question` (maps to table `questions`)
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    place_id UUID NOT NULL,
    user_id UUID,
    title TEXT,
    question_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_place_id ON questions(place_id);

-- ================================
-- ANSWERS
-- ================================
-- Prisma model: `Answer` (maps to table `answers`)
CREATE TABLE answers (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL,
    user_id UUID,
    answer_text TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_question_id ON answers(question_id);

-- ================================
-- ANSWER VOTES
-- ================================
-- Prisma model: `AnswerVote` (maps to table `answer_votes`)
CREATE TABLE answer_votes (
    id UUID PRIMARY KEY,
    answer_id UUID NOT NULL,
    user_id UUID NOT NULL,
    vote INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_answer_votes_answer_id_user_id ON answer_votes(answer_id, user_id);
CREATE INDEX idx_answer_votes_answer_id ON answer_votes(answer_id);
CREATE INDEX idx_answer_votes_user_id ON answer_votes(user_id);

-- ================================
-- MESSAGES
-- ================================
-- Prisma model: `Message` (maps to table `messages`)
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_role TEXT NOT NULL,
    message_text TEXT NOT NULL,
    retrieved_chunk_ids UUID[],
    token_input INTEGER,
    token_output INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```