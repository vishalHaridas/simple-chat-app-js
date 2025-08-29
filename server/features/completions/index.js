import { Router } from 'express';

import { Ok, Err, unwrapErr, assumeOk } from '../../utils/result.js';


export const createConversationsService = (memoryFacade, provider, USER_ID) => {

  // handle memory command
  /**
   * Handles a memory command message.
   * @param {string} message 
   * @returns {Result} Result object with message or error.
   * @example
   * const result = handleMemoryCommand(message); // message is a string like "/remember key=value"');
   * if (result.ok){
   *  // write value and close sse if memory command 
   * }
   * // else continue with normal flow
   */
  const handleMemory = (message) => {
    const slashCommandParseResult = memoryFacade.parseSlashCommand(message);
    if (!slashCommandParseResult.ok){
      return slashCommandParseResult // which is an err
    }

    const { command, payload } = slashCommandParseResult.value

    const memoryExecResult = memoryFacade.executeCommand(USER_ID, command, payload)
    if (!memoryExecResult.ok){
      return memoryExecResult  // which is an err
    }

    return memoryExecResult // Ok(value: {message: "..."})
  }

  // build system prompt with memory
  const buildSystemPromptWithMemory = () => {
    const kvResult = memoryFacade.listKV(USER_ID);
    const epiResult = memoryFacade.recentEpisodes(USER_ID, 5);

    const kv = kvResult.ok ? kvResult.value : [];
    const epi = epiResult.ok ? epiResult.value : [];

    // Can be moved to service: buildMemoryContext
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
    return Ok(SYSTEM_PROMPT);
  };

  // call provider
  const handleProviderCall = async (model, messages, controller) => {

    const SYSTEM_PROMPT = assumeOk(buildSystemPromptWithMemory());

    const upStream = await provider({
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

    // Stream response back to Handler
    if (!upStream.ok || !upStream.body) {
      const errorData = await upStream.text() || 'No response body';
      console.error('Provider API error:', errorData);
      return Err('provider_error', `Failed to get completion from provider: ${errorData}`);
    }

    console.log(`sending stream to handler in ${JSON.stringify(Ok(upStream))}`);
    return Ok(upStream);
  }

  return { handleMemory, handleProviderCall };
};

// Request will use SSE
export const createConversationsHandler = async (completionService, req, res) => {

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  const { model, messages } = req.body;
  if (!model || !messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid request body. "model" and "messages" are required.' });
    return;
  }

  // Check for memory command in the last message only
  const lastMessage = messages[messages.length -1];
  if (lastMessage?.content?.startsWith('/')) {
    const memoryResult = completionService.handleMemory(lastMessage.content);
    if (memoryResult.ok){
      // write value and close sse if memory command 
      res.write(`data: ${JSON.stringify({ message: memoryResult.value.message, done: true })}\n\n`);
      res.end();
      return;
    } else {
      // send error message and close sse
      res.write(`data: ${JSON.stringify({ error: memoryResult.error, message: unwrapErr(memoryResult), done: true })}\n\n`);
      res.end();
      return;
    }
  }

  const controller = new AbortController();

  res.on('close', () => {
    controller.abort();
  });

  const providerResult = await completionService.handleProviderCall(model, messages, controller);
  if (!providerResult.ok){
    res.write(`data: ${JSON.stringify({ error: providerResult.error, message: unwrapErr(providerResult), done: true })}\n\n`);
    res.end();
    return;
  }

  const upStream = providerResult.value;

  const reader = upStream.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let done = false;

  while (!done) {
    try {
      const { value, done: readerDone } = await reader.read();
      if (readerDone) break;
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });
      // Forward chunk to client
      res.write(chunk);
    } catch (error) {
      console.error('Error reading from provider stream:', error);
      res.write(`data: ${JSON.stringify({ error: 'stream_error', message: 'Error reading from provider stream', done: true })}\n\n`);
      break;
    }
  }

  res.end();
}

export default function createConversationsRouter(conversationService, USER_ID) {
  const router = Router();

  router.post('/stream', (req, res) => createConversationsHandler(conversationService, req, res));

  return router;
}

