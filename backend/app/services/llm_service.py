import time
import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from openai import OpenAI, APIConnectionError, APIError
import httpx
from ..config import settings
from ..models import ChatRequest, ChatMessage, ChatResponse

class LLMService:
    def __init__(self):
        pass

    def get_client(self, base_url: Optional[str] = None, api_key: Optional[str] = None) -> OpenAI:
        target_url = (base_url or settings.vllm_base_url).strip()
        target_key = (api_key or settings.vllm_api_key).strip()
        # Avoid hanging indefinitely on dead connection
        return OpenAI(
            base_url=target_url,
            api_key=target_key,
            timeout=httpx.Timeout(60.0, connect=5.0)
        )

    def prepare_messages(self, req: ChatRequest) -> List[Dict[str, str]]:
        messages = []
        
        # Add system prompt if provided or fallback to default
        system_content = req.system_prompt or settings.default_system_prompt
        if system_content:
            messages.append({"role": "system", "content": system_content})

        for msg in req.messages:
            if msg.role in ["user", "assistant", "system"] and msg.content:
                messages.append({"role": msg.role, "content": msg.content})
        
        return messages

    async def stream_chat(self, req: ChatRequest) -> AsyncGenerator[str, None]:
        client = self.get_client(req.base_url, req.api_key)
        model = req.model or settings.default_model
        messages = self.prepare_messages(req)
        temperature = req.temperature if req.temperature is not None else settings.default_temperature
        max_tokens = req.max_tokens or settings.default_max_tokens

        start_time = time.perf_counter()
        first_token_time = None

        try:
            # Run the synchronous OpenAI streaming call in an executor thread to avoid blocking asyncio event loop
            loop = asyncio.get_event_loop()
            
            def create_stream():
                return client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                )

            stream = await loop.run_in_executor(None, create_stream)

            def get_next_chunk(stream_iter):
                try:
                    return next(stream_iter)
                except StopIteration:
                    return None

            stream_iter = iter(stream)

            while True:
                chunk = await loop.run_in_executor(None, get_next_chunk, stream_iter)
                if chunk is None:
                    break

                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    text = delta.content if delta and delta.content else None
                    if text:
                        if first_token_time is None:
                            first_token_time = time.perf_counter()
                        
                        payload = {
                            "type": "content",
                            "text": text,
                        }
                        yield f"data: {json.dumps(payload)}\n\n"

            end_time = time.perf_counter()
            ttft = (first_token_time - start_time) if first_token_time else None
            total_latency = end_time - start_time

            metrics_payload = {
                "type": "done",
                "model": model,
                "ttft": round(ttft, 4) if ttft is not None else None,
                "latency": round(total_latency, 4),
            }
            yield f"data: {json.dumps(metrics_payload)}\n\n"

        except APIConnectionError as e:
            target_url = req.base_url or settings.vllm_base_url
            error_msg = (
                f"Connection Refused: Unable to connect to vLLM server at {target_url}.\n\n"
                f"Please ensure your vLLM server is running. For example, run:\n"
                f"```bash\nvllm serve {model} --port 8000\n```\n"
                f"Or update the Base URL / API Key in Settings modal."
            )
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'LLM Error: {str(e)}'})}\n\n"

    async def generate_chat(self, req: ChatRequest) -> ChatResponse:
        client = self.get_client(req.base_url, req.api_key)
        model = req.model or settings.default_model
        messages = self.prepare_messages(req)
        temperature = req.temperature if req.temperature is not None else settings.default_temperature
        max_tokens = req.max_tokens or settings.default_max_tokens

        start_time = time.perf_counter()
        
        loop = asyncio.get_event_loop()
        def create_completion():
            return client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False,
            )

        response = await loop.run_in_executor(None, create_completion)
        end_time = time.perf_counter()
        
        content = response.choices[0].message.content or ""
        latency = end_time - start_time
        
        return ChatResponse(
            id=response.id or "kittubot-" + str(int(time.time())),
            content=content,
            model=model,
            latency=round(latency, 4),
            timestamp=time.time()
        )

    async def check_health(self, base_url: Optional[str] = None) -> Dict[str, Any]:
        target_url = (base_url or settings.vllm_base_url).strip()
        models_url = f"{target_url.rstrip('/')}/models"
        
        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                res = await client.get(models_url)
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("id") for m in data.get("data", [])]
                    return {
                        "connected": True,
                        "url": target_url,
                        "models": models,
                        "error": None
                    }
                else:
                    return {
                        "connected": False,
                        "url": target_url,
                        "models": [],
                        "error": f"vLLM returned HTTP {res.status_code}"
                    }
            except Exception as e:
                return {
                    "connected": False,
                    "url": target_url,
                    "models": [],
                    "error": str(e)
                }

llm_service = LLMService()

