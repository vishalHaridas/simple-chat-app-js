import { Ok, Err, assumeOk } from "../../utils/result.js";

export default (memoryFacade, provider, USER_ID) => {
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

  return { handleMemory, handleProviderCall };
};
