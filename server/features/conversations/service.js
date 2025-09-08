import { Ok, Err, assumeOk } from "../../utils/result.js";

export default (memoryFacade, provider, chatsService, USER_ID) => {
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
    if (!slashCommandParseResult.ok) {
      return slashCommandParseResult; // which is an err
    }

    const { command, payload } = slashCommandParseResult.value;

    const memoryExecResult = memoryFacade.executeCommand(
      USER_ID,
      command,
      payload
    );
    if (!memoryExecResult.ok) {
      return memoryExecResult; // which is an err
    }

    console.log(`Memory command executed: ${JSON.stringify(memoryExecResult)}`);

    return memoryExecResult; // Ok(value: {message: "..."})
  };

  // build system prompt with memory
  const buildSystemPromptWithMemory = () => {
    const kvResult = memoryFacade.listKV(USER_ID);
    const epiResult = memoryFacade.recentEpisodes(USER_ID, 5);

    const kv = kvResult.ok ? kvResult.value : [];
    const epi = epiResult.ok ? epiResult.value : [];

    // Can be moved to service: buildMemoryContext
    const memoryContext = [
      ...kv.slice(0, 12).map(({ key, value }) => `- ${key}: ${value}`),
      epi.length ? "Recent notes:" : "",
      ...epi.map(({ text }) => `- ${text}`),
    ]
      .filter(Boolean)
      .join("\n");

    const CURRENT_TIME = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const CURRENT_DATE = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const CURRENT_DATETIME = `${CURRENT_TIME} of ${CURRENT_DATE}`;
    const MEMORY_PROMPT = `[Memory]\nYou know these persistent facts about the user:\n${memoryContext}\n\nOnly use this information when asked, or relevant. DO NOT restate!`;
    const SYSTEM_PROMPT = `/nothink\n\n The current time is: ${CURRENT_DATETIME}\n\n. You are a helpful assistant. ${MEMORY_PROMPT}`;
    return Ok(SYSTEM_PROMPT);
  };

  const parseProviderResponseReader = (value) => {
    // {"choices":[{"delta":{"content":"!"},"finish_reason":null}]}
    // {"choices":[{"delta":{},"finish_reason":"stop"}]}

    // data: {"choices":[{"delta":{"content":" by"},"finish_reason":null}]}
    console.log("going to parse", value);
    if (value === "[DONE]" || value === "end") return "";
    let parsedText = "";
    try {
      console.log("starting try");
      if (!value) {
        console.log("returning as there is no value");
        return "";
      }
      console.log("does value start with data? ", value.startsWith("data: "));
      if (value.startsWith("data: ")) {
        console.log("value starts with data!");
        const jsonStr = value.replace("data: ", "").trim();
        if (jsonStr === "[DONE]") {
          return "";
        }
        console.log("after trimming data: ", jsonStr);
        const data = JSON.parse(jsonStr);
        const content = data.choices[0].delta.content;
        console.log("content:", content);
        const finishReason = data.choices[0].finish_reason;
        console.log("finish reason :", finishReason);

        if (content) {
          parsedText += content;
        }

        if (finishReason === "stop") {
          return parsedText;
        }
      }
      return parsedText;
    } catch (err) {
      console.error("Error parsin chunk", err);
      return Err("parse_err", "Error parsing chunk" + err);
    }
  };

  // call provider
  const handleProviderCall = async (
    model = "qwen/qwen3-1.7b",
    messages,
    controller
  ) => {
    const SYSTEM_PROMPT = assumeOk(buildSystemPromptWithMemory());

    console.log(`using model ${model}`);

    const upStream = await provider(
      {
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((msg) => ({
            role: msg.role || "user",
            content: msg.content || msg.text,
          })),
        ],
        max_tokens: -1,
        temperature: 0.7,
      },
      { signal: controller.signal }
    );

    // Stream response back to Handler
    if (!upStream.ok || !upStream.body) {
      const errorData = (await upStream.text()) || "No response body";
      console.error("Provider API error:", errorData);
      return Err(
        "provider_error",
        `Failed to get completion from provider: ${errorData}`
      );
    }

    return Ok(upStream);
  };

  const addAssistantMessageToChat = (chatId, text, createdAt) => {
    const createdAtValue = createdAt || new Date().toISOString();

    const messageId = chatsService.addChatMessage(
      chatId,
      text,
      "assistant",
      createdAtValue
    );
    return Ok(messageId);
  };

  return {
    handleMemory,
    handleProviderCall,
    addAssistantMessageToChat,
    parseProviderResponseReader,
  };
};
