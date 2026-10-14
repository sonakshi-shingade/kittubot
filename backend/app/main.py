import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from .config import settings
from .routes import chat, sessions

app = FastAPI(
    title=settings.app_name,
    description="FastAPI Backend for KittuBot powered by local vLLM (reference from streamlit.py)",
    version="1.0.0"
)

# Enable CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(chat.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")

@app.get("/api/info")
async def info():
    return {
        "app": settings.app_name,
        "status": "online",
        "reference": "vllm_learning/streamlit.py",
        "docs": "/docs",
        "default_model": settings.default_model,
        "vllm_base_url": settings.vllm_base_url
    }

# Mount static React build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {
            "app": settings.app_name,
            "status": "online",
            "message": "Frontend build not detected. Run `npm run build` in frontend or run `npm run dev` at port 5173."
        }

