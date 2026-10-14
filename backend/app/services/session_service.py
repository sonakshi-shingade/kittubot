import json
import os
import time
from typing import Dict, List, Optional
from ..models import Session, ChatMessage

SESSIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sessions.json")

class SessionService:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}
        self.load_sessions()

    def load_sessions(self):
        if os.path.exists(SESSIONS_FILE):
            try:
                with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        session = Session(**item)
                        self.sessions[session.id] = session
            except Exception as e:
                print(f"Failed to load sessions: {e}")

    def save_sessions(self):
        try:
            with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
                data = [s.model_dump() for s in self.sessions.values()]
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Failed to save sessions: {e}")

    def list_sessions(self) -> List[Session]:
        # Return sorted by updated_at descending
        return sorted(list(self.sessions.values()), key=lambda x: x.updated_at, reverse=True)

    def get_session(self, session_id: str) -> Optional[Session]:
        return self.sessions.get(session_id)

    def create_session(self, title: str = "New Chat") -> Session:
        session = Session(title=title)
        self.sessions[session.id] = session
        self.save_sessions()
        return session

    def update_session(self, session_id: str, title: Optional[str] = None) -> Optional[Session]:
        session = self.sessions.get(session_id)
        if not session:
            return None
        if title:
            session.title = title
        session.updated_at = time.time()
        self.save_sessions()
        return session

    def add_message(self, session_id: str, message: ChatMessage) -> Optional[Session]:
        session = self.sessions.get(session_id)
        if not session:
            session = self.create_session()
            session.id = session_id
            self.sessions[session.id] = session

        session.messages.append(message)
        session.updated_at = time.time()
        
        # Auto-set title from first user message if title is default
        if session.title in ["New Chat", "Untitled Chat"] and message.role == "user":
            trimmed = message.content.strip().split("\n")[0][:30]
            if trimmed:
                session.title = trimmed + ("..." if len(message.content) > 30 else "")

        self.save_sessions()
        return session

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            self.save_sessions()
            return True
        return False

    def clear_all(self):
        self.sessions.clear()
        self.save_sessions()

session_service = SessionService()

