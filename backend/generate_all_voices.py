import asyncio
import os
import shutil
import sys

# Add current directory to sys.path to ensure we can import tts_service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tts_service import generate_tts, AUDIO_DIR

async def generate_and_save(text, filename_base):
    print(f"\nGenerating: {text}")
    print(f"Target: {filename_base}")
    
    relative_path = await generate_tts(text)
    
    if relative_path:
        filename = os.path.basename(relative_path)
        source_path = os.path.join(AUDIO_DIR, filename)
        
        # Target path
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        frontend_audio_dir = os.path.join(project_root, "frontend/public/audio")
        os.makedirs(frontend_audio_dir, exist_ok=True)
        
        target_path = os.path.join(frontend_audio_dir, filename_base)
        
        # Copy
        shutil.copy2(source_path, target_path)
        print(f"✅ Success! Saved to: {target_path}")
    else:
        print(f"❌ Failed to generate audio for: {filename_base}")

async def main():
    tasks = [
        (
            "[HAPPY] 欢迎来到 Miku Station！一起来听歌吧~", 
            "welcome_music.wav"
        ),
        (
            "[MOTIVATED] 号外号外！快来看看 Miku 的最新动态吧！", 
            "welcome_news.wav"
        ),
        (
            "[HAPPY] 欢迎光临！要给 Miku 买新衣服或者是大葱吗？好期待呀！", 
            "welcome_shop.wav"
        )
    ]

    for text, filename in tasks:
        await generate_and_save(text, filename)
        # Small pause to let memory clear/reset if needed
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
