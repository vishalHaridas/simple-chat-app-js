import { Ok, Err } from "./result.js";

export default (res) => {
  const writeSSE = (data) => {
    if (res.destroyed) {
      console.warn(
        "Cannot write SSE - client disconnected or response destroyed"
      );
      return Err("write_error", "Failed to write SSE chunk");
    }
    try {
      console.log("SENDING SSE DATA OFF: ", data);
      res.write(data);
      return Ok();
    } catch (error) {
      console.error("Client disconnected during write:", error.message);
      return Err("write_error", "Failed to write SSE chunk");
    }
  };

  const setupHeaders = () => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Allow-Control-Allow-Origin": "*",
    });
    res.flushHeaders();
    writeSSE(":\n\n");
    return Ok();
  };

  const writeLLMStream = async (value, readerDone) => {
    if (readerDone) {
      return Ok({ done: true, result: "" });
    }
    console.log(`going to write chunk: ${value}`);
    writeSSE(value);
    return Ok({ done: false, result: value });
  };

  const writeError = (error) => {
    writeSSE(`data: ${JSON.stringify({ error })}\n\n`);
  };

  const endStream = () => {
    writeSSE("data: end\n\n");
    res.end();
  };

  const writeMessageToOpenAIFormat = (message, finish_reason = null) => {
    const sseData = {
      choices: [
        {
          delta: { content: message },
          finish_reason,
        },
      ],
    };
    writeSSE(`data: ${JSON.stringify(sseData)}\n\n`);
  };

  return {
    setupHeaders,
    writeLLMStream,
    writeError,
    endStream,
    writeMessageToOpenAIFormat,
  };
};
