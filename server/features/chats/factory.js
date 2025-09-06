import { initializeChatDB, createChatRepository } from "./chats-repo.js";
import { createChatService } from "./chats-service.js";

import { tryCatchSync } from "../../utils/result.js";

export default ({ isTesting = false } = {}) => {
  const chatDB = initializeChatDB(isTesting);
  const chatRepo = createChatRepository(chatDB);
  const chatService = createChatService(chatRepo);

  const shutdown = () => {
    const chatServiceShutdownResult = tryCatchSync(chatDB.close());
    return [chatServiceShutdownResult];
  };

  return { chatService, shutdown };
};
