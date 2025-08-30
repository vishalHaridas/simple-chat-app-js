import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import providerCall from './features/providers/index.js';
import createMemoryComponents from './features/memory/factory.js';
import createConversationsRouter from './features/conversations/index.js';
import createConversationsService from './features/conversations/service.js';
import { unwrapErr } from './utils/result.js'

const USER_ID = 'default';

const memoryComponents = createMemoryComponents();
const { memoryFacade } = memoryComponents;

const completionsService = createConversationsService(memoryFacade, providerCall, USER_ID);

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/completions', createConversationsRouter(completionsService, USER_ID));


app.get('/health', (_, res) => {
  res.json({ status: 'OK', message: 'LLM Chat Server is running' });
});

// Test streaming endpoint
app.get('/api/test-stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  let counter = 0;
  const interval = setInterval(() => {
    if (counter < 5) {
      res.write(`data: ${JSON.stringify({ message: `Test message ${counter + 1}`, counter })}\n\n`);
      counter++;
    } else {
      res.write(`data: ${JSON.stringify({ message: 'Stream complete', done: true })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  Warning: OPENROUTER_API_KEY environment variable not set');
  }
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  const results = memoryComponents.shutdown();
  results.forEach((result, index) => {
    if (result.ok) {
      console.log(`Database ${index} closed successfully.`);
    } else {
      console.error(`Error closing database ${index}:`, result.error, unwrapErr(result));
    }
  });
  process.exit();
});