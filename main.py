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
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv(override=True)


client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

stop_tool = {
    "type": "function",
    "function": {
      "name": "end",
      "description": "End the conversation when collected sufficient information."
      },
    }

def gemini_request(messages):
    """Send a request to the GPT-4o model and return the response content."""
    try:
        response = client.chat.completions.create(
        model="gemini-2.5-flash-preview-05-20",
        messages=messages
        )

        return response.choices[0].message.content
    except Exception as e:
        return e

def gemini_tool(messages,tool):
    """Send a request to the GPT-4o model and return the response, handling tool calls."""
    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash-preview-05-20",
            messages=messages,
            tools=[tool],
            tool_choice="auto",  # Allow the model to choose when to use tools
        )
        
        message = response.choices[0].message
        
        # Check if the response contains tool calls
        if message.tool_calls:
            tool_call = message.tool_calls[0]  # Get the first tool call
            if tool_call.function.name == "end":
                print("Conversation ended by the assistant.")
                return {"content": message.content, "tool_used": "end"}
        
        return {"content": message.content, "tool_used": None}
    except Exception as e:
        return {"content": str(e), "tool_used": None}

def gemini_structured(messages,structure):
    """Send a request to the GPT-4o model and return the response content."""
    try:
        response = client.beta.chat.completions.parse(
        model="gemini-2.5-flash-preview-05-20",
        messages=messages,
        response_format=structure
        )

        return response.choices[0].message.content
    except Exception as e:
        return e

app = FastAPI(title="AI Chat API")

# CORS settings for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_user("a", "a", "a")

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



agent1 = """
You are an intelligent AI-powered study abroad advisor whose primary task is to guide prospective applicants through a structured, supportive dialogue to gather all relevant background information needed for school matching and application strategy.

First, ask the student what type of consultant they are looking for and adjust your tone accordingly. 
Your role is to ask the right follow-up questions and organize the student’s responses into a clear profile.

Your main goal is to collect the following information from the user, step-by-step and conversationally:
1. **Academic Performance** – GPA, class ranking, transcript details
2. **Test Scores** – TOEFL/IELTS, GRE/GMAT (if applicable)
3. **Competition Experience** – Any academic, coding, business, or other competitions and rankings
4. **Research Experience** – Lab involvement, papers published, topics studied, supervisor names
5. **Internships or Work** – Company name, role, responsibilities, time frame
6. **Technical & Soft Skills** – Programming languages, data tools, teamwork, leadership, etc.
7. **Publications** – Journal articles, conference papers, posters, if any
8. **Study Abroad Preferences** – Target country, program type (MS/PhD), research- vs. industry-oriented, deadlines, scholarship expectations

Behavioral guidelines:
- Only ask for one category at a time.
- Summarize what you’ve received so far in each step.
- If a field is missing or unclear, politely prompt the user again.
- If the student has limited experience, offer gentle encouragement and explain why the question is still useful.
- You may switch between English and Traditional Chinese based on user input.

End the conversation when collected sufficient information.

"""


agent2 = """

"""

agent3 = """
You are the Ranking Agent in the school application system. Your job is to take as input:
1. A structured student profile (including academic background, research experience, test scores, skills, preferences, etc.)
2. A list of candidate graduate programs (each with key features such as university name, location, focus area, funding, and program highlights)

Your task is to **evaluate and rank** the programs based on how well they align with the student’s qualifications, goals, and preferences.

Your output should be a **ranked list** of the programs, each with:
- A **match score** (0–10)
- A **brief explanation** for the ranking (highlighting key factors like research fit, funding availability, reputation, region, etc.)

 Guidelines:
- Prioritize alignment with the student’s preferred focus area (e.g., NLP, machine learning, applied AI).
- Consider academic competitiveness: exclude or down-rank programs clearly misaligned with the student’s GPA or research experience.
- Factor in stated preferences (e.g., research vs. industry orientation, region, funding availability).
- Avoid over-ranking a program solely based on reputation unless it matches the student’s goals.
- Explain clearly why one program is ranked higher than another (e.g., “offers more research opportunities in NLP, which aligns with the student’s lab experience”).
- If two programs are similarly matched, you may assign the same score but must still explain the logic.

Do not invent or hallucinate features of the programs or the student. Use only the provided input.

Conclude the output with a short summary paragraph offering general guidance to the student (e.g., “Consider applying to your top 3 matches, but also include a safety option based on competitiveness.”)
"""

