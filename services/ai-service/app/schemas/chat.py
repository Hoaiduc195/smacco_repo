from typing import List, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "system" | "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    text: str
    conversation_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    finish_reason: Optional[str] = None
    usage_prompt_tokens: Optional[int] = None
    usage_completion_tokens: Optional[int] = None
    messages: Optional[List[ChatMessage]] = None


class StreamChunk(BaseModel):
    conversation_id: str
    delta: str
    finish_reason: Optional[str] = None
