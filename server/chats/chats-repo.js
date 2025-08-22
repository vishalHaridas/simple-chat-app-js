import Database from "better-sqlite3";

export const createChatRepository = (db) => {
  const insertChat = db.prepare(`
    INSERT INTO chats(title, user_id) VALUES (@title, @user_id)
  `);

  const insertMessage = db.prepare(`
    INSERT INTO messages(chat_id, text, sender) VALUES (@chat_id, @text, @sender)
  `);

  const getLastMessageFromChat = db.prepare(`
    SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1
  `);

  const updateChatLastMessageTime = db.prepare(`
    UPDATE chats SET last_message_at = ? WHERE id = ?
  `);

  const getNewestSortedChatMessagesById = db.prepare(`
    SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC
  `);

  const getAllChatsByNewestMessageFirst = db.prepare(`
    SELECT * FROM chats ORDER BY last_message_at DESC
  `);


  const createChat = (userId) => {
    const dateTime = Date.now();
    // should be Chat @ 7:57PM on 20 Aug 2025
    const formattedDate = new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    const generatedTitle = `Chat @ ${formattedDate}`;
    const result = insertChat.run({ title: generatedTitle, user_id: userId });
    return result.lastInsertRowid; 
  };

  const getLastMessageOfChat = (chatId) => {
    return getLastMessageFromChat.get(chatId);
  };

  const updateChatLastMessage = (chatId, last_message_at_value) => {
    updateChatLastMessageTime.run(last_message_at_value, chatId);
  };

  const getChatMessagesById = (chatId) => {
    return getNewestSortedChatMessagesById.all(chatId);
  };

  const getAllChats = () => {
    return getAllChatsByNewestMessageFirst.all();
  };


  const addMessageToChat = (chatId, text, sender) => {
    insertMessage.run({ chat_id: chatId, text, sender });
    const lastMessage = getLastMessageOfChat(chatId);
    if (lastMessage) {
      updateChatLastMessage(chatId, lastMessage.created_at);
    }
  };

  const createChatWithMessage = (userId, text, sender) => {
    const chatId = createChat(userId);
    addMessageToChat(chatId, text, sender);

    return chatId;
  };

  return { 
    createChatWithMessage,
    addMessageToChat,
    getAllChats,
    getChatMessagesById,
  };
};

export const initializeChatDB = (isTesting = false) => {
  const dbName = isTesting ? ':memory:' : 'chats.db';
  const db = new Database(dbName);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_message_at DATETIME 
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      sender TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    return db;
};