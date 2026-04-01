import json
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        return await chat_service.chat(request)
    except Exception as e:  # pragma: no cover - surface clean error
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    try:
        async def event_publisher() -> AsyncGenerator[bytes, None]:
            try:
                async for chunk in chat_service.stream_chat(request):
                    payload = chunk.model_dump()
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode()
            except Exception as exc:
                # Send a terminal SSE frame with error detail instead of dropping the connection
                error_payload = {
                    "conversation_id": request.conversation_id,
                    "finish_reason": "error",
                    "error": str(exc),
                }
                yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n".encode()

        return StreamingResponse(event_publisher(), media_type="text/event-stream")
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=502, detail=str(e))
