# Hybrid Search Architecture

## Overview
The application utilizes a **Hybrid Search Model** to balance the vast, up-to-date dataset of the real world with our application's deep, rich, community-driven interaction data.

Instead of attempting to crawl, sync, and maintain a local database of all possible places, the system delegates broad discovery to external APIs while deeply managing places only when users interact with them.

## The Hybrid Flow

1. **Discovery (External APIs)**
   - When a user performs a search (e.g., "hotels in Da Lat"), the search module delegates the query to external providers like Google Places or OpenStreetMap.
   - The system returns a broad list of places directly to the frontend.
   - *Crucially, these places are NOT saved to the local database at this stage.*

2. **Interaction & Ingestion (Local DB)**
   - When a user interacts with a place (e.g., clicks to view details, asks a question in QA, chats with the RAG bot, or checks in), the backend checks if the `source_place_id` exists in the local `places` table.
   - **If it does not exist:** The backend automatically creates a new record in the `places` table, copying essential metadata (name, coordinates, categories) from the external provider and assigning a local internal UUID.
   - **If it does exist:** The backend uses the existing internal UUID.

3. **Enrichment & Management**
   - Once a place has an internal UUID, all platform-specific data is tied to it via foreign keys.
   - This includes user reviews, user presence (check-ins), QA questions/answers, uploaded files, and RAG embeddings (`chunks` table).

## Benefits
- **No Data Bloat:** The database only stores places that users actually care about and interact with.
- **Zero Maintenance of World Data:** We do not have to build systems to sync opening hours, name changes, etc., for millions of unused places.
- **Data Sovereignty:** All valuable user-generated content (QA, presence, chats) is strictly bound to our internal ecosystem.

## Considerations
- **Deduplication:** A unique constraint on `(source, source_place_id)` is required to ensure the same external place doesn't get imported twice.
- **Data Freshness:** For places stored in the local DB, a background job or "read-through" cache mechanism should periodically refresh basic metadata (like name or address) from the external API to ensure it hasn't become severely outdated.
