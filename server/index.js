import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import memory from './features/memory/memory.js';
import { providerCall } from './features/providers/index.js';
import { createMemoryRouter } from './features/memory/index.js';

import { createKVMemoryService } from '../memory/key_value/kv-memory-service';
import { createEpisodicMemoryService } from '../memory/episode/epi-memory-service';
import { createEpiMemorySQLRepo, initializeEpisodeMemoryDB } from '../memory/episode/epi-memory-sql-repo';
import { createKVMemorySQLRepo, initializeKVMemoryDB } from '../memory/key_value/kv-memory-sql-repo';


export const createMemoryComponents = ({ isTesting = false } = {}) => {
  // Initialize databases
  const kvDb = initializeKVMemoryDB(isTesting);
  const epiDb = initializeEpisodeMemoryDB(isTesting);
  // Create repositories
  const kvRepo = createKVMemorySQLRepo(kvDb);
  const epiRepo = createEpiMemorySQLRepo(epiDb);
  // Create services
  const kvService = createKVMemoryService(kvRepo);
  const epiService = createEpisodicMemoryService(epiRepo);

  // Create facade
  const memoryFacade = createMemoryFacade(kvService, epiService);

  // Graceful shutdown function
  const shutdown = () => {
    kvDb.close();
    epiDb.close();
  };

  return { kvDb, epiDb, kvRepo, epiRepo, kvService, epiService, memoryFacade, shutdown };
};

const app = express();
const PORT = process.env.PORT || 3001;

const USER_ID = 'default';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/memory', () => createMemoryRouter(memory, USER_ID));

// Memory functions
const { writeKV, deleteKV, listKV, writeEpisode, recentEpisodes } = memory;


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

const handleMemoryCommand = (command, payload) => {
  if (command === 'remember') {
    const eqSign = payload.indexOf('=');
    if (eqSign > 0) {
      const key = payload.slice(0, eqSign).trim();
      const value = payload.slice(eqSign + 1).trim();
      writeKV(USER_ID, key, value);
      return `Noted: ${key} = ${value}`;
    } else {
      writeEpisode(USER_ID, payload);
      return `Noted!`;
    }
  } else if (command === 'forget') {
    const key = payload.trim();
    deleteKV(USER_ID, key);
    return `Forgot ${key}`;
  } else if (command === 'list') {
    const items = listKV(USER_ID);
    return `Memory items: ${items.map(item => `${item.key}=${item.value}`).join(', ')}`;
  } else {
    return `Unknown command: ${command}`;
  }
};


