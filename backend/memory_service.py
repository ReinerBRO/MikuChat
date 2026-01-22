import os
import json
import numpy as np
from datetime import datetime
from typing import List
from dotenv import load_dotenv
from openai import OpenAI

class MemoryService:
    def __init__(self, storage_dir="sessions"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
        self.embedding_model = os.getenv("SILICONFLOW_EMBEDDING_MODEL", "BAAI/bge-m3")
        self.client = OpenAI(
            base_url="https://api.siliconflow.cn/v1",
            api_key=os.getenv("SILICONFLOW_API_KEY")
        )

    def _get_memory_path(self, username: str) -> str:
        safe_username = "".join(c for c in username if c.isalnum() or c in ('_', '-'))
        return os.path.join(self.storage_dir, f"{safe_username}_memories.json")

    async def get_embedding(self, text: str) -> List[float]:
        try:
            # Note: This call is blocking; kept async for API consistency.
            resp = self.client.embeddings.create(model=self.embedding_model, input=text)
            return resp.data[0].embedding if resp.data else []
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    async def add_memory(self, text: str, username: str):
        if not text or len(text.strip()) < 2:
            return
            
        embedding = await self.get_embedding(text)
        if not embedding:
            return
            
        path = self._get_memory_path(username)
        memories = []
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    memories = json.load(f)
            except:
                memories = []
        
        memories.append({
            "text": text,
            "embedding": embedding,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep it indexed/searchable
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(memories, f, ensure_ascii=False, indent=2)

    async def search_memories(self, query: str, username: str, top_k=3) -> List[str]:
        query_emb = await self.get_embedding(query)
        if not query_emb:
            return []
            
        path = self._get_memory_path(username)
        if not os.path.exists(path):
            return []
            
        try:
            with open(path, 'r', encoding='utf-8') as f:
                memories = json.load(f)
        except:
            return []
            
        if not memories:
            return []
            
        q_vec = np.array(query_emb)
        q_dim = len(query_emb)
        scores = []
        
        for mem in memories:
            embedding = mem.get("embedding")
            if not isinstance(embedding, list) or len(embedding) != q_dim:
                # Skip embeddings from older models with different dimensions.
                continue
            m_vec = np.array(embedding)
            # Cosine similarity
            norm_q = np.linalg.norm(q_vec)
            norm_m = np.linalg.norm(m_vec)
            if norm_q == 0 or norm_m == 0:
                sim = 0
            else:
                sim = np.dot(q_vec, m_vec) / (norm_q * norm_m)
            scores.append((sim, mem['text']))
            
        # Sort by similarity descending
        scores.sort(key=lambda x: x[0], reverse=True)
        
        # Return top K unique results
        results = []
        seen = set()
        # Filter out exact matches (the current query) to avoid redundant loops
        query_strip = query.strip()
        
        for score, text in scores:
            clean_text = text.strip()
            if clean_text != query_strip and clean_text not in seen:
                results.append(text)
                seen.add(clean_text)
            if len(results) >= top_k:
                break
                
        return results
