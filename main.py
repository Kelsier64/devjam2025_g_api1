from fastapi import FastAPI, HTTPException, Request, Form, Depends, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
import sqlite3
import secrets
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext

# Create FastAPI app
app = FastAPI(title="Login API")

# Add session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=secrets.token_urlsafe(32),
    session_cookie="fastapi_session",
    max_age=3600,  # Session expiration time in seconds (1 hour)
)

# Set up templates directory
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_dir)

# SQLite Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./sqlite.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define database models
class DBUser(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)

# Define Pydantic models
class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    
class ChatMessage(BaseModel):
    sender: str
    content: str
    timestamp: Optional[str] = None

class UserInDB(User):
    hashed_password: str
    
class UserCreate(User):
    password: str

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def get_user(db: Session, username: str):
    return db.query(DBUser).filter(DBUser.username == username).first()

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_user(db: Session, user: UserCreate):
    db_user = DBUser(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Routes
@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {"request": request}
    )

@app.post("/login")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Initialize session data
    request.session["username"] = user.username
    
    # Return token for API use
    response = RedirectResponse(url="/home", status_code=status.HTTP_303_SEE_OTHER)
    return response

@app.get("/chat")
async def chat(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_user(db, token)
    if not user:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    
    # Initialize chat history in session if it doesn't exist
    if "chat_history" not in request.session:
        request.session["chat_history"] = []
    
    return templates.TemplateResponse(
        "chat.html", 
        {
            "request": request,
            "username": user.username,
            "messages": request.session.get("chat_history", [])
        }
    )

@app.post("/chat/upload")
async def upload(request: Request, message: str = Form(...), token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_user(db, token)
    if not user:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    
    # Initialize chat history in session if it doesn't exist
    if "chat_history" not in request.session:
        request.session["chat_history"] = []
    
    # Create a new message and add it to chat history
    from datetime import datetime
    new_message = {
        "sender": user.username,
        "content": message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Add message to session
    chat_history = request.session.get("chat_history", [])
    chat_history.append(new_message)
    request.session["chat_history"] = chat_history
    
    # Redirect back to chat page
    return RedirectResponse(url="/chat", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/home")
async def home(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_user(db, token)
    if not user:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    
    return templates.TemplateResponse(
        "home.html", 
        {
            "request": request,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email
        }
    )

@app.get("/user/me")
async def read_users_me(current_user: User = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_user(db, current_user)
    if not user:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return {"username": user.username, "email": user.email, "full_name": user.full_name}



# Initialize database with a test user
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Check if test user exists
    test_user = get_user(db, "user1")
    if not test_user:
        # Create test user
        user = UserCreate(
            username="user1",
            email="user1@example.com",
            full_name="User One",
            password="password1"
        )
        create_user(db, user)
    db.close()

def main():
    # Create templates directory if it doesn't exist
    os.makedirs(templates_dir, exist_ok=True)
    
    # Initialize database
    init_db()
    
    # Run the FastAPI application
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
