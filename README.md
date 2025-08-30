# Simple Chat App with LLM

A barebones chat application to understand the basics of LLMs. This project consists of:
- **Client**: React + Vite frontend (`llm-chat/`)
- **Server**: (Primary focus) Express.js backend that handles OpenRouter API calls (`server/`)

## Project Structure
```
├── llm-chat/          # React frontend
├── server/            # Express backend
├── package.json       # Root package.json with helper scripts
└── README.md          # This file
```

## Learning Points
I built this application to learn the following:
- **LLM API Integration**: The Completions API, and how it works
  - **Streaming** required looking into SSE, and going down the rabbit hole of communication protocols
- **State Management**: Managing chat state

## Next Steps
I will look into extending this project by adding:
- Streaming responses ✅
- Chat history persistence 🚧
- LLM Provider Switcher 🚧
- Multiple LLM model switching 
- Different conversation modes
- Message editing
- Token/Cost tracking
- ✨**RAG**✨
- ✨**MCP**✨
