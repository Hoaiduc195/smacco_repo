CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- USERS
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_firebase_uid ON app_users(firebase_uid);

-- PLACES
CREATE TABLE IF NOT EXISTS places (
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

CREATE INDEX IF NOT EXISTS idx_places_location ON places(lat, lng);
CREATE INDEX IF NOT EXISTS idx_places_categories ON places USING GIN(categories);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  source TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);

-- FILES
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  file_name TEXT,
  mime_type TEXT,
  file_size INT,
  storage_url TEXT,
  file_status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_place_id ON files(place_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(file_status);

-- CHUNKS
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  chunk_index INT,
  content TEXT NOT NULL,
  token_count INT,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_place_id ON chunks(place_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source_type ON chunks(source_type);
CREATE INDEX IF NOT EXISTS idx_chunks_source_id ON chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON chunks USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
ON chunks USING hnsw (embedding vector_cosine_ops);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_place_id ON conversations(place_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  message_text TEXT NOT NULL,
  retrieved_chunk_ids UUID[],
  token_input INT,
  token_output INT,
  latency_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Seed data
INSERT INTO app_users (firebase_uid, email, display_name)
VALUES
  ('firebase_u001', 'a@example.com', 'Nguyen Van A'),
  ('firebase_u002', 'b@example.com', 'Tran Thi B')
ON CONFLICT DO NOTHING;

INSERT INTO places (source, source_place_id, place_name, place_address, categories, lat, lng)
VALUES
  ('osm', 'ChIJN1t_tDeuEmsRUsoyG83frY4', 'Ca phe vot Cheo Leo', 'Quan 3, TP.HCM', ARRAY['food','cafe'], 10.7769, 106.6869),
  ('osm', 'ChIJ_example_danang', 'Bun cha ca Da Nang', 'Hai Chau, Da Nang', ARRAY['food'], 16.0544, 108.2022),
  ('osm', 'ChIJ_example_homestay', 'Homestay Chill Da Lat', 'Phuong 1, Da Lat', ARRAY['accommodation'], 11.9404, 108.4583)
ON CONFLICT DO NOTHING;

INSERT INTO reviews (place_id, user_id, rating, review_text)
SELECT p.id, u.id, 5, 'Quan an ngon, gia re, hop ly!'
FROM places p, app_users u
WHERE p.source_place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4'
  AND u.firebase_uid = 'firebase_u001'
ON CONFLICT DO NOTHING;
