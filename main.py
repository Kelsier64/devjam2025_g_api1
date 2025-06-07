from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
from jwt.exceptions import InvalidTokenError
import uuid
from models import User, ChatMessage
from database import get_user_by_username, verify_password, add_user, get_db

app = FastAPI(title="AI Chat API")

# CORS settings for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT settings
SECRET_KEY = "YourSecretKey"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 password flow
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In-memory session storage (for development)
# In production, use Redis or another persistent storage
chat_sessions = {}

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    email: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

# Authentication functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    
    user = get_user_by_username(username)
    if user is None:
        raise credentials_exception
    return user

# Routes
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create session for this user if not exists
    if form_data.username not in chat_sessions:
        chat_sessions[form_data.username] = []
    
    token_data = {"sub": user.username}
    access_token = create_access_token(token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
async def register_user(user_data: UserCreate):
    existing_user = get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    add_user(user_data.username, user_data.password, user_data.email)
    return {"message": "User registered successfully"}

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_request: ChatRequest, current_user: User = Depends(get_current_user)):
    username = current_user.username
    
    # Add user message to session
    user_message = ChatMessage(
        id=str(uuid.uuid4()),
        sender="user",
        content=chat_request.message,
        timestamp=datetime.now()
    )
    chat_sessions[username].append(user_message)
    
    # Here you would integrate with your AI model
    ai_response = "This is a placeholder for AI response. Replace with actual AI integration."
    
    # Add AI response to session
    ai_message = ChatMessage(
        id=str(uuid.uuid4()),
        sender="ai",
        content=ai_response,
        timestamp=datetime.now()
    )
    chat_sessions[username].append(ai_message)
    
    return ChatResponse(response=ai_response, timestamp=ai_message.timestamp)

@app.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(current_user: User = Depends(get_current_user)):
    username = current_user.username
    return chat_sessions.get(username, [])

@app.delete("/chat/history")
async def clear_chat_history(current_user: User = Depends(get_current_user)):
    username = current_user.username
    chat_sessions[username] = []
    return {"message": "Chat history cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
