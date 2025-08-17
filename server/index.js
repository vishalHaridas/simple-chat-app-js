import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import memory from './memory.js';
import { providerCall } from './llm/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

const USER_ID = 'default';

// Middleware
app.use(cors());
app.use(express.json());

// Memory functions
const { writeKV, deleteKV, listKV, writeEpisode, recentEpisodes } = memory;


//memory endpoints
app.post('/api/memory/remember', (req, res) => {
  const { key, value, text } = req.body;

  try {
    if (key && value != null) {
      writeKV(USER_ID, key, value);
      return res.json({ status: 'OK', type: 'kv' });
    } 
    if (text && typeof text === 'string' && text.trim() && text.length > 0) {
      writeEpisode(USER_ID, text);
      return res.json({ status: 'OK', type: 'epi' });
    }
    res.status(400).json({ error: 'Invalid request, provide key/value or text' });
  } catch (error) {
    console.error('Memory write error:', error);
    res.status(500).json({ error: 'Failed to write memory', message: error.message });
  }
});

app.post('/api/memory/forget', (req, res) => {
  const { key } = req.body || {};
  try {
    if (!key) {
      return res.status(400).json({ error: 'Key is required to forget' });
    }
    deleteKV(USER_ID, key);
    res.json({ status: 'OK' });
  } catch (error) {
    console.error('Memory delete error:', error);
    res.status(500).json({ error: 'Failed to delete memory', message: error.message });
  }
});

app.get('/api/memory/list', (req, res) => {
  try {
    const items = listKV(USER_ID);
    res.json({ items });
  } catch (error) {
    console.error('Memory list error:', error);
    res.status(500).json({ error: 'Failed to list memory', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'OK', message: 'LLM Chat Server is running' });
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
    const { messages, model = 'openai/gpt-oss-20b:free' } = req.body;

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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  Warning: OPENROUTER_API_KEY environment variable not set');
  }
});
