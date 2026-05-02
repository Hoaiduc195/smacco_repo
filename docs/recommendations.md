# Hybrid Recommendation Architecture

## Overview
Because the system employs a "Hybrid Search" model (where places only exist in the local database once a user interacts with them), the Recommendation engine faces a "Cold Start Problem." If it only queried the local database, it would miss out on thousands of highly relevant places that users haven't yet clicked on. 

To solve this, the Recommendation Module uses a **Two-Tier Hybrid Engine**: Broad Discovery followed by Internal Enrichment.

## The Two-Tier Flow

### Step 1: Base Discovery (External)
When a user requests a recommendation (e.g., "Recommend a hotel with a pool in Da Lat"):
1. The engine queries the External API (Google Places, OSM) using the filters.
2. It retrieves a top list of results (e.g., Top 50), which come with a **Base Score** (such as the Google Maps rating).

### Step 2: Data Enrichment (Internal)
The backend takes the `source_place_id`s from the Top 50 results and queries the local `places` database.
- **External Only Places:** Places not found in the local DB keep their Base Score.
- **Internal Places:** For places found in the local DB, the engine gathers deep interaction metrics.

### Step 3: Hybrid Scoring & Re-ranking
The module calculates a `Final_Score` for each place:
`Final_Score = Base_Score + Local_Boost`

**Local Boost Factors:**
- **Presence:** High current user occupancy (+ points).
- **Sentiment:** Positive internal Q&A and reviews (+ points).
- **RAG Semantic Matching:** If the user's complex request matches highly with the vector embeddings (`chunks`) of a place's QA/reviews, that place receives a massive boost.

## Deep Semantic Search (The Superpower)
For extremely niche requests (e.g., "A hotel where the owner has a fat tabby cat"), external APIs often fail. 
In these cases, the Recommendation engine utilizes `pgvector` to perform a similarity search directly across all `chunks` (reviews, files, QA) in the internal database. 
Even if the place wasn't in the initial broad discovery, it can be fetched and recommended purely based on deep semantic matches from community data, offering recommendations that standard map apps cannot provide.
