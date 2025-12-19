"""
Miku TTS Service using Fish Audio API
Fish Audio provides high-quality Hatsune Miku voice synthesis.

To use this service:
1. Go to https://fish.audio and create an account
2. Get your API key from https://fish.audio/go-api/api-keys
3. Set the FISH_AUDIO_API_KEY environment variable or add it to backend/.env
"""

import os
import uuid
import httpx
from dotenv import load_dotenv

load_dotenv()

# Fish Audio configuration
FISH_AUDIO_API_KEY = os.getenv("FISH_AUDIO_API_KEY", "")
# Hatsune Miku model ID on Fish Audio - you can find this on fish.audio
# Common Miku model IDs (you may need to search on fish.audio for "初音ミク" or "Hatsune Miku"):
MIKU_MODEL_ID = os.getenv("FISH_AUDIO_MIKU_MODEL_ID", "d8639b5cc7a3455694f1db2ebe69c73e")  # Example ID

# Directory to save generated audio files
AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

async def generate_tts(text: str) -> str | None:
    """
    Generates TTS audio for the given text using Fish Audio's Miku voice.
    Returns the path to the generated audio file relative to the static directory.
    """
    if not FISH_AUDIO_API_KEY:
        print("Warning: FISH_AUDIO_API_KEY not set. TTS disabled.")
        print("Get your API key from https://fish.audio/go-api/api-keys")
        return None

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.fish.audio/v1/tts",
                headers={
                    "Authorization": f"Bearer {FISH_AUDIO_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "reference_id": MIKU_MODEL_ID,
                    "format": "mp3",
                    "mp3_bitrate": 128
                }
            )
            
            if response.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                return f"/static/audio/{filename}"
            else:
                print(f"Fish Audio API error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"TTS generation failed: {e}")
        return None


# Alternative: Edge TTS fallback (not Miku voice, but works without API key)
async def generate_tts_fallback(text: str) -> str | None:
    """
    Fallback TTS using Edge TTS (not Miku voice).
    Uses Japanese female voice as an alternative.
    """
    try:
        import edge_tts
        
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Use Japanese female voice
        communicate = edge_tts.Communicate(text, "ja-JP-NanamiNeural")
        await communicate.save(filepath)
        
        return f"/static/audio/{filename}"
    except ImportError:
        print("edge-tts not installed. Run: pip install edge-tts")
        return None
    except Exception as e:
        print(f"Fallback TTS failed: {e}")
        return None
