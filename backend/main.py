from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from llm_service import LLMService
from chat_manager import ChatManager, ChatSession
from image_service import ImageService

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
image_service = ImageService()

class ChatRequest(BaseModel):
    text: str

class RenameRequest(BaseModel):
    name: str

@app.get("/")
async def root():
    return {"message": "MikuChat Backend is running! 🎵"}

# Session Management Endpoints
@app.post("/api/sessions")
async def create_session(first_message: str = Form(...), username: str = Form(...)):
    """Create a new chat session"""
    session_id = await chat_manager.create_session(first_message, username)
    session = chat_manager.get_session(session_id)
    return {
        "session_id": session_id,
        "name": session.name,
        "created_at": session.created_at
    }

@app.get("/api/sessions")
async def list_sessions(username: str):
    """List all chat sessions for a user"""
    sessions = chat_manager.list_sessions(username)
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
async def delete_session(session_id: str, username: str):
    """Delete a chat session"""
    success = chat_manager.delete_session(session_id, username)
    return {"success": success}

@app.post("/api/sessions/{session_id}/rename")
async def rename_session(session_id: str, request: RenameRequest, username: str = Form(...)):
    """Rename a chat session"""
    success = chat_manager.rename_session(session_id, request.name, username)
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
    username: str = Form(...),
    session_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    history: str = Form("[]")
):
    import json
    
    # If no session_id, create a new session
    if not session_id:
        session_id = await chat_manager.create_session(text, username)
    
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
    from datetime import datetime
    timestamp = datetime.now().isoformat()
    
    chat_manager.add_message(session_id, {
        "role": "user",
        "content": text,
        "timestamp": timestamp
    }, username)
    chat_manager.add_message(session_id, {
        "role": "assistant",
        "content": response,
        "timestamp": timestamp
    }, username)
    
    return {
        "response": response,
        "session_id": session_id
    }

# Random Miku Image Endpoint
@app.get("/api/random-miku-image")
async def get_random_miku_image():
    """Get a random Hatsune Miku image from Safebooru"""
    image_data = image_service.get_random_miku_image()
    
    if image_data:
        return image_data
    else:
        return {
            "error": "Failed to fetch image",
            "image_url": None
        }
