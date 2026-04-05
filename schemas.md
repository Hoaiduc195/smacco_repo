
```sql
-- ================================
-- EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================
-- USERS
-- ================================
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_app_users_firebase_uid ON app_users(firebase_uid);

-- ================================
-- PLACES
-- ================================
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    source TEXT NOT NULL,
    source_place_id TEXT,

    place_name TEXT NOT NULL,
    place_address TEXT,
    categories TEXT[],

    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT lat_range CHECK (lat BETWEEN -90 AND 90),
    CONSTRAINT lng_range CHECK (lng BETWEEN -180 AND 180)
);

CREATE INDEX idx_places_location ON places(lat, lng);
CREATE INDEX idx_places_categories ON places USING GIN(categories);

-- ================================
-- REVIEWS
-- ================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    source TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_place_id ON reviews(place_id);

-- ================================
-- FILES
-- ================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,

    file_name TEXT,
    mime_type TEXT,
    file_size INT,
    storage_url TEXT,

    file_status TEXT NOT NULL, -- uploaded | parsing | chunking | embedding | done | failed
    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_place_id ON files(place_id);
CREATE INDEX idx_files_status ON files(file_status);

-- ================================
-- CHUNKS (CORE RAG TABLE)
-- ================================
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,

    source_type TEXT NOT NULL,     -- review | file
    source_id UUID NOT NULL,

    chunk_index INT,
    content TEXT NOT NULL,
    token_count INT,

    metadata JSONB,

    embedding vector(1536),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Filtering indexes
CREATE INDEX idx_chunks_place_id ON chunks(place_id);
CREATE INDEX idx_chunks_source_type ON chunks(source_type);
CREATE INDEX idx_chunks_source_id ON chunks(source_id);
CREATE INDEX idx_chunks_metadata ON chunks USING GIN(metadata);

-- Vector index (HNSW)
CREATE INDEX idx_chunks_embedding_hnsw
ON chunks USING hnsw (embedding vector_cosine_ops);

-- ================================
-- CONVERSATIONS
-- ================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_place_id ON conversations(place_id);

-- ================================
-- MESSAGES
-- ================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

    sender_role TEXT NOT NULL,   -- user | assistant
    message_text TEXT NOT NULL,

    retrieved_chunk_ids UUID[],
    token_input INT,
    token_output INT,
    latency_ms INT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```