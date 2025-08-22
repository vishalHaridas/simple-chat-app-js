export const createChatService = (chatRepo, isTesting = false) => {
  const createNewChat = (userId, text) => {
  const chatId = chatRepo.createChat(userId);

  //Assumption tied that only a user can create a chat
  chatRepo.createMessage(chatId, text, 'user');
  const lastMessage = chatRepo.getLastMessageOfChat(chatId);
  chatRepo.updateLastMessageTimeOfChat(chatId, lastMessage.created_at);

  const chatDetails = chatRepo.getChatDetails(chatId);
    return {
      id: chatId,
      title: chatDetails.title,
      created_at: chatDetails.created_at,
      last_message_at: chatDetails.last_message_at
    };
  };

  const addChatMessage = (chatId, text, sender) => {
    const messageId = chatRepo.createMessage(chatId, text, sender);
    const lastMessage = chatRepo.getLastMessageOfChat(chatId);
    chatRepo.updateLastMessageTimeOfChat(chatId, lastMessage.created_at);

    return {
      id: messageId,
      chat_id: chatId,
      text,
      sender,
      created_at: lastMessage.created_at
    };
  }

  const getAllMessagesFromChat = (chatId) => {
    return chatRepo.getChatMessagesById(chatId);
  };

  const getAllChats = (userId) => {
    return chatRepo.getAllChats();
  };

  return {
    createNewChat,
    addChatMessage,
    getAllMessagesFromChat,
    getAllChats
  };
};
