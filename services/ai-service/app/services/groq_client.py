import json
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

import httpx

from app.core.config import settings
from app.schemas.chat import ChatMessage


class GroqClient:
    """Thin client for Groq Chat Completions API."""

    def __init__(self):
        self.base_url = settings.GROQ_BASE_URL.rstrip("/")
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.timeout = settings.GROQ_TIMEOUT

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(
        self,
        messages: List[ChatMessage],
        stream: bool = False,
    ) -> Tuple[str, Optional[str], Optional[Dict[str, Any]]]:
        payload = {
            "model": self.model,
            "messages": [message.model_dump() for message in messages],
            "stream": stream,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:  # surface Groq error details
                detail = exc.response.text if exc.response is not None else str(exc)
                raise RuntimeError(f"Groq chat failed: {detail}") from exc

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            finish_reason = data["choices"][0].get("finish_reason")
            usage = data.get("usage")
            return content, finish_reason, usage

    async def stream_chat(
        self, messages: List[ChatMessage]
    ) -> AsyncGenerator[Tuple[str, Optional[str]], None]:
        payload = {
            "model": self.model,
            "messages": [message.model_dump() for message in messages],
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            ) as response:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    detail = exc.response.text if exc.response is not None else str(exc)
                    raise RuntimeError(f"Groq chat stream failed: {detail}") from exc

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        raw = line[len("data: ") :].strip()
                    else:
                        raw = line.strip()
                    if raw == "[DONE]":
                        break
                    try:
                        parsed = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    choices = parsed.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {}).get("content", "")
                    finish = choices[0].get("finish_reason")
                    if delta or finish:
                        yield delta, finish
