# AI Chatbot with Google Gemini - Project Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [API Documentation](#api-documentation)
6. [Data Models](#data-models)
7. [Setup and Installation](#setup-and-installation)
8. [Deployment](#deployment)
9. [Future Improvements](#future-improvements)

## Overview

This project is a conversational AI chatbot powered by Google's Gemini model. It features a modern web interface with persistent conversation history, allowing users to have continuous, context-aware conversations with the AI assistant. The application automatically saves all conversations to a JSON file, enabling users to revisit and continue previous conversations at any time.

## System Architecture

The application follows a client-server architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Frontend      │────▶│    Backend      │────▶│  Google Gemini  │
│  (React)        │◀────│   (FastAPI)     │◀────│     API         │
│                 │     │       ▲         │     │                 │
└─────────────────┘     │       │         │     └─────────────────┘
                        │       │         │
                        │       ▼         │
                        │  ┌───────────┐  │
                        │  │ Chat      │  │
                        └──┤ History   │◄─┘
                           │ Storage   │
                           │ (JSON)    │
                           └───────────┘
```

### Frontend

- Built with React and TypeScript
- State management using React Hooks
- Responsive UI with Chakra UI components
- Handles user input and message display
- Manages conversation list and selection
- Displays conversation history with timestamps

### Backend

- RESTful API built with FastAPI
- Manages conversation state and persistence
- Interfaces with Google's Gemini API
- Handles request validation and error handling
- Manages conversation lifecycle and state

### Chat History Storage

- **Location**: `backend/app/chat_history.json`
- **Backup**: Automatic backup (`chat_history.json.bak`)
- **Features**:
  - Persistent storage of all conversations
  - Thread-safe file operations
  - Automatic backup on application start
  - Efficient JSON-based storage format

## Data Flow

1. **New Message Flow**:

   - User sends message from Frontend
   - Backend receives and validates message
   - Message is appended to conversation in Chat History
   - Request is sent to Google Gemini API
   - Response is received and stored in Chat History
   - Updated conversation is sent back to Frontend

2. **Conversation Loading**:

   - Frontend requests conversation list
   - Backend reads from Chat History Storage
   - List of conversations is returned with metadata
   - User selects conversation to load
   - Full conversation history is retrieved and displayed

3. **Persistence**:
   - All conversations are automatically saved to disk
   - Backup is maintained to prevent data loss
   - Conversations persist between server restarts

## Chat History Functionality

The application includes robust chat history management with the following features:

### Automatic Conversation Persistence

- All conversations are automatically saved to `backend/app/chat_history.json`
- Each conversation is assigned a unique ID and timestamp
- Conversation titles are automatically generated from the first message
- Messages include timestamps and role (user/assistant)

### Conversation Management

- View list of all past conversations
- Load any previous conversation by ID
- Continue conversations from where you left off
- Each conversation maintains its full message history

### Data Structure

```json
{
  "conversation_id": {
    "id": "unique_id",
    "title": "First few words of first message...",
    "created_at": "2023-01-01T12:00:00",
    "updated_at": "2023-01-01T12:30:00",
    "messages": [
      {
        "role": "user|assistant",
        "content": "Message content",
        "timestamp": "2023-01-01T12:00:00"
      }
    ]
  }
}
```

### Backend Implementation

- Uses file-based storage for simplicity
- Implements thread-safe file operations
- Handles concurrent access to conversation history
- Automatically creates backup of chat history on startup

## Technologies Used

### Frontend Stack

| Technology  | Purpose           | Version |
| ----------- | ----------------- | ------- |
| React       | UI Library        | ^18.2.0 |
| TypeScript  | Type Checking     | ^4.9.5  |
| Chakra UI   | Component Library | ^2.8.2  |
| Axios       | HTTP Client       | ^1.6.0  |
| React Icons | Icon Library      | ^4.12.0 |

### Backend Stack

| Technology           | Purpose                | Version  |
| -------------------- | ---------------------- | -------- |
| Python               | Programming Language   | 3.8+     |
| FastAPI              | Web Framework          | 0.104.0+ |
| Google Generative AI | AI Model               | 0.3.0+   |
| Uvicorn              | ASGI Server            | 0.23.0+  |
| Pydantic             | Data Validation        | 1.10.0+  |
| python-dotenv        | Environment Management | 1.0.0+   |

### Development Tools

| Tool       | Purpose                    |
| ---------- | -------------------------- |
| Git        | Version Control            |
| npm        | Package Manager (Frontend) |
| pip        | Package Manager (Python)   |
| Virtualenv | Python Environment         |

## Project Structure

```
wale-chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── chat_history.json  # Conversation storage
│   │   └── .env              # Environment variables
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Python virtual environment
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── ConversationList.tsx
│   │   ├── App.tsx          # Main application component
│   │   └── index.tsx        # Entry point
│   ├── package.json         # Frontend dependencies
│   └── tsconfig.json        # TypeScript config
├── README.md                # Project overview
└── PROJECT_DOCUMENTATION.md # This file
```

## API Documentation

### Base URL

`http://localhost:8000`

### Endpoints

#### 1. Health Check

- **Endpoint**: `GET /api/health`
- **Description**: Verify API is running
- **Response**:
  ```json
  {
    "status": "healthy"
  }
  ```

#### 2. List Conversations

- **Endpoint**: `GET /api/conversations`
- **Description**: Get list of all conversations
- **Response**:
  ```json
  [
    {
      "id": "1",
      "title": "Sample Conversation",
      "created_at": "2023-01-01T12:00:00",
      "updated_at": "2023-01-01T12:30:00",
      "message_count": 5
    }
  ]
  ```

#### 3. Get Conversation

- **Endpoint**: `GET /api/conversations/{conversation_id}`
- **Description**: Get specific conversation by ID
- **Response**:
  ```json
  {
    "id": "1",
    "title": "Sample Conversation",
    "created_at": "2023-01-01T12:00:00",
    "updated_at": "2023-01-01T12:30:00",
    "messages": [
      {
        "role": "user",
        "content": "Hello",
        "timestamp": "2023-01-01T12:00:00"
      },
      {
        "role": "assistant",
        "content": "Hi there! How can I help?",
        "timestamp": "2023-01-01T12:00:01"
      }
    ]
  }
  ```

#### 4. Send Message

- **Endpoint**: `POST /api/chat`
- **Description**: Send a message and get AI response
- **Request Body**:
  ```json
  {
    "message": "Hello, how are you?",
    "conversation_id": "1"
  }
  ```
- **Response**:
  ```json
  {
    "response": "I'm doing well, thank you! How can I assist you today?",
    "conversation_id": "1"
  }
  ```

## Data Models

### Message

```typescript
{
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO format
}
```

### Conversation

```typescript
{
  id: string;
  title: string;
  created_at: string;  // ISO format
  updated_at: string;  // ISO format
  messages: Message[];
}
```

### ChatRequest

```typescript
{
  message: string;
  conversation_id?: string;  // Optional for new conversations
}
```

### ChatResponse

```typescript
{
  response: string;
  conversation_id: string;
}
```

## Data Storage

### Chat History File

- **Location**: `backend/app/chat_history.json`
- **Format**: JSON
- **Backup**: Automatic backup on application start
- **Persistence**: Maintains all conversations between server restarts

### File Structure

```
backend/
  app/
    chat_history.json    # Main conversation storage
    chat_history.json.bak  # Automatic backup
    main.py              # API implementation
```

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- Python (3.8+)
- Google API Key with Gemini access

### Backend Setup

1. Create and activate virtual environment:

   ```bash
   python -m venv backend/venv
   source backend/venv/bin/activate  # On Windows: backend\venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Configure environment variables:

   ```bash
   # backend/app/.env
   GOOGLE_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```bash
   cd backend/app
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Backend

1. **Production Server**:

   - Use Gunicorn with Uvicorn workers:
     ```bash
     gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
     ```
   - Configure reverse proxy (Nginx/Apache)
   - Set up process manager (systemd/PM2)

2. **Environment Variables**:
   - Set `GOOGLE_API_KEY` in production environment
   - Configure `CORS_ALLOWED_ORIGINS` for production domains

### Frontend

1. Build for production:

   ```bash
   cd frontend
   npm run build
   ```

2. Deploy static files to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Nginx server

## Future Improvements

### Core Features

- [ ] User authentication and authorization
- [ ] Support for multiple chat models
- [ ] File upload and processing
- [ ] Markdown support in messages
- [ ] Code syntax highlighting

### Performance

- [ ] Implement Redis for session caching
- [ ] Add database support (PostgreSQL/MongoDB)
- [ ] Implement rate limiting
- [ ] Add request/response compression

### User Experience

- [ ] Real-time typing indicators
- [ ] Message read receipts
- [ ] Message editing/deletion
- [ ] Conversation search
- [ ] Dark/light theme toggle

### Development

- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] API documentation with Swagger/OpenAPI
- [ ] Docker support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
