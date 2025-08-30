import { unwrapErr } from '../../utils/result.js';
import createSSEWriter from '../../utils/sseWriter.js';

export default async (completionService, req, res) => {

  const sseWriter = createSSEWriter(res);

  sseWriter.setupHeaders();

  const { model, messages } = req.body;
  if (!model || !messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid request body. "model" and "messages" are required.' });
    return;
  }

  const lastMessage = messages[messages.length -1];

  if (lastMessage?.content?.startsWith('/')) {
    const memoryResult = completionService.handleMemory(lastMessage.content);
    console.log(`Memory command result (in handler): ${JSON.stringify(memoryResult)}`);
    if (memoryResult.ok){
      sseWriter.writeMessageToOpenAIFormat(memoryResult.value.message);
      sseWriter.endStream();
      return;
    } else {
      sseWriter.writeError({ error: memoryResult.error, message: unwrapErr(memoryResult), done: true });
      sseWriter.endStream();
      return;
    }
  }

  const controller = new AbortController();

  res.on('close', () => {
    controller.abort();
  });

  const providerResult = await completionService.handleProviderCall(model, messages, controller);
  if (!providerResult.ok){
    sseWriter.writeError({ error: providerResult.error, message: unwrapErr(providerResult), done: true });
    return sseWriter.endStream();
  }

  const upStream = providerResult.value;

  const reader = upStream.body.getReader();

  while (true) { // Ooooh scary!
    const llmSSWriterResult = await sseWriter.writeLLMStream(reader);
    if (!llmSSWriterResult.ok){
      console.error('Error writing to SSE:', unwrapErr(llmSSWriterResult));
      break;
    }
  }

  sseWriter.endStream();
}