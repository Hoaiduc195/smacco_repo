import time
from typing import List, Tuple
from uuid import uuid4

from app.schemas.chat import ChatMessage


class ConversationStore:
    """In-memory conversation history with simple trimming."""

    def __init__(self, max_messages: int = 20, ttl_seconds: int = 3600):
        self.max_messages = max_messages
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, Tuple[float, List[ChatMessage]]] = {}

    def _now(self) -> float:
        return time.time()

    def _ensure(self, conversation_id: str) -> None:
        if conversation_id not in self._store:
            self._store[conversation_id] = (self._now(), [])

    def create_id(self) -> str:
        conversation_id = str(uuid4())
        self._ensure(conversation_id)
        return conversation_id

    def get_history(self, conversation_id: str) -> List[ChatMessage]:
        record = self._store.get(conversation_id)
        if not record:
            return []
        created_at, messages = record
        if self._now() - created_at > self.ttl_seconds:
            self._store.pop(conversation_id, None)
            return []
        return messages[-self.max_messages :]

    def append(self, conversation_id: str, message: ChatMessage) -> None:
        self._ensure(conversation_id)
        created_at, messages = self._store[conversation_id]
        messages.append(message)
        # Trim oldest to respect max_messages
        if len(messages) > self.max_messages:
            messages[:] = messages[-self.max_messages :]
        self._store[conversation_id] = (created_at, messages)

    def reset(self, conversation_id: str) -> None:
        self._store.pop(conversation_id, None)
