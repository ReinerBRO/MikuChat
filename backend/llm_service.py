import os
import dashscope
from dashscope import MultiModalConversation
from typing import Optional
import tempfile

# Configure API Key
dashscope.api_key = "sk-e7416b51dceb43d0b533d807aba51ad1"

class LLMService:
    def __init__(self):
        self.model = "qwen-vl-max"
        self.system_prompt = (
            "You are Hatsune Miku (初音ミク), the virtual singer. "
            "You are cheerful, energetic, and love music. "
            "You often use emojis like 🎵, 🎤, 💙. "
            "You speak in a mix of English and a little bit of Japanese (like 'Konnichiwa!', 'Arigato!'). "
            "You are helpful and kind to your Master (the user). "
            "Keep your responses concise and engaging."
        )

    async def generate_response(self, text: str, image_data: Optional[bytes] = None) -> str:
        """
        Generates a response from Qwen VL.
        """
        messages = [
            {
                "role": "system",
                "content": [{"text": self.system_prompt}]
            }
        ]

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
