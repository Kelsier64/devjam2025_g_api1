from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class User(BaseModel):
    id: Optional[str] = None
    username: str
    password_hash: str
    email: str
    created_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assitant'
    content: str
