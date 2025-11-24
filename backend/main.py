from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from llm_service import LLMService
from chat_manager import ChatManager, ChatSession

app = FastAPI(title="MikuChat API", description="Backend for MikuChat WebUI")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = LLMService()
chat_manager = ChatManager()

class ChatRequest(BaseModel):
    text: str

class RenameRequest(BaseModel):
    name: str

@app.get("/")
async def root():
    return {"message": "MikuChat Backend is running! 🎵"}

# Session Management Endpoints
@app.post("/api/sessions")
async def create_session(first_message: str = Form(...)):
    """Create a new chat session"""
    session_id = await chat_manager.create_session(first_message)
    session = chat_manager.get_session(session_id)
    return {
        "session_id": session_id,
        "name": session.name,
        "created_at": session.created_at
    }

@app.get("/api/sessions")
async def list_sessions():
    """List all chat sessions"""
    sessions = chat_manager.list_sessions()
    return {
        "sessions": [
            {
                "id": s.id,
                "name": s.name,
                "created_at": s.created_at,
                "last_message_at": s.last_message_at,
                "message_count": s.message_count
            }
            for s in sessions
        ]
    }

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session"""
    success = chat_manager.delete_session(session_id)
    return {"success": success}

@app.post("/api/sessions/{session_id}/rename")
async def rename_session(session_id: str, request: RenameRequest):
    """Rename a chat session"""
    success = chat_manager.rename_session(session_id, request.name)
    return {"success": success}

@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    """Get all messages for a session"""
    messages = chat_manager.get_messages(session_id)
    return {"messages": messages}

# Chat Endpoint
@app.post("/api/chat")
async def chat(
    text: str = Form(...),
    session_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    history: str = Form("[]")
):
    import json
    
    # If no session_id, create a new session
    if not session_id:
        session_id = await chat_manager.create_session(text)
    
    image_data = None
    if image:
        image_data = await image.read()
    
    try:
        history_list = json.loads(history)
    except json.JSONDecodeError:
        history_list = []
    
    # Generate response
    response = await llm_service.generate_response(text, image_data, history_list)
    
    # Save messages to session
    chat_manager.add_message(session_id, {
        "role": "user",
        "content": text,
        "timestamp": chat_manager.sessions[session_id].last_message_at
    })
    chat_manager.add_message(session_id, {
        "role": "assistant",
        "content": response,
        "timestamp": chat_manager.sessions[session_id].last_message_at
    })
    
    return {
        "response": response,
        "session_id": session_id
    }
