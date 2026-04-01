import argparse
import asyncio
import json
from typing import Optional

import httpx


async def chat_request(url: str, text: str, conversation_id: Optional[str], timeout: float) -> None:
    payload = {"text": text}
    if conversation_id:
        payload["conversation_id"] = conversation_id

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        print(json.dumps(response.json(), ensure_ascii=False, indent=2))


async def stream_request(url: str, text: str, conversation_id: Optional[str], timeout: float) -> None:
    payload = {"text": text}
    if conversation_id:
        payload["conversation_id"] = conversation_id

    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                data = line.replace("data:", "", 1).strip()
                if not data:
                    continue
                try:
                    parsed = json.loads(data)
                except json.JSONDecodeError:
                    print(f"[warn] could not parse chunk: {data}")
                    continue
                print(json.dumps(parsed, ensure_ascii=False))


def build_urls(base_url: str, use_gateway: bool) -> tuple[str, str]:
    prefix = "/api/v1/ai" if use_gateway else "/api/v1"
    chat_url = base_url.rstrip("/") + prefix + "/chat"
    stream_url = chat_url + "/stream"
    return chat_url, stream_url


async def main() -> None:
    parser = argparse.ArgumentParser(description="Minimal tester for ai-service chat endpoints")
    parser.add_argument("--text", default="ping", help="Text prompt to send")
    parser.add_argument("--conversation-id", help="Conversation ID to continue a thread")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base URL to ai-service or gateway")
    parser.add_argument("--gateway", action="store_true", help="Use /api/v1/ai prefix (gateway)")
    parser.add_argument("--stream", action="store_true", help="Use streaming endpoint")
    parser.add_argument("--timeout", type=float, default=30.0, help="Request timeout in seconds")
    args = parser.parse_args()

    chat_url, stream_url = build_urls(args.base_url, args.gateway)

    try:
        if args.stream:
            await stream_request(stream_url, args.text, args.conversation_id, args.timeout)
        else:
            await chat_request(chat_url, args.text, args.conversation_id, args.timeout)
    except httpx.HTTPStatusError as exc:
        body = exc.response.text
        print(f"HTTP error {exc.response.status_code}: {body}")
    except httpx.HTTPError as exc:
        print(f"HTTP transport error: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
