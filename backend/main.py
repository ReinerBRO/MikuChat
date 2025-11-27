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
from news_service import NewsService

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
news_service = NewsService()

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

from urllib.parse import quote

# ... (existing imports)

# Music Endpoints
@app.get("/api/music")
async def list_music():
    """List available music files"""
    files = []
    if os.path.exists("music"):
        for file in os.listdir("music"):
            if file.endswith((".mp3", ".wav", ".ogg", ".mp4", ".m4a", ".flac")):
                # Check for cover image with same name
                base_name = os.path.splitext(file)[0]
                cover_url = None
                for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
                    if os.path.exists(os.path.join("music", base_name + ext)):
                        cover_url = f"/music/{quote(base_name + ext)}"
                        break
                
                files.append({
                    "name": file,
                    "url": f"/music/{quote(file)}",
                    "type": "local",
                    "cover": cover_url
                })
    return {"music": files}

@app.post("/api/music/upload")
async def upload_music(file: UploadFile = File(...), cover: Optional[UploadFile] = File(None)):
    """Upload music file and optional cover"""
    try:
        # Validate music file
        allowed_audio = {".mp3", ".wav", ".ogg", ".mp4", ".m4a", ".flac"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_audio:
            return {"error": f"Invalid audio format. Allowed: {', '.join(allowed_audio)}"}
        
        # Save music file
        music_path = os.path.join("music", file.filename)
        with open(music_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # Save cover if provided
        if cover:
            allowed_images = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
            cover_ext = os.path.splitext(cover.filename)[1].lower()
            if cover_ext in allowed_images:
                # Use same basename as music file
                base_name = os.path.splitext(file.filename)[0]
                cover_path = os.path.join("music", base_name + cover_ext)
                with open(cover_path, "wb") as f:
                    content = await cover.read()
                    f.write(content)
        
        return {"success": True, "message": "Upload successful"}
    except Exception as e:
        print(f"Upload error: {e}")
        return {"error": str(e)}

@app.get("/api/proxy/image")
async def proxy_image(url: str):
    """Proxy image to bypass Referer check"""
    import requests
    from fastapi.responses import StreamingResponse
    
    if not url:
        return {"error": "No URL provided"}
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://www.bilibili.com/"
        }
        
        def iterfile():
            with requests.get(url, headers=headers, stream=True) as r:
                for chunk in r.iter_content(chunk_size=8192):
                    yield chunk
                    
        return StreamingResponse(iterfile(), media_type="image/jpeg")
    except Exception as e:
        print(f"Proxy error: {e}")
        return {"error": str(e)}

@app.get("/api/music/search")
async def search_music(q: str):
    """Search for music on Bilibili using official API"""
    import requests
    
    # Append "初音未来" to search query if not present
    search_keyword = q
    if "初音" not in q and "miku" not in q.lower():
        search_keyword = f"{q} 初音未来"
    
    try:
        # Bilibili Search API
        url = "https://api.bilibili.com/x/web-interface/search/type"
        params = {
            "search_type": "video",
            "keyword": search_keyword,
            "page": 1,
            "page_size": 10
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://www.bilibili.com/",
            "Cookie": "buvid3=infoc;"
        }
        
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: requests.get(url, params=params, headers=headers))
        
        if response.status_code != 200:
            print(f"Bilibili API Error: Status {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return {"results": []}
            
        try:
            data = response.json()
        except Exception as e:
            print(f"JSON Decode Error: {e}")
            print(f"Raw Response: {response.text[:200]}")
            return {"results": []}
        
        results = []
        if data['code'] == 0 and 'data' in data and 'result' in data['data']:
            video_list = data['data']['result']
            for video in video_list:
                # Filter out non-video items just in case
                if video.get('type') != 'video':
                    continue
                
                # Construct cover URL
                cover_url = video.get('pic', '')
                if cover_url.startswith('//'):
                    cover_url = 'https:' + cover_url
                
                # Use proxy for cover
                proxied_cover = f"http://localhost:8000/api/proxy/image?url={cover_url}" if cover_url else None
                    
                results.append({
                    "id": video['bvid'],
                    "title": video['title'].replace('<em class="keyword">', '').replace('</em>', ''), # Clean highlight tags
                    "duration": video.get('duration', '0'), # Format is usually "MM:SS" or seconds? API returns "MM:SS" string often
                    "uploader": video.get('author', 'Unknown'),
                    "type": "online",
                    "cover": proxied_cover
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
        # 'cookiesfrombrowser': ('chrome', ) # Removed to avoid DB lock error
    }
    
    try:
        loop = asyncio.get_event_loop()
        # Construct Bilibili URL if it looks like a BV ID
        if video_id.startswith('BV'):
            url_to_extract = f"https://www.bilibili.com/video/{video_id}"
        else:
            url_to_extract = video_id

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url_to_extract, download=False))
            url = info['url']
            
            # Proxy the stream to bypass Referer check
            import requests
            from fastapi.responses import StreamingResponse
            
            # Bilibili requires Referer header
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://www.bilibili.com/"
            }
            
            def iterfile():
                with requests.get(url, headers=headers, stream=True) as r:
                    for chunk in r.iter_content(chunk_size=8192):
                        yield chunk
                        
            return StreamingResponse(iterfile(), media_type="audio/mp4")
    except Exception as e:
        print(f"Stream error: {e}")
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
def get_random_miku_image():
    """Get a random Hatsune Miku image from Safebooru"""
    image_data = image_service.get_random_miku_image()
    
    if image_data:
        return image_data
    else:
        return {
            "error": "Failed to fetch image",
            "image_url": None
        }

# News Endpoint
@app.get("/api/news")
async def get_news():
    """Get latest Miku news from Bilibili"""
    try:
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        news = await loop.run_in_executor(None, news_service.get_latest_news)
        return {"news": news}
    except Exception as e:
        print(f"News API error: {e}")
        return {"news": []}
