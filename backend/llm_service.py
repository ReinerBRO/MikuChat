import os
import base64
from typing import Optional
from dotenv import load_dotenv
from openai import OpenAI
from langchain.agents.factory import create_agent
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from datetime import datetime
# Load environment variables
load_dotenv()

from memory_service import MemoryService
from weather_service import WeatherService

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
        self.weather_service = WeatherService()
        self.agent_llm = ChatOpenAI(
            model=self.text_model,
            base_url="https://api.siliconflow.cn/v1",
            api_key=os.getenv("SILICONFLOW_API_KEY")
        )
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

    def _build_tools(self):
        @tool
        def get_weather(city: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None) -> str:
            """查询天气。输入 city 或者 lat/lon。返回当前天气和今日最高/最低温。"""
            result = self.weather_service.get_weather(city=city, lat=lat, lon=lon, lang="zh")
            if "error" in result:
                return f"天气查询失败：{result['error']}"

            location = result.get("location", {})
            current = result.get("current", {})
            daily = result.get("daily", {})
            location_name = location.get("name") or "当前位置"
            admin1 = location.get("admin1") or ""
            country = location.get("country") or ""
            location_label = " ".join([v for v in [location_name, admin1, country] if v])

            return (
                f"{location_label}天气：{current.get('weather_text')}，"
                f"当前{current.get('temperature')}°C，体感{current.get('apparent_temperature')}°C，"
                f"风速{current.get('wind_speed')} km/h。"
                f"今日最高{daily.get('temperature_max')}°C，最低{daily.get('temperature_min')}°C，"
                f"降水概率{daily.get('precipitation_probability_max')}%。"
            )


        @tool
        def get_time() -> str:
            """获取当前时间"""
            now = datetime.now()
            return now.strftime("当前时间是 %Y 年 %m 月 %d 日，%H 点 %M 分。")

        return [get_weather, get_time]

    def _build_agent(self, system_prompt: str):
        tools = self._build_tools()
        return create_agent(
            model=self.agent_llm,
            tools=tools,
            system_prompt=system_prompt + " 如果需要实时天气，请使用 get_weather 工具。需要当前时间请使用 get_time 工具。",
            debug=False
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

        # 2. Add short-term rolling history (last 3 messages)
        short_history = history[-3:]
        history_messages = []
        for msg in short_history:
            if msg["role"] == "user":
                history_messages.append(HumanMessage(content=msg["content"]))
            else:
                history_messages.append(AIMessage(content=msg["content"]))

        try:
            if image_data:
                messages = [
                    {"role": "system", "content": full_system_prompt}
                ]
                for msg in short_history:
                    role = "user" if msg["role"] == "user" else "assistant"
                    messages.append({
                        "role": role,
                        "content": msg["content"]
                    })

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
                agent = self._build_agent(full_system_prompt)
                result = agent.invoke({
                    "messages": [*history_messages, HumanMessage(content=text)]
                })
                messages = result.get("messages", [])
                if messages:
                    last = messages[-1]
                    reply_text = last.content if hasattr(last, "content") else str(last)
                else:
                    reply_text = ""
            
            # Save current exchange to long-term memory
            await self.memory_service.add_memory(text, username)
            await self.memory_service.add_memory(reply_text, username)
            
            return reply_text

        except Exception as e:
            return f"An error occurred: {str(e)}"
