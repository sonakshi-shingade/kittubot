import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "KittuBot"
    host: str = os.getenv("KITTUBOT_HOST", "0.0.0.0")
    port: int = int(os.getenv("KITTUBOT_PORT", "8001"))
    
    # Reference from streamlit.py
    vllm_base_url: str = os.getenv("VLLM_BASE_URL", "http://localhost:8000/v1")
    vllm_api_key: str = os.getenv("VLLM_API_KEY", "dummy")
    default_model: str = os.getenv("DEFAULT_MODEL", "Qwen/Qwen3-0.6B")
    
    default_temperature: float = float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
    default_max_tokens: int = int(os.getenv("DEFAULT_MAX_TOKENS", "512"))
    default_system_prompt: str = os.getenv(
        "DEFAULT_SYSTEM_PROMPT",
        "You are KittuBot, a highly capable, friendly, and helpful AI assistant powered by local vLLM. Provide accurate, insightful, and well-structured answers."
    )

settings = Settings()

