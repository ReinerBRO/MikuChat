from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
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
from weather_service import WeatherService

from tts_service import generate_tts, init_gsv

app = FastAPI(title="MikuChat API", description="Backend for MikuChat WebUI")

# Startup event to warm up models
@app.on_event("startup")
async def startup_event():
    print("Pre-warming GPT-SoVITS model...")
    # This loads weights into VRAM/RAM so the first user message is fast
    try:
        init_gsv()
    except Exception as e:
        print(f"Failed to pre-warm TTS: {e}")

# CORS Configuration
origins = ["*"] # Be more permissive for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services and logic
llm_service = LLMService()
chat_manager = ChatManager()
image_service = ImageService()
news_service = NewsService()
weather_service = WeatherService()

USER_CONFIG_FILE = "user_config.json"
PLAYLISTS_DIR = "sessions"

# Mount static directories
os.makedirs("music", exist_ok=True)
os.makedirs("static/audio", exist_ok=True)
app.mount("/music", StaticFiles(directory="music"), name="music")
app.mount("/static", StaticFiles(directory="static"), name="static")



# TTS Endpoint
class TTSRequest(BaseModel):
    text: str

@app.post("/api/tts")
async def tts_endpoint(request: TTSRequest):
    """Generate TTS audio for text"""
    try:
        audio_url = await generate_tts(request.text)
        return {"audio_url": audio_url}
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    text: str

class RenameRequest(BaseModel):
    name: str

class UserConfig(BaseModel):
    username: str
    password: Optional[str] = None
    rememberMe: Optional[bool] = False

class OnlinePlaylistRequest(BaseModel):
    username: str
    songs: List[dict] = []
    current_index: int = -1

def _get_online_playlist_path(username: str) -> str:
    safe_username = "".join(c for c in username if c.isalnum() or c in ("_", "-"))
    if not safe_username:
        safe_username = "default"
    os.makedirs(PLAYLISTS_DIR, exist_ok=True)
    return os.path.join(PLAYLISTS_DIR, f"{safe_username}_online_playlist.json")

@app.get("/")
async def root():
    return {"message": "MikuChat Backend is running! 🎵"}

# User Management Endpoints
@app.get("/api/user")
async def get_user():
    """Get current user configuration (for auto-login persistence)"""
    if os.path.exists(USER_CONFIG_FILE):
        try:
            with open(USER_CONFIG_FILE, "r") as f:
                config = json.load(f)
                # Only return login info if rememberMe was set
                if config.get("rememberMe", False):
                    return config
                else:
                    # Return empty if not remember me
                    return {}
        except json.JSONDecodeError:
            return {}
    return {}

# Weather Tool
@app.get("/api/weather")
async def get_weather(city: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None, lang: str = "zh"):
    """Fetch current weather by city or coordinates"""
    return weather_service.get_weather(city=city, lat=lat, lon=lon, lang=lang)

@app.post("/api/user")
async def update_user(config: UserConfig):
    """Update user configuration with login persistence"""
    with open(USER_CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return config

from urllib.parse import quote, unquote, urlparse


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

@app.get("/api/music/online_playlist")
async def get_online_playlist(username: str):
    """Load online playlist for a user"""
    path = _get_online_playlist_path(username)
    if not os.path.exists(path):
        return {"songs": [], "current_index": -1}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            songs = data.get("songs", [])
            current_index = data.get("current_index", -1)
            return {"songs": songs, "current_index": current_index}
    except Exception as e:
        print(f"Playlist load error: {e}")
        return {"songs": [], "current_index": -1}

@app.post("/api/music/online_playlist")
async def save_online_playlist(payload: OnlinePlaylistRequest):
    """Save online playlist for a user"""
    path = _get_online_playlist_path(payload.username)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "songs": payload.songs,
                    "current_index": payload.current_index
                },
                f,
                ensure_ascii=False,
                indent=2
            )
        return {"success": True}
    except Exception as e:
        print(f"Playlist save error: {e}")
        return {"success": False, "error": str(e)}

