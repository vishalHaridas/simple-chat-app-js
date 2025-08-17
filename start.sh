#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting LLM Chat App...${NC}"

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ server/.env file not found!${NC}"
    echo -e "${BLUE}📝 Creating .env file from template...${NC}"
    cp server/.env.example server/.env
    echo -e "${RED}⚠️  Please edit server/.env and add your OpenRouter API key${NC}"
    echo -e "${BLUE}   Get your key from: https://openrouter.ai/${NC}"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "server/node_modules" ] || [ ! -d "llm-chat/node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    cd llm-chat && npm install && cd ../server && npm install && cd ..
fi

echo -e "${GREEN}✅ Starting server on port 3001...${NC}"
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

echo -e "${GREEN}✅ Starting client on port 5173...${NC}"
cd llm-chat && npm run dev &
CLIENT_PID=$!

echo -e "${BLUE}🌐 Services starting:${NC}"
echo -e "${BLUE}   Client: http://localhost:5173${NC}"
echo -e "${BLUE}   Server: http://localhost:3001${NC}"
echo -e "${BLUE}   Health: http://localhost:3001/health${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop both services${NC}"

# Function to handle cleanup when script is interrupted
cleanup() {
    echo -e "\n${RED}🛑 Stopping services...${NC}"
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script termination
trap cleanup INT TERM

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
