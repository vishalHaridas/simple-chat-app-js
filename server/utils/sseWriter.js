import { Ok, Err } from './result.js';

export default (res) => {
  const writeSSE = (data) => {
    if (res.destroyed) {
      console.warn('Cannot write SSE - client disconnected or response destroyed');
      return Err('write_error', 'Failed to write SSE chunk');
    }
    try {
      res.write(data);
      return Ok();
    } catch (error) {
      console.error('Client disconnected during write:', error.message);
      return Err('write_error', 'Failed to write SSE chunk');
    }
  };
  const setupHeaders = () => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.flushHeaders();
    writeSSE(':\n\n');
    return Ok();
  };

  const writeLLMStream = async (reader) => {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) return Ok();
    const chunk = new TextDecoder('utf-8').decode(value);
    return writeSSE(chunk);
  };

  const writeError = (error) => {
    writeSSE(`data: ${JSON.stringify({ error })}\n\n`);
  };

  const endStream = () => {
    writeSSE('event: end\n\n');
    res.end();
  };

  const writeMessageToOpenAIFormat = (message, finish_reason = null) => {
    const sseData = {
      choices: [{
        delta: { content: message },
        finish_reason
      }]
    }
    writeSSE(`data: ${JSON.stringify(sseData)}\n\n`);
  };

  return { setupHeaders, writeLLMStream, writeError, endStream, writeMessageToOpenAIFormat };
}