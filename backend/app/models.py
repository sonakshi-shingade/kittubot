from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time
import uuid

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: float = Field(default_factory=time.time)
    ttft: Optional[float] = None
    latency: Optional[float] = None
    model: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    stream: bool = True
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    system_prompt: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    role: str = "assistant"
    content: str
    model: str
    ttft: Optional[float] = None
    latency: float
    timestamp: float

class SessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "New Chat"
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    messages: List[ChatMessage] = []

class HealthStatus(BaseModel):
    status: str
    app: str
    vllm_connected: bool
    vllm_url: str
    model: str
    error: Optional[str] = None

class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    owned_by: Optional[str] = "vllm"

