from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..models import Session, SessionCreate, ChatMessage
from ..services.session_service import session_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("", response_model=List[Session])
async def list_sessions():
    return session_service.list_sessions()

@router.post("", response_model=Session)
async def create_session(payload: SessionCreate):
    return session_service.create_session(title=payload.title or "New Chat")

@router.get("/{session_id}", response_model=Session)
async def get_session(session_id: str):
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.patch("/{session_id}", response_model=Session)
async def update_session(session_id: str, payload: SessionCreate):
    session = session_service.update_session(session_id, title=payload.title)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/messages", response_model=Session)
async def add_message(session_id: str, message: ChatMessage):
    session = session_service.add_message(session_id, message)
    return session

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    success = session_service.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}

@router.delete("")
async def clear_all_sessions():
    session_service.clear_all()
    return {"message": "All sessions cleared"}

