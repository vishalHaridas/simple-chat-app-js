# LLM Chat Server

A simple Express.js server that handles text completions using OpenRouter API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Get your OpenRouter API key:
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Get your API key from the dashboard
   - Add it to your `.env` file:
     ```
     OPENROUTER_API_KEY=your_actual_api_key_here
     ```

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on http://localhost:3001

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### Chat Completion
- **POST** `/api/chat/completions`
- Body:
  ```json
  {
    "message": "Your message here",
    "model": "anthropic/claude-3.5-haiku" // optional
  }
  ```
- Response:
  ```json
  {
    "completion": "AI response",
    "model": "anthropic/claude-3.5-haiku",
    "usage": { "prompt_tokens": 10, "completion_tokens": 25, "total_tokens": 35 }
  }
  ```

## Available Models

Some popular OpenRouter models:
- `anthropic/claude-3.5-haiku` (fast, cheap)
- `anthropic/claude-3.5-sonnet` (balanced)
- `openai/gpt-4o-mini` (OpenAI's fast model)
- `openai/gpt-4o` (OpenAI's latest)
- `meta-llama/llama-3.1-8b-instruct:free` (free option)

## Testing

You can test the server with curl:

```bash
# Health check
curl http://localhost:3001/health

# Chat completion
curl -X POST http://localhost:3001/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```
