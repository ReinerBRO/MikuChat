import json
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict
from llm_service import LLMService

@dataclass
class ChatSession:
    id: str
    name: str
    created_at: str
    last_message_at: str
    message_count: int
    messages: List[Dict] = None
    
    def __post_init__(self):
        if self.messages is None:
            self.messages = []

class ChatManager:
    def __init__(self, storage_path: str = "sessions.json"):
        self.storage_path = storage_path
        self.sessions: Dict[str, ChatSession] = {}
        self.llm_service = LLMService()
        self._load_sessions()
    
    def _load_sessions(self):
        """Load sessions from JSON file"""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for session_data in data:
                        session = ChatSession(**session_data)
                        self.sessions[session.id] = session
            except Exception as e:
                print(f"Error loading sessions: {e}")
                self.sessions = {}
    
    def _save_sessions(self):
        """Save sessions to JSON file"""
        try:
            data = [asdict(session) for session in self.sessions.values()]
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving sessions: {e}")
    
    async def create_session(self, first_message: str) -> str:
        """Create a new session and generate name based on first message"""
        session_id = str(uuid.uuid4())
        
        # Generate session name using LLM
        session_name = await self._generate_session_name(first_message)
        
        now = datetime.now().isoformat()
        session = ChatSession(
            id=session_id,
            name=session_name,
            created_at=now,
            last_message_at=now,
            message_count=0,
            messages=[]
        )
        
        self.sessions[session_id] = session
        self._save_sessions()
        return session_id
    
    async def _generate_session_name(self, first_message: str) -> str:
        """Generate a concise session name using LLM"""
        try:
            prompt = f"Generate a very short title (3-5 words max) for a chat conversation that starts with: '{first_message[:100]}'. Only output the title, nothing else."
            name = await self.llm_service.generate_session_name(prompt)
            # Clean up the name
            name = name.strip().strip('"').strip("'")
            return name[:50]  # Limit length
        except Exception as e:
            print(f"Error generating session name: {e}")
            return f"Chat {datetime.now().strftime('%m-%d %H:%M')}"
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get a session by ID"""
        return self.sessions.get(session_id)
    
    def list_sessions(self) -> List[ChatSession]:
        """List all sessions, sorted by last message time"""
        sessions = list(self.sessions.values())
        sessions.sort(key=lambda s: s.last_message_at, reverse=True)
        return sessions
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            self._save_sessions()
            return True
        return False
    
    def add_message(self, session_id: str, message: Dict):
        """Add a message to a session"""
        session = self.sessions.get(session_id)
        if session:
            session.messages.append(message)
            session.message_count = len(session.messages)
            session.last_message_at = datetime.now().isoformat()
            self._save_sessions()
    
    def get_messages(self, session_id: str) -> List[Dict]:
        """Get all messages for a session"""
        session = self.sessions.get(session_id)
        return session.messages if session else []
    
    def rename_session(self, session_id: str, new_name: str) -> bool:
        """Rename a session"""
        session = self.sessions.get(session_id)
        if session:
            session.name = new_name[:50]
            self._save_sessions()
            return True
        return False
