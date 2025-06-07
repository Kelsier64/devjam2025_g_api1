import uuid
from datetime import datetime
import bcrypt
from models import User

# In-memory database for development
# In production, replace with a real database like PostgreSQL or MongoDB
users_db = {}

def get_db():
    return users_db

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against one provided by user."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user_by_username(username: str) -> User:
    """Get a user by username."""
    return users_db.get(username)

def add_user(username: str, password: str, email: str) -> User:
    """Add a new user to the database."""
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(password)
    
    user = User(
        id=user_id,
        username=username,
        password_hash=hashed_password,
        email=email,
        created_at=datetime.now()
    )
    
    users_db[username] = user
    return user
