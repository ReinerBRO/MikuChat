from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import yt_dlp
import asyncio
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

# Mount music directory
os.makedirs("music", exist_ok=True)
app.mount("/music", StaticFiles(directory="music"), name="music")

llm_service = LLMService()
chat_manager = ChatManager()
image_service = ImageService()

USER_CONFIG_FILE = "user_config.json"

class ChatRequest(BaseModel):
    text: str

class RenameRequest(BaseModel):
    name: str

class UserConfig(BaseModel):
    username: str

@app.get("/")
async def root():
    return {"message": "MikuChat Backend is running! 🎵"}

# User Management Endpoints
@app.get("/api/user")
async def get_user():
    """Get current user configuration"""
    if os.path.exists(USER_CONFIG_FILE):
        try:
            with open(USER_CONFIG_FILE, "r") as f:
                config = json.load(f)
                return config
        except json.JSONDecodeError:
            return {}
    return {}

@app.post("/api/user")
async def update_user(config: UserConfig):
    """Update user configuration"""
    with open(USER_CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return config

# Music Endpoints
@app.get("/api/music")
async def list_music():
    """List available music files"""
    files = []
    if os.path.exists("music"):
        for file in os.listdir("music"):
            if file.endswith((".mp3", ".wav", ".ogg")):
                files.append({
                    "name": file,
                    "url": f"/music/{file}",
                    "type": "local"
                })
    return {"music": files}

@app.get("/api/music/search")
async def search_music(q: str):
    """Search for music on YouTube"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': True,
        'extract_flat': True,
        'default_search': 'ytsearch5'
    }
    
    try:
        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(f"ytsearch5:{q}", download=False))
            
            results = []
            if 'entries' in info:
                for entry in info['entries']:
                    results.append({
                        "id": entry['id'],
                        "title": entry['title'],
                        "duration": entry.get('duration', 0),
                        "uploader": entry.get('uploader', 'Unknown'),
                        "type": "online"
                    })
            return {"results": results}
    except Exception as e:
        print(f"Search error: {e}")
        return {"results": []}

@app.get("/api/music/stream/{video_id}")
async def stream_music(video_id: str):
    """Get streaming URL for a video"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
    }
    
    try:
        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(video_id, download=False))
            url = info['url']
            # Redirect to the actual stream URL
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        # Try to get username from config, default to "User"
        username = "User"
        if os.path.exists(USER_CONFIG_FILE):
            try:
                with open(USER_CONFIG_FILE, "r") as f:
                    config = json.load(f)
                    username = config.get("username", "User")
            except:
                pass
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
