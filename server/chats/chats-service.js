/***
 * @file chats-service.js
 * @description Service layer for handling chat-related operations.
 * This layer interacts with the chat repository to perform CRUD operations on chats and messages.
***/
export const createChatService = (chatRepo) => {
	const createNewChat = (userId, text, createdAt) => {
		const createdAtValue = createdAt || new Date().toISOString();
		const chatId = chatRepo.createChat(userId, createdAtValue);

		//Assumption tied that only a user can create a chat
		chatRepo.createMessage(chatId, text, 'user', createdAtValue);
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
	
	const addChatMessage = (chatId, text, sender, createdAt) => {
		const createdAtValue = createdAt || new Date().toISOString();

		const messageId = chatRepo.createMessage(chatId, text, sender, createdAtValue);
		chatRepo.updateLastMessageTimeOfChat(chatId, createdAtValue);

		const lastMessageDetails = chatRepo.getLastMessageOfChat(chatId);

		return {
			id: messageId,
			chat_id: chatId,
			text: lastMessageDetails.text,
			sender: lastMessageDetails.sender,
			created_at: lastMessageDetails.created_at
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
