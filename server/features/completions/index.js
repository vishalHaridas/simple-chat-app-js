import e, { Router } from 'express';
import { createMemoryFacade } from '../memory/command';

import { Ok, Err, unwrapErr } from '../../utils/result';

export const createConversationsService = (memoryComponentOptions, provider) => {
  const memoryComponents = createMemoryComponents(memoryComponentOptions);
  const { memoryFacade } = memoryComponents;
  // Use memoryFacade within conversations service as needed


  return {
    memoryFacade,
    memoryShutdown: memoryComponents.shutdown,
    provider,
  };

};

const buildSystemPrompt = (memoryFacade, USER_ID) => {
  const kv = memoryFacade.listKV(USER_ID);
  const epi = memoryFacade.recentEpisodes(USER_ID, 5);

  const memoryContext = [
    ...kv.slice(0, 12).map(({key, value}) => `- ${key}: ${value}`),
    epi.length ? 'Recent notes:' : '',
    ...epi.map(({text}) => `- ${text}`)
  ].filter(Boolean).join('\n');

  const CURRENT_TIME = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const CURRENT_DATE = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const CURRENT_DATETIME = `${CURRENT_TIME} of ${CURRENT_DATE}`;
  const MEMORY_PROMPT =  `[Memory]\nYou know these persistent facts about the user:\n${memoryContext}\n\nOnly use this information when asked, or relevant. DO NOT restate!`
  const SYSTEM_PROMPT = `/nothink\n\n The current time is: ${CURRENT_DATETIME}\n\n. You are a helpful assistant. ${MEMORY_PROMPT}`;
  return SYSTEM_PROMPT;
};

// Request will use SSE
export const conversationsHandler = async (completionService, USER_ID, req, res) => {
  const { memoryFacade, provider } = completionService;
  const { messages, model='qwen/qwen3-1.7b' } = req.body;

  // Setup controller to handle client disconnects
  const controller = new AbortController();
  res.on('close', () => {
    console.log('Client disconnected, aborting provider call');
    controller.abort();
  });

  res.on('error', (err) => {
    console.error('Response error:', err);
    controller.abort();
  });

  if (controller.signal.aborted) {
    console.log('Request aborted before processing');
    if (!res.headersSent) {
      res.status(499).json({
        error: 'Client closed request',
        message: 'The client closed the connection before the request could be processed.'
      });
    } else {
      console.log('Headers already sent, cannot send 499 response');
    }
    return;
  }

  // Basic validation
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  // defining SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Sending initial headers
  // This is done to establish the SSE connection
  res.writeHead(200, headers);

  // Util function to send SSE data
  const writeSSE = (data) => {
    // check if response is still writable
    if (res.destroyed){
      console.log('Response destroyed, cannot write SSE');
      return false;
    }
    try {
      const sseData = `data: ${JSON.stringify(data)}\n\n`;
      res.write(sseData);
      return true;
    } catch (error) {
      console.error('Error writing SSE:', error);
      return false;
    }
  };

  /* MEMORY COMMAND HANDLING */
  // check if last message is a memory command
  const slashCommand = memoryFacade.parseSlashCommand(messages[messages.length - 1].content?.trim());
  
  // process memory command if present
  let couldProcessMemoryCommand = true;
  if (slashCommand) {
    const { command, payload } = slashCommand.value;
    const commandResult = memoryFacade.executeCommand(USER_ID, command, payload);
    if (!commandResult.isOk()) {
      couldProcessMemoryCommand = false;
      console.error('Error processing memory command:', unwrapErr(commandResult));
    }

    const responseText = couldProcessMemoryCommand ? assumeOk(commandResult) : commandResult.unwrapErr();
    writeSSE({
      choices: [{
        delta: { content: responseText, role: 'assistant' },
        finish_reason: 'stop',
      }]
    });
    return res.end();
  }

  // build system prompt with memory if applicable
  const SYSTEM_PROMPT = buildSystemPrompt(memoryFacade, USER_ID);

  // Call provider API
  const upstream = await provider.call({
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
  }, {signal: controller.signal});

  // Handle provider response
  if (!upstream.ok || !upstream.body) {
    const errorData = await upstream.text() || 'No response body';
    console.error('Provider API error:', errorData);
    writeSSE({ error: 'Failed to get completion from provider', details: errorData });
    return res.end();
  }

  // Stream the response
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';



  try {
    while (true) {
      if (controller.signal.aborted) {
        console.log('Client disconnected, stopping stream');
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        const data = line.slice(6).trim(); // remove "data: "
        if (data === '[DONE]') {
          writeSSE({ choices: [{ delta: {}, finish_reason: 'stop' }] });
          return res.end();
        }
        try {
          const parsed = JSON.parse(data);
          if (!writeSSE(parsed)) {
            console.log('Failed to write SSE, stopping stream');
            controller.abort(); // added, potentially a bug?
            break;
          }
        } catch (parsingError) {
          console.error('Error parsing stream data:', parsingError, data);
        }
      }
    }
  } catch (streamError) {
    if (streamError.name === 'AbortError') {
      console.log('Stream aborted');
    } else {
      console.error('Stream error:', streamError);
      writeSSE({ error: 'Error during streaming', details: streamError.message });
    }
  } 
};

export default function createConversationsRouter(USER_ID) {
  const router = Router();

  router.post('/conversations/stream', (req, res) => conversationsHandler(USER_ID, req, res));

  return router;
}

