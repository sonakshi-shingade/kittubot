from fastapi import APIRouter, HTTPException, Query
from starlette.responses import StreamingResponse
from typing import Optional, Dict, Any, List
from ..models import ChatRequest, ChatResponse, HealthStatus, ModelInfo
from ..services.llm_service import llm_service
from ..config import settings

router = APIRouter(tags=["Chat & LLM"])

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Endpoint for chat completions.
    Supports Server-Sent Events (SSE) streaming matching streamlit.py streaming logic,
    as well as single-shot responses.
    """
    if request.stream:
        return StreamingResponse(
            llm_service.stream_chat(request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    else:
        try:
            return await llm_service.generate_chat(request)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=HealthStatus)
async def health(base_url: Optional[str] = None):
    """
    Health check verifying KittuBot backend status and vLLM connectivity.
    """
    health_data = await llm_service.check_health(base_url)
    return HealthStatus(
        status="ok",
        app=settings.app_name,
        vllm_connected=health_data["connected"],
        vllm_url=health_data["url"],
        model=settings.default_model,
        error=health_data["error"]
    )

@router.get("/models")
async def get_models(base_url: Optional[str] = None) -> List[ModelInfo]:
    """
    Retrieve models available from vLLM, defaulting to configured model.
    """
    health_data = await llm_service.check_health(base_url)
    if health_data["connected"] and health_data["models"]:
        return [ModelInfo(id=m) for m in health_data["models"]]
    
    # Return default model configured if vLLM isn't reachable yet
    return [
        ModelInfo(id=settings.default_model),
        ModelInfo(id="Qwen/Qwen2.5-7B-Instruct"),
        ModelInfo(id="meta-llama/Llama-3.2-3B-Instruct"),
    ]

