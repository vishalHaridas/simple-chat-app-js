import { unwrapErr } from "../../utils/result.js";
import createSSEWriter from "../../utils/sseWriter.js";

export default async (completionService, req, res) => {
  const sseWriter = createSSEWriter(res);

  const reqBody = req.body;
  let model = undefined;
  let messages = undefined;
  let chatID = undefined;
  if (reqBody) {
    // model = reqBody.model || undefined;
    messages = reqBody.messages;
    chatID = reqBody.chat_id;
  }
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({
      error: 'Invalid request body. "model" and "messages" are required.',
    });
    return;
  }

  sseWriter.setupHeaders();

  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.content?.startsWith("/")) {
    const memoryResult = completionService.handleMemory(lastMessage.content);
    console.log(
      `Memory command result (in handler): ${JSON.stringify(memoryResult)}`
    );
    if (memoryResult.ok) {
      sseWriter.writeMessageToOpenAIFormat(memoryResult.value.message);
      sseWriter.endStream();
      return;
    } else {
      sseWriter.writeError({
        error: memoryResult.error,
        message: unwrapErr(memoryResult),
        done: true,
      });
      sseWriter.endStream();
      return;
    }
  }

  const controller = new AbortController();

  res.on("close", () => {
    controller.abort();
  });

  const providerResult = await completionService.handleProviderCall(
    model,
    messages,
    controller
  );
  if (!providerResult.ok) {
    sseWriter.writeError({
      error: providerResult.error,
      message: unwrapErr(providerResult),
      done: true,
    });
    return sseWriter.endStream();
  }

  const upStream = providerResult.value;

  const reader = upStream.body.getReader();

  let result = "";
  console.log("Going to start sending stream");
  while (true) {
    // Ooooh scary!
    const { value, done: readerDone } = await reader.read();
    const chunk = new TextDecoder("utf-8").decode(value);
    console.log("Decoded chunk value: ", chunk);
    const parsedReaderValue =
      completionService.parseProviderResponseReader(chunk);
    const llmSSWriterResult = await sseWriter.writeLLMStream(
      parsedReaderValue,
      readerDone
    );
    result += llmSSWriterResult.value.result;
    if (!llmSSWriterResult.ok) {
      console.error("Error writing to SSE:", unwrapErr(llmSSWriterResult));
      break;
    }
    if (llmSSWriterResult.value.done) {
      break;
    }
  }

  console.log("GOING TO ADD ASSISTANT MESSAGE TO CHAT!!!!");
  completionService.addAssistantMessageToChat(
    chatID,
    result,
    new Date().toISOString()
  );

  sseWriter.endStream();
};