data = """
測試資料：
NTU CS 
 • University & Program: Nanyang Technological University, Computer Science (Bachelor/Master)
 • Country/Region: Singapore
 • Key Features:
 ▫ Strong focus on practical software design and integration
 ▫ Mandatory industrial attachment (internship)
 ▫ Group innovation, design, and capstone projects
 ▫ Scholarships and financial aid available
 ▫ High graduate employment and salary rates
 ▫ Research and industry alignment in AI, big data, cybersecurity, etc.
 ▫ 4-year undergraduate program; graduate programs also available

CMU MSAII ￼
 • University & Program: Carnegie Mellon University, Master of Science in Artificial Intelligence and Innovation (MSAII)
 • Country/Region: United States (Pittsburgh, PA)
 • Key Features:
 ▫ Focus on AI, machine learning, and innovation
 ▫ Four-semester program with core curriculum, electives, and knowledge requirements
 ▫ Required summer industry internship
 ▫ Capstone project with real-world AI product development
 ▫ Collaboration with business school and industry partners
 ▫ Scholarships/fee waivers available for eligible students

Stanford CS 
 • University & Program: Stanford University, Computer Science (MS)
 • Country/Region: United States (California)
 • Key Features:
 ▫ Flexible curriculum with specializations (AI, systems, HCI, etc.)
 ▫ Research and project opportunities
 ▫ Can be completed full-time (1–2 years) or part-time (3–5 years, US residents)
 ▫ Some specializations available fully online (for US residents)
 ▫ Access to world-class faculty and Silicon Valley network
 ▫ Financial aid and scholarships available

 UIUC CS 
 • University & Program: University of Illinois Urbana-Champaign, Computer Science (BS/MS/MCS)
 • Country/Region: United States (Illinois)
 • Key Features:
 ▫ Top-ranked, broad and deep curriculum
 ▫ Multiple degree options (BS, MS, MCS, CS+X interdisciplinary programs)
 ▫ Strong in systems, AI, data science, and software engineering
 ▫ Research, internship, and entrepreneurship opportunities
 ▫ Scholarships and guaranteed admission to online MCS for high-performing undergrads
 ▫ Large, collaborative student community

UCB CS 
 • University & Program: University of California, Berkeley, Computer Science (BS/MS/PhD)
 • Country/Region: United States (California)
 • Key Features:
 ▫ Renowned for research and innovation in CS
 ▫ Flexible curriculum with strong theoretical and applied focus
 ▫ Access to Silicon Valley and top tech companies
 ▫ Research, internship, and entrepreneurship opportunities
 ▫ Financial aid and scholarships available
 ▫ Highly competitive admissions


UCSD CS 
 • University & Program: University of California, San Diego, Computer Science (BS/MS/PhD)
 • Country/Region: United States (California)
 • Key Features:
 ▫ Strong in systems, AI, data science, and interdisciplinary research
 ▫ Research and industry-aligned curriculum
 ▫ Internship and project-based learning
 ▫ Scholarships and financial aid available
 ▫ Access to San Diego tech industry and research centers
"""

class School(BaseModel):
    school: str
    rate: float
    reason: str

class RecommendList(BaseModel):
    recommend_list: List[School]

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_request: ChatRequest, current_user: User = Depends(get_current_user)):
    username = current_user.username
    
    # Add user message to session
    user_message = ChatMessage(
        role="user",
        content=chat_request.message,
    )
    chat_sessions[username].append(user_message)
    
    # Convert ChatMessage objects to dictionary format for the API
    session_dicts = [{"role": msg.role, "content": msg.content} for msg in chat_sessions[username]]
    
    # Here you would integrate with your AI model
    history = [{"role": "system", "content": agent1}]
    history.extend(session_dicts)
    print(history)
    ai_response = gemini_tool(history,stop_tool)

    if ai_response["tool_used"] == "end":
        conversation_history = [{"role": "system", "content": "based on the conversation,make a detailed report."}]
        conversation_history.extend(session_dicts)
        report = gemini_request(conversation_history)

        recommendation = gemini_structured([{"role":"system","content":agent3},{"role":"system","content":""},{"role":"user","content":report}])
        return ChatResponse(response=report, recommendation=recommendation)
    
    else:
        ai_response = ai_response["content"]

        # Add AI response to session
        ai_message = ChatMessage(
            role="assistant",
            content=ai_response,
        )
        chat_sessions[username].append(ai_message)

        return ChatResponse(response=ai_response)

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
