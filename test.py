from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv(override=True)
client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

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
    

chat = [{"role":"system","content":"you are a agent"}]
chat.extend([{"role":"assistant","content":"hi"}])
print(chat)   
reply = gemini_request(chat)
print(reply)