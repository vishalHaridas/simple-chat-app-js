#!/bin/bash

# Test script to verify the server is working
echo "🧪 Testing LLM Chat Server..."

# Test health endpoint
echo "📡 Testing health endpoint..."
health_response=$(curl -s http://localhost:3001/health)
if [[ $? -eq 0 ]]; then
    echo "✅ Health check passed: $health_response"
else
    echo "❌ Health check failed - is the server running?"
    exit 1
fi

# Test chat endpoint (only if we have an API key)
if grep -q "your_openrouter_api_key_here" server/.env 2>/dev/null; then
    echo "⚠️  OpenRouter API key not configured - skipping chat test"
    echo "   Edit server/.env to add your API key"
else
    echo "💬 Testing chat completion..."
    chat_response=$(curl -s -X POST http://localhost:3001/api/chat/completions \
        -H "Content-Type: application/json" \
        -d '{"message": "Say hello in one word"}')
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Chat test passed"
        echo "   Response: $chat_response"
    else
        echo "❌ Chat test failed"
    fi
fi

echo "🎉 Server tests completed!"
