#!/bin/bash

echo "🧪 Running LLM Chat App Tests..."

cd llm-chat

echo "📦 Installing test dependencies if needed..."
npm install

echo "🔍 Running tests..."
npm run test:run

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed"
    exit 1
fi
