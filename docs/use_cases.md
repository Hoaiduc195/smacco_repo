# Use Cases

This document describes the main user and system use cases for the `mono` accommodation platform. The application combines realtime presence, RAG-powered AI chat, user-to-user interaction, and personalized recommendation features.

## Personas

- **Traveler**: Browses accommodations, asks questions, reads reviews, and chooses a place.
- **On-site Guest**: Checks in or stays at a place, participates in local conversations, and asks the chatbot for on-site information.
- **Reviewer**: Leaves reviews and contributes content that improves recommendations and chatbot answers.
- **Recommendation Seeker**: Wants personalized accommodation suggestions based on preferences and contextual signals.
- **Product Owner / Developer**: Uses the system architecture, APIs, and data model to extend or integrate the platform.

## Use Case 1: Accommodation Discovery with Recommendations

### Description
A traveler wants to discover suitable accommodations and receive recommendations based on their preferences and available place data.

### Flow
1. User opens the React frontend and navigates to the search or home page.
2. The app displays places with map, category, and price overview.
3. User requests recommendations or filters by destination, type, or category.
4. The backend uses the recommendation module to score and rank places.
5. Recommended accommodations are shown with contextual details and images.

### System support
- `SearchModule` for place lookup
- `RecommendationsModule` for ranking and scoring
- `PlacesModule` for place metadata and geolocation
- Frontend display and filters

## Use Case 2: RAG Chatbot per Accommodation

### Description
A traveler wants to ask a chatbot questions about a specific accommodation and receive answers based on reviews, documents, and stored place information.

### Flow
1. User selects a place and opens the chatbot interface.
2. The frontend starts a chat session for that accommodation.
3. The backend loads conversation context and retrieval chunks for the selected place.
4. The RAG pipeline retrieves the most relevant chunks and sends prompts to the LLM.
5. The chatbot returns an answer referencing reviews or stored place content.

### System support
- `RagModule` for chunk storage and retrieval
- `ChatModule` for chat session handling
- `AiModule` for prompt orchestration and parsing
- `ContributionsModule` for user-uploaded data and file metadata
- `UsersModule` for authenticated user identity

## Use Case 3: Place-Specific Q&A from Guest Users

### Description
A user asks a question about a place and receives answers from other users who are currently staying there.

### Flow
1. User navigates to a place detail page.
2. They submit a question through the local Q&A interface.
3. The question is routed to the place-specific Q&A stream.
4. Current on-site users see the question and respond.
5. Answers are stored in the platform and may later improve chatbot responses.

### System support
- `PresenceModule` to identify users at the same accommodation
- Real-time web UI for question and answer exchange
- `ContributionsModule` for storing user-generated content

## Use Case 4: Real-Time User Presence

### Description
A user wants to know how many people are currently staying at an accommodation.

### Flow
1. The frontend requests the presence count for a place.
2. The backend returns live presence status for that location.
3. The UI shows occupancy and optionally presence-related information.

### System support
- `PresenceModule` for occupancy tracking
- `PlacesModule` and `UsersModule` for place-user relationships
- Frontend real-time refresh or polling

## Use Case 5: User-to-User Chat at the Same Location

### Description
Users staying at the same accommodation can chat directly with one another.

### Flow
1. The app detects that multiple users are present at the same place.
2. A local chat room or private message channel is made available.
3. Users exchange messages about shared experiences, nearby amenities, or tips.

### System support
- `PresenceModule` for shared location context
- `ChatModule` for messaging logic
- `Messages` and `Conversations` persistence

## Use Case 6: Contributing Data to Improve RAG Responses

### Description
A guest provides new information through the chatbot or file uploads, and the system stores it to improve future responses.

### Flow
1. User contributes a text message, review, or file while interacting with the chatbot.
2. The backend stores the contribution in the database.
3. The stored data is chunked and embedded by the RAG pipeline.
4. Subsequent chatbot queries use the new data for retrieval and response quality.

### System support
- `ContributionsModule` for file uploads and user content
- `RagModule` for chunking, vectorizing, and metadata storage
- `ChatModule` for connecting contributions to session context

## Use Case 7: Developer Integration and API Usage

### Description
A developer wants to integrate the platform with another service or extend it with custom UI behavior.

### Flow
1. Developer reads the API docs at `/api/docs`.
2. They review backend modules, routes, and database models.
3. They integrate with authentication or add a frontend route.
4. They may also use Prisma schema and migrations to extend the data model.

### System support
- Swagger docs at `/api/docs`
- `mono/backend/src/app.module.ts` as the application entrypoint
- `mono/backend/prisma/schema.prisma` as the canonical data schema
- `mono/docker-compose.yml` for local infrastructure

## Notes

These use cases highlight the core capabilities of the current system:
- AI-powered place-specific chat with RAG
- Personalized recommendations
- Real-time presence and local social interactions
- User-generated content history feeding the chatbot
- Modular NestJS backend with Prisma persistence

The file `mono/docs/FEATURES.md` describes the product feature intent, while this `use_cases.md` document details real user and technical scenarios supported by the system.
