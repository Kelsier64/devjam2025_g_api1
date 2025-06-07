from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv(override=True)
client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

response = client.chat.completions.create(
    model="gemini-2.5-flash-preview-05-20",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {
            "role": "user",
            "content": "hello"
        }
    ]
)

print(response.choices[0].message)