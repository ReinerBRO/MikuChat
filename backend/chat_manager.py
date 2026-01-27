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
    def __init__(self, storage_dir: str = "sessions", uploads_dir: Optional[str] = None):
        self.storage_dir = storage_dir
        self.uploads_dir = uploads_dir
        # self.sessions removed to enforce statelessness
        self.llm_service = LLMService()
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)
    
    def _get_user_storage_path(self, username: str) -> str:
        """Get the storage path for a specific user"""
        # Sanitize username for filename
        safe_username = "".join(c for c in username if c.isalnum() or c in ('_', '-'))
        return os.path.join(self.storage_dir, f"{safe_username}_sessions.json")
    
    def _load_sessions(self, username: str) -> Dict[str, ChatSession]:
        """Load sessions from user-specific JSON file"""
        storage_path = self._get_user_storage_path(username)
        # print(f"[DEBUG] ChatManager: Loading sessions for '{username}' from '{storage_path}'")
        sessions = {}
        
        if os.path.exists(storage_path):
            try:
                with open(storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for session_data in data:
                        session = ChatSession(**session_data)
                        sessions[session.id] = session
                # print(f"[DEBUG] ChatManager: Loaded {len(sessions)} sessions")
            except Exception as e:
                print(f"[DEBUG] Error loading sessions for {username}: {e}")
                sessions = {}
        else:
             # print(f"[DEBUG] ChatManager: No existing session file for '{username}'")
             pass
        return sessions
    
    def _save_sessions(self, username: str, sessions: Dict[str, ChatSession]):
        """Save sessions to user-specific JSON file"""
        try:
            storage_path = self._get_user_storage_path(username)
            # print(f"[DEBUG] ChatManager: Saving {len(sessions)} sessions for '{username}' to '{storage_path}'")
            data = [asdict(session) for session in sessions.values()]
            with open(storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            # print(f"[DEBUG] ChatManager: Save successful")
        except Exception as e:
            print(f"[DEBUG] Error saving sessions for {username}: {e}")

    def _extract_upload_filename(self, image_url: Optional[str]) -> Optional[str]:
        if not image_url:
            return None
        clean_url = image_url.split("?", 1)[0].split("#", 1)[0]
        prefix = "/static/uploads/"
        if not clean_url.startswith(prefix):
            return None
        filename = os.path.basename(clean_url)
        if not filename or filename in (".", ".."):
            return None
        return filename

    def _delete_upload_file(self, filename: str):
        if not self.uploads_dir:
            return
        upload_root = os.path.abspath(self.uploads_dir)
        file_path = os.path.abspath(os.path.join(upload_root, filename))
        if os.path.commonpath([file_path, upload_root]) != upload_root:
            return
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"Error deleting upload {file_path}: {e}")

    def _delete_session_images(self, session: ChatSession):
        if not self.uploads_dir or not session:
            return
        filenames = set()
        for message in session.messages or []:
            filename = self._extract_upload_filename(message.get("image_url"))
            if filename:
                filenames.add(filename)
        for filename in filenames:
            self._delete_upload_file(filename)
    
    async def create_session(self, first_message: str, username: str) -> str:
        """Create a new session and generate name based on first message"""
        session_id = str(uuid.uuid4())
        
        # Load existing sessions first!
        sessions = self._load_sessions(username)
        
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
        
        sessions[session_id] = session
        self._save_sessions(username, sessions)
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
    
    def get_session(self, session_id: str, username: str = None) -> Optional[ChatSession]:
        """Get a session by ID. Requires username to load from disk properly if stateless."""
        # Note: Ideally this signature should mandate username, but to avoid breaking too many calls,
        # we might need to handle the case where it's missing (though it won't work well stateless).
        # For MikuChat, endpoints pass username. If not, we can't load.
        # However, looking at usage in main.py:
        # get_messages(session_id) calls chat_manager.get_messages(session_id)
        # get_messages(session_id) in ChatManager calls get_session(session_id)
        # We need to fix the call chain in main.py too!
        if not username:
             # Fallback or error is inevitable here if we are truly stateless
             # But wait, get_session is often used after list_sessions.
             # Actually, for statelessness, we need username for EVERY operation.
             print("Warning: get_session called without username in stateless mode")
             return None 
        
        sessions = self._load_sessions(username)
        return sessions.get(session_id)
    
    def list_sessions(self, username: str) -> List[ChatSession]:
        """List all sessions for a user, sorted by last message time"""
        sessions = self._load_sessions(username)
        session_list = list(sessions.values())
        session_list.sort(key=lambda s: s.last_message_at, reverse=True)
        return session_list
    
    def delete_session(self, session_id: str, username: str) -> bool:
        """Delete a session"""
        sessions = self._load_sessions(username)
        if session_id in sessions:
            self._delete_session_images(sessions[session_id])
            del sessions[session_id]
            self._save_sessions(username, sessions)
            return True
        return False
    
    def add_message(self, session_id: str, message: Dict, username: str):
        """Add a message to a session"""
        sessions = self._load_sessions(username)
        session = sessions.get(session_id)
        if session:
            session.messages.append(message)
            session.message_count = len(session.messages)
            session.last_message_at = datetime.now().isoformat()
            self._save_sessions(username, sessions)
    
    def get_messages(self, session_id: str, username: str = None) -> List[Dict]:
        """Get all messages for a session"""
        # This needs username too now!
        if not username:
            # We must find the username or this fails.
            # In main.py, get_session_messages(session_id) doesn't accept username currently.
            # We need to update main.py to pass username to this too.
            # For now in this replacement, we'll return empty if no username.
            return []
            
        sessions = self._load_sessions(username)
        session = sessions.get(session_id)
        return session.messages if session else []
    
    def rename_session(self, session_id: str, new_name: str, username: str) -> bool:
        """Rename a session"""
        sessions = self._load_sessions(username)
        session = sessions.get(session_id)
        if session:
            session.name = new_name[:50]
            self._save_sessions(username, sessions)
            return True
        return False
