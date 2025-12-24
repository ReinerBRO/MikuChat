import os
from openai import OpenAI
from typing import Optional
import tempfile
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from memory_service import MemoryService

# Configure SiliconFlow API
client = OpenAI(
    base_url='https://api.siliconflow.cn/v1',
    api_key=os.getenv("SILICONFLOW_API_KEY")
)

class LLMService:
    def __init__(self):
        self.model = "Qwen/Qwen3-VL-32B-Instruct"  # SiliconFlow 的 Qwen VL 模型
        self.text_model = "Qwen/Qwen2.5-72B-Instruct"  # 纯文本对话模型
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
        try:
            response = client.chat.completions.create(
                model=self.text_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50
            )
            return response.choices[0].message.content.strip()
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
            {"role": "system", "content": full_system_prompt}
        ]

        # 2. Add short-term rolling history (last 3 messages)
        short_history = history[-3:]
        for msg in short_history:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({
                "role": role,
                "content": msg["content"]
            })

        try:
            if image_data:
                # 使用 VL 模型处理图片
                # 将图片转换为 base64
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": text},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                })
                
                response = client.chat.completions.create(
                    model=self.model,  # VL 模型
                    messages=messages,
                    max_tokens=1024
                )
            else:
                # 纯文本对话使用文本模型
                messages.append({
                    "role": "user",
                    "content": text
                })
                
                response = client.chat.completions.create(
                    model=self.text_model,  # 文本模型
                    messages=messages,
                    max_tokens=1024
                )

            reply_text = response.choices[0].message.content
            
            # Save current exchange to long-term memory
            await self.memory_service.add_memory(text, username)
            await self.memory_service.add_memory(reply_text, username)
            
            return reply_text

        except Exception as e:
            return f"An error occurred: {str(e)}"
