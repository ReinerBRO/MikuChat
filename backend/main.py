from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .llm_service import LLMService

app = FastAPI(title="MikuChat API", description="Backend for MikuChat WebUI")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = LLMService()

class ChatRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "MikuChat Backend is running! 🎵"}

@app.post("/api/chat")
async def chat(
    text: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    image_data = None
    if image:
        image_data = await image.read()
    
    response = await llm_service.generate_response(text, image_data)
    return {"response": response}
