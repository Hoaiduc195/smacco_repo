from typing import AsyncGenerator, List, Optional

from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse, StreamChunk
from app.services.conversation_store import ConversationStore
from app.services.groq_client import GroqClient


SYSTEM_PROMPT = (
    "You are a helpful travel and local guide assistant. "
    "Answer clearly and concisely in Vietnamese. "
    "Return plain text only (no Markdown, no bullet points, no code blocks)."
)


class ChatService:
    def __init__(self):
        self.store = ConversationStore()
        self.client = GroqClient()

    def _build_messages(self, conversation_id: str, user_text: str) -> List[ChatMessage]:
        history = self.store.get_history(conversation_id)
        messages = [ChatMessage(role="system", content=SYSTEM_PROMPT)]
        messages.extend(history)
        messages.append(ChatMessage(role="user", content=user_text))
        return messages

    async def chat(self, request: ChatRequest) -> ChatResponse:
        conversation_id = request.conversation_id or self.store.create_id()
        messages = self._build_messages(conversation_id, request.text)

        content, finish_reason, usage = await self.client.chat(messages, stream=False)

        # Update history
        self.store.append(conversation_id, ChatMessage(role="user", content=request.text))
        self.store.append(conversation_id, ChatMessage(role="assistant", content=content))

        return ChatResponse(
            answer=content,
            conversation_id=conversation_id,
            finish_reason=finish_reason,
            usage_prompt_tokens=usage.get("prompt_tokens") if usage else None,
            usage_completion_tokens=usage.get("completion_tokens") if usage else None,
            messages=self.store.get_history(conversation_id),
        )

    async def stream_chat(
        self, request: ChatRequest
    ) -> AsyncGenerator[StreamChunk, None]:
        conversation_id = request.conversation_id or self.store.create_id()
        messages = self._build_messages(conversation_id, request.text)

        assistant_reply_parts: List[str] = []
        async for delta, finish in self.client.stream_chat(messages):
            if delta:
                assistant_reply_parts.append(delta)
                yield StreamChunk(conversation_id=conversation_id, delta=delta)
            if finish:
                break

        full_answer = "".join(assistant_reply_parts)
        # Update history after streaming completes
        self.store.append(conversation_id, ChatMessage(role="user", content=request.text))
        self.store.append(conversation_id, ChatMessage(role="assistant", content=full_answer))

        yield StreamChunk(
            conversation_id=conversation_id,
            delta="",
            finish_reason="stop",
        )
