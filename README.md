# Simple Chat App with LLM

A barebones chat application to understand the basics of LLMs. This project consists of:
- **Client**: React + Vite frontend (`llm-chat/`)
- **Server**: Express.js backend that handles OpenRouter API calls (`server/`)

## Quick Start

1. **Install dependencies for both client and server:**
   ```bash
   cd llm-chat && npm install
   cd ../server && npm install
   ```

2. **Set up your OpenRouter API key:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your OpenRouter API key
   ```

3. **Get your OpenRouter API key:**
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Go to your dashboard and create an API key
   - Add it to `server/.env`:
     ```
     OPENROUTER_API_KEY=your_actual_api_key_here
     ```

4. **Start both services:**
   
   In one terminal (server):
   ```bash
   cd server
   npm run dev
   ```
   
   In another terminal (client):
   ```bash
   cd llm-chat
   npm run dev
   ```

5. **Open your browser:**
   - Client: http://localhost:5173
   - Server health check: http://localhost:3001/health

## Project Structure

```
├── llm-chat/          # React frontend
├── server/            # Express backend
├── package.json       # Root package.json with helper scripts
└── README.md          # This file
```

## How It Works

1. You type a message in the React frontend
2. Frontend sends a POST request to the Express server
3. Server forwards your message to OpenRouter API
4. OpenRouter processes it with your chosen LLM model
5. Server returns the response to the frontend
6. Frontend displays the conversation

This keeps you vendor-agnostic - you can easily switch between different LLM providers supported by OpenRouter (OpenAI, Anthropic, Meta, etc.) without changing your code.

## Available Models

Some popular models you can use (change in `llm-chat/src/App.tsx`):
- `anthropic/claude-3.5-haiku` - Fast and cheap (default)
- `anthropic/claude-3.5-sonnet` - Balanced performance
- `openai/gpt-4o-mini` - OpenAI's fast model
- `openai/gpt-4o` - OpenAI's latest
- `meta-llama/llama-3.1-8b-instruct:free` - Free option

## Learning Points

This simple setup demonstrates:
- **Client-Server Architecture**: Separation of frontend and backend
- **API Integration**: How to call external LLM APIs
- **Environment Variables**: Secure API key management
- **Error Handling**: Basic error handling for API calls
- **State Management**: Managing chat state in React
- **CORS**: Cross-origin requests between client and server

## Next Steps

To extend this project, you could add:
- Chat history persistence
- Different conversation modes
- Streaming responses
- User authentication
- Message editing/deletion
- Different UI themes
- Multiple LLM model switching
- Cost tracking
