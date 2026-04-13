# Module: frontend

## Purpose
React SPA for authentication, map-based place discovery, AI chat, recommendations, and trip planning.

## TL;DR
- UI layer; talks to backend APIs via Axios and fetch SSE.
- Uses Firebase Auth + Firestore for user/session and trip data.
- Uses Leaflet map, OSRM routing, and fallback geocoding/search paths.
- Streams AI responses from /ai/chat/stream and maintains in-memory conversation state.

## Key Files
- services/frontend/src/App.jsx -> app routes and provider wiring
- services/frontend/src/services/api.js -> Axios client, auth token injection, 401 redirect handling
- services/frontend/src/services/aiService.js -> chat + streaming chat API calls
- services/frontend/src/hooks/useStreamingChat.js -> SSE chunk parsing and chat state updates
- services/frontend/src/services/placeService.js -> place search/details/reviews + fallback behavior
- services/frontend/src/services/recommendationService.js -> recommendation request client
- services/frontend/src/contexts/AuthContext.jsx -> Firebase auth context
- services/frontend/src/contexts/TravelDataContext.jsx -> trip/place/accommodation state via Firestore subscriptions
- services/frontend/src/components/MapComponent.jsx -> Leaflet rendering, markers, clusters, route visuals
- services/frontend/src/pages/HomePage.jsx -> core interaction flow (search/map/chat/trip actions)

## API Endpoints (if any)
- POST /ai/chat -> one-shot AI response
- POST /ai/chat/stream -> SSE streaming AI response
- GET /places/search -> search places
- GET /places/nearby -> nearby places by coordinates/radius
- GET /places/:id -> place detail
- GET /places/:id/reviews -> reviews by place
- POST /recommendations/recommend -> recommendation query
- External: GET https://router.project-osrm.org/... -> route calculation
- External: GET https://nominatim.openstreetmap.org/... -> fallback place search/geocoding

## Data Flow
UI event -> service call -> API response -> normalized UI model -> map/cards/chat rendering.
Auth token from Firebase is attached in services/frontend/src/services/api.js, then all protected backend calls use that token.
Chat flow: services/frontend/src/hooks/useStreamingChat.js consumes SSE chunks and appends partial assistant output incrementally.

## Dependencies
- React, React Router, Vite
- Axios
- Firebase Auth + Firestore
- Leaflet, react-leaflet, marker clustering
- TailwindCSS
- External services: core API gateway, OSRM, Nominatim

## Important Logic
- SSE parser splits by double newline and parses data: payload chunks.
- Search has provider fallback path when primary API fails.
- Firestore save flows include dedup checks for owned/saved places.
- Geolocation fallback defaults to preset coordinates when permission/device lookup fails.

## Notes
- Chat conversation_id is maintained in client state and is not durable across full reload.
- Base API URL defaults to http://localhost/api/v1 when env var is missing.
- 401 handling forces navigation to login to prevent stale-auth behavior.