@app.delete("/api/music/{filename}")
async def delete_music(filename: str):
    """Delete a local music file and its cover"""
    safe_name = os.path.basename(unquote(filename))
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename")

    allowed_audio = {".mp3", ".wav", ".ogg", ".mp4", ".m4a", ".flac"}
    file_ext = os.path.splitext(safe_name)[1].lower()
    if file_ext not in allowed_audio:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    music_path = os.path.join("music", safe_name)
    if not os.path.exists(music_path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(music_path)

    base_name = os.path.splitext(safe_name)[0]
    deleted_covers = []
    for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        cover_path = os.path.join("music", base_name + ext)
        if os.path.exists(cover_path):
            os.remove(cover_path)
            deleted_covers.append(base_name + ext)

    return {"success": True, "deleted": safe_name, "deleted_covers": deleted_covers}

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
async def stream_music(video_id: str, request: Request):
    """Get streaming URL for a video"""
    print(f"[music] stream request video_id={video_id} range={request.headers.get('range')}")
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
            formats = info.get('formats') or []
            audio_formats = [
                f for f in formats
                if f.get('vcodec') == 'none' and f.get('acodec') not in (None, 'none')
            ]
            direct_audio_formats = [
                f for f in audio_formats
                if f.get('protocol')
                and f.get('protocol').lower().startswith('http')
                and 'm3u8' not in f.get('protocol').lower()
            ]
            chosen_format = None
            if direct_audio_formats:
                chosen_format = max(direct_audio_formats, key=lambda f: f.get('abr') or f.get('tbr') or 0)
            elif audio_formats:
                chosen_format = max(audio_formats, key=lambda f: f.get('abr') or f.get('tbr') or 0)

            if chosen_format:
                print(
                    "[music] chosen format",
                    {
                        "format_id": chosen_format.get("format_id"),
                        "ext": chosen_format.get("ext"),
                        "abr": chosen_format.get("abr"),
                        "protocol": chosen_format.get("protocol"),
                        "acodec": chosen_format.get("acodec"),
                        "vcodec": chosen_format.get("vcodec"),
                    },
                )

            url = (chosen_format or info).get('url')
            if not url:
                raise HTTPException(status_code=500, detail="No audio URL found")

            # Proxy the stream to bypass Referer check and support Range requests.
            import requests
            from fastapi.responses import StreamingResponse

            headers = dict((chosen_format or info).get('http_headers') or info.get('http_headers') or {})
            headers.setdefault(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
            headers.setdefault("Referer", "https://www.bilibili.com/")
            headers.setdefault("Origin", "https://www.bilibili.com")

            range_header = request.headers.get("range")
            if range_header:
                headers["Range"] = range_header

            parsed = urlparse(url)
            print(f"[music] upstream host={parsed.netloc}")
            r = requests.get(url, headers=headers, stream=True, timeout=15)
            if r.status_code >= 400:
                print(f"[music] upstream error status={r.status_code} body={r.text[:200]}")
                raise HTTPException(status_code=502, detail=f"Upstream status {r.status_code}")

            def iterfile():
                try:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                finally:
                    r.close()

            response_headers = {}
            for header_name in ("Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"):
                if header_name in r.headers:
                    response_headers[header_name] = r.headers[header_name]

            def guess_audio_mime(ext: Optional[str], acodec: Optional[str]) -> Optional[str]:
                if ext:
                    ext = ext.lower()
                if ext in ("m4a", "mp4") or (acodec and acodec.startswith("mp4a")):
                    return "audio/mp4"
                if ext == "mp3":
                    return "audio/mpeg"
                if ext == "flac":
                    return "audio/flac"
                if ext in ("ogg", "opus"):
                    return "audio/ogg"
                if ext == "wav":
                    return "audio/wav"
                return None

            guessed_mime = guess_audio_mime(
                (chosen_format or info).get("ext"),
                (chosen_format or info).get("acodec"),
            )
            media_type = guessed_mime or r.headers.get("Content-Type", "audio/mp4")
            if guessed_mime:
                response_headers["Content-Type"] = guessed_mime
            if "Accept-Ranges" not in response_headers:
                response_headers["Accept-Ranges"] = "bytes"
            print(
                "[music] upstream ok",
                {
                    "status": r.status_code,
                    "content_type": r.headers.get("Content-Type"),
                    "served_type": media_type,
                    "content_length": r.headers.get("Content-Length"),
                    "accept_ranges": r.headers.get("Accept-Ranges"),
                },
            )
            return StreamingResponse(
                iterfile(),
                status_code=r.status_code,
                media_type=media_type,
                headers=response_headers
            )
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
    history: str = Form("[]"),
    enable_tts: bool = Form(True)
):
    import json
    
    current_username = username if username else "User"
    
    # If no session_id, create a new session
    if not session_id:
        if os.path.exists(USER_CONFIG_FILE):
            try:
                with open(USER_CONFIG_FILE, "r") as f:
                    config = json.load(f)
                    current_username = config.get("username", current_username)
            except:
                pass
        session_id = await chat_manager.create_session(text, current_username)
    
    image_data = None
    if image:
        image_data = await image.read()
    
    try:
        history_list = json.loads(history)
    except json.JSONDecodeError:
        history_list = []
    
    # Generate response
    response = await llm_service.generate_response(text, image_data, history_list, current_username)
    
    # Save messages to session
    from datetime import datetime
    timestamp = datetime.now().isoformat()
    
    chat_manager.add_message(session_id, {
        "role": "user",
        "content": text,
        "timestamp": timestamp
    }, current_username)
    chat_manager.add_message(session_id, {
        "role": "assistant",
        "content": response,
        "timestamp": timestamp
    }, current_username)
    
    # Record meaningful moments in the Memory Gallery
    from gallery_service import GalleryService
    gallery_service = GalleryService()
    # This is an async call but we can let it run in the background 
    # OR await it if we want perfect sequence. For now, await it.
    await gallery_service.evaluate_and_record_moment(text, response, current_username)
    # Also attempt a summary (it only updates if needed)
    await gallery_service.generate_daily_summary(current_username)
    
    # Generate TTS audio if enabled
    audio_url = None
    if enable_tts:
        print(f"DEBUG: Generating TTS for response: {response[:50]}...")
        try:
            audio_url = await generate_tts(response)
            if audio_url:
                print(f"DEBUG: TTS generated successfully: {audio_url}")
            else:
                print("DEBUG: TTS generation returned None")
        except Exception as e:
            print(f"DEBUG: Failed to generate TTS for chat response: {e}")
            import traceback
            traceback.print_exc()
    
    return {
        "response": response,
        "session_id": session_id,
        "audio_url": audio_url
    }

# Memory Gallery Endpoint
@app.get("/api/gallery")
async def get_gallery(username: str = "User"):
    """Get the full memory gallery for a user"""
    from gallery_service import GalleryService
    gallery_service = GalleryService()
    return gallery_service.get_full_gallery(username)

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
async def get_news(source: str = "all"):
    """Get latest Miku news from specified source"""
    try:
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        news = await loop.run_in_executor(None, lambda: news_service.get_latest_news(source))
        return {"news": news}
    except Exception as e:
        print(f"News API error: {e}")
        return {"news": []}
