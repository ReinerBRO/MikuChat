import asyncio
import os
import shutil
import sys

# Add current directory to sys.path to ensure we can import tts_service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tts_service import generate_tts, AUDIO_DIR

async def main():
    text = "[SURPRISED] 哎呀，怎么偷看人家日记啊？"
    print(f"Generating TTS for: {text}")
    
    # Generate
    # Note: generate_tts might take some time to load models
    relative_path = await generate_tts(text)
    
    if relative_path:
        filename = os.path.basename(relative_path)
        source_path = os.path.join(AUDIO_DIR, filename)
        
        # Target path: frontend/public/audio/peek_diary.wav
        # We assume this script is in backend/
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        frontend_audio_dir = os.path.join(project_root, "frontend/public/audio")
        os.makedirs(frontend_audio_dir, exist_ok=True)
        
        target_path = os.path.join(frontend_audio_dir, "peek_diary.wav")
        
        # Copy
        shutil.copy2(source_path, target_path)
        print(f"Success! Audio saved to: {target_path}")
    else:
        print("Failed to generate audio.")

if __name__ == "__main__":
    asyncio.run(main())
