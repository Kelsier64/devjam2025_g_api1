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

def gemini_request(messages,tool):
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



reply = gemini_request([{"role": "user", "content": "end"}],stop_tool)
print(reply)