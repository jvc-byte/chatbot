from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Dict, List, Optional, Any
import os
import json
from datetime import datetime
from pathlib import Path
import traceback

# Load environment variables
load_dotenv()

# Configure Google Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize the model
model = genai.GenerativeModel(model_name='models/gemma-3-4b-it')

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Dict, List, Optional, Any
import os
import json
from datetime import datetime
from pathlib import Path
import traceback

# Load environment variables
load_dotenv()

# Configure Google Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize the model
model = genai.GenerativeModel(model_name='models/gemma-3-4b-it')

# Initialize FastAPI app
app = FastAPI()

# Configure CORS for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Global conversations storage
conversations = {}

# File to store conversations
CHAT_HISTORY_FILE = Path("chat_history.json")

# Initialize chat history file if it doesn't exist
if not CHAT_HISTORY_FILE.exists():
    CHAT_HISTORY_FILE.write_text("{}")

# Load conversations from file
def load_conversations() -> Dict[str, dict]:
    try:
        return json.loads(CHAT_HISTORY_FILE.read_text())
    except json.JSONDecodeError:
        return {}

def save_conversations(conversations: Dict[str, dict]):
    CHAT_HISTORY_FILE.write_text(json.dumps(conversations, indent=2))

# Load existing conversations
conversations = load_conversations()

# Exception handler for 500 errors
@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    print(f"Error: {str(exc)}")
    print(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": "*"}
    )

# Handle preflight requests
@app.options("/api/{path:path}")
async def preflight_handler(request: Request):
    return JSONResponse(status_code=200)

@app.get("/api/conversations")
async def get_conversations():
    """Get list of all conversations"""
    return [
        {
            "id": conv_id,
            "title": conv.get('title', f"Conversation {conv_id}")[:50],
            "updated_at": conv.get('updated_at', datetime.now().isoformat())
        }
        for conv_id, conv in conversations.items()
    ]

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Convert messages to a list of dictionaries
    messages = conversations[conversation_id].get('messages', [])
    return [{
        'id': str(i),
        'content': msg['content'],
        'role': msg['role'],
        'timestamp': msg['timestamp']
    } for i, msg in enumerate(messages)]

# Chat endpoint
@app.post("/api/chat")
async def chat(request: Request):
    try:
        # Get request body
        body = await request.json()
        
        # Validate input
        if not body.get('message') or not body['message'].strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get conversation ID
        conversation_id = body.get('conversation_id')
        
        # Check if we're continuing an existing conversation
        if conversation_id and conversation_id in conversations:
            conversation = conversations[conversation_id]
            # Ensure messages list exists
            if 'messages' not in conversation:
                conversation['messages'] = []
        else:
            # Start a new conversation
            conversation_id = str(int(datetime.now().timestamp()))
            conversation = {
                "id": conversation_id,
                "title": body['message'][:30] + ("..." if len(body['message']) > 30 else ""),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "messages": []
            }
            conversations[conversation_id] = conversation
        
        # Add user message to conversation
        user_message = {
            "role": "user",
            "content": body['message'],
            "timestamp": datetime.now().isoformat()
        }
        conversation["messages"].append(user_message)
        conversation["updated_at"] = datetime.now().isoformat()
        
        # Generate response using Gemini
        try:
            response = model.generate_content(
                body['message'],
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048
            )
            
            # Get the response text
            response_text = response.text
            
            # Add assistant message to conversation
            assistant_message = {
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.now().isoformat()
            }
            conversation["messages"].append(assistant_message)
            
            # Save conversations
            save_conversations(conversations)
            
            return {
                "response": response_text,
                "conversation_id": conversation_id,
                "message_id": str(len(conversation["messages"]) - 1),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate response"
            )
            
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

# File to store conversations
CHAT_HISTORY_FILE = Path("chat_history.json")

# Initialize chat history file if it doesn't exist
if not CHAT_HISTORY_FILE.exists():
    CHAT_HISTORY_FILE.write_text("{}")

# Load conversations from file
def load_conversations() -> Dict[str, dict]:
    try:
        return json.loads(CHAT_HISTORY_FILE.read_text())
    except json.JSONDecodeError:
        return {}

