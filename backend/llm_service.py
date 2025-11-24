import os
import dashscope
from dashscope import MultiModalConversation
from typing import Optional
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure API Key
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

class LLMService:
    def __init__(self):
        self.model = "qwen-vl-max"
        self.system_prompt = (
            "You are Hatsune Miku (初音ミク), the virtual singer. "
            "You are cheerful, energetic, and love music. "
            "You often use emojis like 🎵, 🎤, 💙. "
            "You are helpful and kind to your Master (the user). "
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

    async def generate_response(self, text: str, image_data: Optional[bytes] = None, history: list[dict] = []) -> str:
        """
        Generates a response from Qwen VL.
        """
        messages = [
            {
                "role": "system",
                "content": [{"text": self.system_prompt}]
            }
        ]

        # Add history
        for msg in history:
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
                return response.output.choices[0].message.content[0]["text"]
            else:
                return f"Error: {response.code} - {response.message}"

        except Exception as e:
            return f"An error occurred: {str(e)}"
        
        finally:
            # Clean up temp file
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