// Text completion endpoint
app.post('/api/chat/completions', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { messages, model = 'qwen/qwen3-1.7b' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const last = messages[messages.length - 1]?.content?.trim();

    const isMemoryCommand = last && (last.startsWith('/remember') 
      || last.startsWith('/forget') 
      || last.startsWith('/list'));

    if (isMemoryCommand) {
      const command = last.split(' ')[0].slice(1); // remove leading slash
      const payload = last.slice(command.length + 2).trim(); // remove command and space

      const responseText = handleMemoryCommand(command, payload);
      return res.json({ completion: responseText, model, usage: {} });
    }

    const kv = listKV(USER_ID);
    const epi = recentEpisodes(USER_ID, 5);

    const memoryContext = [
      'You know these persistent facts about the user:',
      ...kv.slice(0, 12).map(({key, value}) => `- ${key}: ${value}`),
      epi.length ? 'Recent notes:' : '',
      ...epi.map(({text}) => `- ${text}`)
    ].filter(Boolean).join('\n');

    const CURRENT_TIME = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const CURRENT_DATE = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const CURRENT_DATETIME = `${CURRENT_TIME} of ${CURRENT_DATE}`;

    const MEMORY_PROMPT =  `[Memory]\nYou know these persistent facts about the user:\n${memoryContext}\n\nOnly use this information when asked, or relevant. DO NOT restate!`
    const SYSTEM_PROMPT = `/nothink\n\n The current time is: ${CURRENT_DATETIME}\n\n. You are a helpful assistant. ${MEMORY_PROMPT}`;

    const response = await providerCall({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role || 'user', 
          content: msg.content || msg.text 
        })),
      ],
      max_tokens: -1,
      temperature: 0.7,
      stream: true,
    });


    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to get completion from OpenRouter',
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Extract the completion text
    const completion = data.choices?.[0]?.message?.content || 'No response generated';
    
    res.json({ 
      completion,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Streaming endpoint
app.post('/api/chat/stream', async(req, res) => {
  console.log('Received streaming request:', req.body);
  
  const controller = new AbortController();
  res.on('close', () => {
    console.log('Client disconnected');
    controller.abort();
  });

  res.on('error', (err) => {
    console.log('Request error:', err);
    controller.abort();
  });


  try{
    const { messages, model = 'qwen/qwen3-1.7b' } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    res.set(headers);
    res.writeHead(200, headers);
    
    console.log('Headers sent, starting stream...');

    const writeSSE = (data) => {
      if (res.destroyed) {
        console.log('Cannot write SSE - client disconnected or response destroyed');
        return false;
      }
      try {
        const sseData = `data: ${JSON.stringify(data)}\n\n`;
        res.write(sseData);
        console.log('Wrote SSE data:', JSON.stringify(data));
        return true;
      } catch (error) {
        console.log('Client disconnected during write:', error.message);
        return false;
      }
    };

    const last = messages[messages.length - 1]?.content?.trim();
    const isMemoryCommand = last && (last.startsWith('/remember') 
      || last.startsWith('/forget') 
      || last.startsWith('/list'));

    if (isMemoryCommand) {
      const command = last.split(' ')[0].slice(1);
      const payload = last.slice(command.length + 2).trim();
      const responseText = handleMemoryCommand(command, payload);
      
      writeSSE({
        choices: [{
          delta: { content: responseText },
          finish_reason: 'stop'
        }]
      });
      writeSSE({ choices: [{ finish_reason: 'stop' }] });
      res.end();
      return;
    }

    // Get memory context
    const kv = listKV(USER_ID);
    const epi = recentEpisodes(USER_ID, 5);

    const memoryContext = [
      'You know these persistent facts about the user:',
      ...kv.slice(0, 12).map(({key, value}) => `- ${key}: ${value}`),
      epi.length ? 'Recent notes:' : '',
      ...epi.map(({text}) => `- ${text}`)
    ].filter(Boolean).join('\n');

    const CURRENT_TIME = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const CURRENT_DATE = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const CURRENT_DATETIME = `${CURRENT_TIME} of ${CURRENT_DATE}`;

    const MEMORY_PROMPT =  `[Memory]\nYou know these persistent facts about the user:\n${memoryContext}\n\nOnly use this information when asked, or relevant. DO NOT restate!`
    const SYSTEM_PROMPT = `/nothink\n\n The current time is: ${CURRENT_DATETIME}\n\n. You are a helpful assistant. ${MEMORY_PROMPT}`;

    // Call LLM provider
    const upStream = await providerCall({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role || 'user',
          content: msg.content || msg.text
        })),
      ],
      max_tokens: -1,
      temperature: 0.7,
    }, { signal: controller.signal });

    if (!upStream.ok || !upStream.body) {
      const errorData = await upStream.text() || 'No response body';
      console.error('Provider API error:', errorData);
      writeSSE({ 
        error: { 
          message: 'Failed to get completion from provider',
          details: errorData 
        }
      });
      res.end();
      return;
    }

    // Stream the response
    const reader = upStream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        // Check if client is still connected before reading
        if (controller.signal.aborted) {
          console.log('Client disconnected or request aborted, stopping stream');
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              writeSSE({ choices: [{ finish_reason: 'stop' }] });
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (!writeSSE(parsed)) {
                console.log('Failed to write SSE data, client likely disconnected');
                break;
              }
            } catch (parseError) {
              console.log('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (streamError) {
      if (streamError.name === 'AbortError') {
        console.log('Stream aborted - client disconnected');
      } else {
        console.error('Stream error:', streamError);
        writeSSE({
          error: { 
            message: 'Stream error occurred',
            details: streamError.message 
          }
        });
      }
    } finally {
      try {
        if (reader && !reader.closed) {
          await reader.cancel();
        }
      } catch (e) {
        // Ignore cleanup errors
        console.log('Reader cleanup error (ignore):', e.message);
      }
    }

    res.end();
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request aborted - client disconnected');
    } else {
      console.error('Server error:', error);
      try {
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
          });
        } else {
          res.write(`data: ${JSON.stringify({ 
            error: { 
              message: 'Internal server error',
              details: error.message 
            }
          })}\n\n`);
          res.end();
        }
      } catch (writeError) {
        console.error('Error writing error response:', writeError);
      }
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  Warning: OPENROUTER_API_KEY environment variable not set');
  }
});