def save_conversations(conversations: Dict[str, dict]):
    CHAT_HISTORY_FILE.write_text(json.dumps(conversations, indent=2))

# In-memory storage for active conversations
active_conversations = {}

# Load existing conversations
conversations = load_conversations()

@app.get("/api/conversations", response_model=List[dict])
async def list_conversations():
    """List all saved conversations"""
    return [
        {
            "id": conv_id,
            "title": conv.get("title", "New Chat"),
            "created_at": conv.get("created_at"),
            "updated_at": conv.get("updated_at"),
            "message_count": len(conv.get("messages", []))
        }
        for conv_id, conv in conversations.items()
    ]

@app.get("/api/conversations/{conversation_id}", response_model=dict)
async def get_conversation(conversation_id: str):
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations[conversation_id]

@app.get("/api/conversations/{conversation_id}/messages", response_model=List[dict])
async def get_conversation_messages(conversation_id: str):
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Convert messages to a list of dictionaries
    messages = conversations[conversation_id].get('messages', [])
    return [{
        'id': str(i),
        'content': msg['content'],
        'role': msg['role'],
        'timestamp': msg['timestamp']
    } for i, msg in enumerate(messages)]

# Exception handler for 500 errors
@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    # Log the full error
    print(f"Error: {str(exc)}")
    print(traceback.format_exc())
    
    # Return a proper error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": "http://localhost:3000"}
    )

@app.post("/api/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage, request: Request):
    try:
        print(f"Received request from origin: {request.headers.get('origin')}")
        print(f"Request headers: {dict(request.headers)}")
        
        global conversations  # Use the global conversations dictionary
        
        # Validate input
        if not chat_message.message or not chat_message.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Check if we're continuing an existing conversation
        if chat_message.conversation_id and chat_message.conversation_id in conversations:
            print(f"Continuing conversation: {chat_message.conversation_id}")
            conversation = conversations[chat_message.conversation_id]
            # Ensure messages list exists
            if 'messages' not in conversation:
                conversation['messages'] = []
        else:
            # Start a new conversation
            conversation_id = str(int(datetime.now().timestamp()))
            conversation = {
                "id": conversation_id,
                "title": chat_message.message[:30] + ("..." if len(chat_message.message) > 30 else ""),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "messages": []
            }
            conversations[conversation_id] = conversation
            print(f"Started new conversation: {conversation_id}")
        
        # Add user message to conversation
        user_message = {
            "role": "user",
            "content": chat_message.message,
            "timestamp": datetime.now().isoformat()
        }
        conversation["messages"].append(user_message)
        conversation["updated_at"] = datetime.now().isoformat()
        
        print(f"Sending to Gemini: {chat_message.message}")
        
        # Generate response using Gemini
        try:
            chat = model.start_chat(history=[])
            response = chat.send_message(
                f"User: {chat_message.message}\n"
                "Assistant:"
            )
            assistant_content = response.text
            print(f"Received from Gemini: {assistant_content}")
        except Exception as e:
            print(f"Error calling Gemini API: {str(e)}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error generating response: {str(e)}"
            )
        
        # Add assistant's response to conversation
        assistant_message = {
            "role": "assistant",
            "content": response.text,
            "timestamp": datetime.now().isoformat()
        }
        conversation["messages"].append(assistant_message)
        
        # Save conversation to file
        try:
            save_conversations(conversations)
            print("Successfully saved conversations")
        except Exception as e:
            print(f"Error saving conversations: {str(e)}")
            print(traceback.format_exc())
            # Continue even if saving fails
        
        # Prepare response
        response_data = {
            "response": assistant_message["content"],
            "conversation_id": conversation["id"]
        }
        
        print(f"Sending response: {response_data}")
        
        # Create response with CORS headers
        response = JSONResponse(
            content=jsonable_encoder(response_data),
            headers={
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Credentials": "true"
            }
        )
        
        return response
        
    except HTTPException as http_exc:
        print(f"HTTP Exception: {str(http_exc)}")
        raise http_exc
    except Exception as e:
        print(f"Unexpected error in chat endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
