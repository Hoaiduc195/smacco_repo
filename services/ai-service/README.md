# Module: ai-service

## Purpose
FastAPI service for conversational AI and NLP parsing; manages conversation context and delegates recommendations to recommendation-service.

## TL;DR
- Exposes chat (sync + streaming SSE) and parse APIs.
- Uses Groq LLM for generation.
- Keeps short-lived in-memory conversation history.
- Extracts filters from text and calls recommendation-service.

## Key Files
- services/ai-service/app/main.py -> app setup, router mount, CORS, health
- services/ai-service/app/api/v1/router.py -> v1 route composition
- services/ai-service/app/api/v1/endpoints/chat.py -> chat + stream endpoints
- services/ai-service/app/api/v1/endpoints/parse.py -> parse endpoint
- services/ai-service/app/services/chat_service.py -> message construction and orchestration
- services/ai-service/app/services/groq_client.py -> Groq API integration and stream handling
- services/ai-service/app/services/conversation_store.py -> TTL-based in-memory conversation state
- services/ai-service/app/services/nlp_service.py -> keyword-based filter extraction
- services/ai-service/app/services/recommendation_client.py -> recommendation-service HTTP client
- services/ai-service/app/core/config.py -> runtime settings

## API Endpoints (if any)
- POST /api/v1/chat -> full chat response
- POST /api/v1/chat/stream -> SSE incremental response chunks
- POST /api/v1/parse -> parse query and return recommendations
- GET /health -> service health

## Data Flow
Client message -> chat/parse endpoint -> service layer.
Chat: conversation history + system prompt -> Groq completion -> store updated conversation -> return full/streamed output.
Parse: text -> NLP filters -> recommendation client call -> merged response.

## Dependencies
- FastAPI, Pydantic, Uvicorn
- httpx
- Groq API
- recommendation-service
- Conversation state is in-memory; database integration is optional

## Important Logic
- Conversation store enforces TTL and max message window.
- Streaming uses SSE data events and emits structured error chunks on failures.
- NLP extraction is deterministic keyword matching, not model-based intent parsing.
- System prompt constrains response style/language behavior.

## Notes
- Conversation state resets on process restart.
- If recommendation-service is unavailable, parse flow returns upstream failure.
- CORS is permissive by default and should be tightened for production.
