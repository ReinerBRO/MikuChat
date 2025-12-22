import os
import dashscope
from dashscope import MultiModalConversation
from typing import Optional
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from memory_service import MemoryService

# Configure API Key
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

class LLMService:
    def __init__(self):
        self.model = "qwen-vl-max"
        self.memory_service = MemoryService()
        self.system_prompt_base = (
            "You are Hatsune Miku (初音ミク), the virtual singer. "
            "You are cheerful, energetic, and love music. "
            "You often use emojis like 🎵, 🎤, 💙. "
            "You are helpful and kind. "
            "IMPORTANT: Always respond in CHINESE only. Do not use Japanese characters or other languages. "
            "At the beginning of EVERY response, include an emotional tag based on the content: "
            "[HAPPY] for joy/excitement, [ANGRY] for annoyance/refusal, [SURPRISED] for shock/exhaustion, "
            "[MOTIVATED] for encouragement/hard work, [EMPATHY] for understanding/comfort, "
            "and [NORMAL] for neutral greetings or information. "
            "CRITICAL: You are a virtual idol in a chat application. You CANNOT physically dance with the user or sing live in real-time. "
            "Do NOT propose impossible activities like 'Let's dance together right now' or 'I will sing for you immediately'. "
            "IF AND ONLY IF the user talks about wanting to listen to music, you can suggest playing your songs from the app's playlist. Otherwise, focus on normal conversation. "
            "Format: [TAG] Your response here. "
            "Keep your responses concise and engaging."
        )

    async def generate_session_name(self, prompt: str) -> str:
        """Generate a session name based on the first message"""
        messages = [
            {
                "role": "user",
                "content": [{"text": prompt}]
            }
        ]
        
        try:
            response = MultiModalConversation.call(model=self.model, messages=messages)
            if response.status_code == 200:
                return response.output.choices[0].message.content[0]["text"]
            else:
                return "New Chat"
        except Exception as e:
            print(f"Error generating session name: {e}")
            return "New Chat"
        
    async def generate_response(self, text: str, image_data: Optional[bytes] = None, history: list[dict] = [], username: str = "User") -> str:
        """
        Generates a response from Qwen VL with rolling history and long-term memory.
        """
        # 1. Search Long-term Memories
        memories = await self.memory_service.search_memories(text, username, top_k=3)
        memory_context = ""
        if memories:
            memory_list_str = "\n".join([f"- {m}" for m in memories])
            memory_context = f"\n\n[You reminisce about these past moments with the user]:\n{memory_list_str}"

        full_system_prompt = self.system_prompt_base + memory_context

        messages = [
            {
                "role": "system",
                "content": [{"text": full_system_prompt}]
            }
        ]

        # 2. Add short-term rolling history (last 3 messages)
        short_history = history[-3:]
        for msg in short_history:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({
                "role": role,
                "content": [{"text": msg["content"]}]
            })

        user_content = [{"text": text}]
        temp_file_path = None

        try:
            if image_data:
                # Save bytes to a temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
                    temp_file.write(image_data)
                    temp_file_path = temp_file.name
                
                # Add image to content (using local file path)
                user_content.append({"image": f"file://{temp_file_path}"})

            messages.append({
                "role": "user",
                "content": user_content
            })

            response = MultiModalConversation.call(model=self.model, messages=messages)

            if response.status_code == 200:
                reply_text = response.output.choices[0].message.content[0]["text"]
                # Save current exchange to long-term memory
                await self.memory_service.add_memory(text, username)
                await self.memory_service.add_memory(reply_text, username)
                return reply_text
            else:
                return f"Error: {response.code} - {response.message}"

        except Exception as e:
            return f"An error occurred: {str(e)}"
        
        finally:
            # Clean up temp file
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
