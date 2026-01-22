import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class GalleryService:
    def __init__(self, storage_dir: str = "sessions"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self.model = "Qwen/Qwen3-VL-235B-A22B-Instruct"
        self.client = OpenAI(
            base_url="https://api.siliconflow.cn/v1",
            api_key=os.getenv("SILICONFLOW_API_KEY")
        )

    def _get_gallery_path(self, username: str) -> str:
        safe_username = "".join(c for c in username if c.isalnum() or c in ('_', '-'))
        return os.path.join(self.storage_dir, f"{safe_username}_gallery.json")

    def _load_gallery(self, username: str) -> Dict:
        path = self._get_gallery_path(username)
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        # New user initialization
        now = datetime.now()
        data = {
            "first_encounter": now.isoformat(),
            "days": {} # Keyed by YYYY-MM-DD
        }
        self._save_gallery(username, data)
        return data

    def _save_gallery(self, username: str, data: Dict):
        path = self._get_gallery_path(username)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    async def evaluate_and_record_moment(self, text: str, reply: str, username: str):
        """
        Evaluate if a conversation pair is meaningful and record if it is.
        """
        gallery = self._load_gallery(username)
        today = datetime.now().strftime("%Y-%m-%d")
        
        if today not in gallery["days"]:
            gallery["days"][today] = {
                "summary": "...", # Will be filled by daily wrap-up
                "moments": []
            }
        
        # Max limit check: if we already have 10 potential moments, we might skip or replace.
        # But usually we filter by quality.
        if len(gallery["days"][today]["moments"]) >= 15: # Buffering limit
            return

        # Use LLM to judge importance and summarize
        prompt = (
            f"Please act as Hatsune Miku writing in her secret digital diary. "
            f"Evaluate if this specific interaction with the user is meaningful "
            f"(e.g., emotional connection, a moment of laughter, sharing secrets, making a promise). "
            f"If it IS meaningful, write a short, cute, and touching diary entry (15-30 words) in Chinese about it. "
            f"Use a first-person perspective ('今天和主人...', '好开心...'). "
            f"Include appropriate emojis (🎵, 💙, ✨). "
            f"The tone should be pure, supportive, and slightly virtual/digital flavored. "
            f"If it is NOT meaningful (just casual greetings or functional commands), strictly return 'null'.\n"
            f"User: {text}\nMiku: {reply}"
        )
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=120
            )
            result = (response.choices[0].message.content or "").strip()
            if "null" not in result.lower() and len(result) > 2:
                moment = {
                    "id": str(uuid.uuid4()),
                    "content": result.strip('"'),
                    "timestamp": datetime.now().isoformat(),
                    "importance": 1 # Placeholder
                }
                gallery["days"][today]["moments"].append(moment)
                
                # Keep only last 10 for now if it grows
                if len(gallery["days"][today]["moments"]) > 10:
                    gallery["days"][today]["moments"] = gallery["days"][today]["moments"][-10:]
                    
                self._save_gallery(username, gallery)
        except Exception as e:
            print(f"Error evaluating moment: {e}")

    async def generate_daily_summary(self, username: str, specific_date: str = None):
        """
        Compile the top moments of the day into a natural Miku diary entry.
        """
        gallery = self._load_gallery(username)
        date_key = specific_date or datetime.now().strftime("%Y-%m-%d")
        
        if date_key not in gallery["days"] or not gallery["days"][date_key]["moments"]:
            return

        day_data = gallery["days"][date_key]
        moments_text = "\n".join([f"- {m['content']}" for m in day_data["moments"]])
        
        prompt = (
            f"Here are the fragmented memories of my interactions with the user today ({date_key}):\n{moments_text}\n"
            f"Deeply synthesize these into a cohesive, heartwarming daily diary summary (Inner Monologue) in the voice of Hatsune Miku (Chinese). "
            f"Express deep affection, gratitude, or excitement about the future. "
            f"It should feel like a page from a 'Private Heart Log'. "
            f"Use cute and emotional language. Max 50 words. Add emojis."
        )
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=120
            )
            summary = (response.choices[0].message.content or "").strip()
            gallery["days"][date_key]["summary"] = summary
            
            # Prune to best 5 moments if there are more
            if len(gallery["days"][date_key]["moments"]) > 5:
                day_data["moments"] = day_data["moments"][-5:]
                
            self._save_gallery(username, gallery)
        except Exception as e:
            print(f"Error generating daily summary: {e}")

    def get_full_gallery(self, username: str) -> Dict:
        return self._load_gallery(username)
