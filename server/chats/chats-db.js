import Database from "better-sqlite3";

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

  return {
    insertChat,
    insertMessage,

    updateChatLastMessageTime,

    getAllChatsByNewestMessageFirst,
    getLastMessageFromChat,
    getNewestSortedChatMessagesById,
  
    db,
  };
};


const createChat = (dbInsertChat, userId) => {
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
  const result = dbInsertChat.run({ title: generatedTitle, user_id: userId });
  return result.lastInsertRowid; 
};

const getLastMessageOfChat = (dbGetLastMessageFromChat, chatId) => {
  return dbGetLastMessageFromChat.get(chatId);
};

const updateChatLastMessage = (dbUpdateChatLastMessage, chatId, last_message_at_value) => {
  dbUpdateChatLastMessage.run(last_message_at_value, chatId);
};

export const getChatMessagesById = (getNewestSortedChatMessagesById, chatId) => {
  return getNewestSortedChatMessagesById.all(chatId);
};

export const getAllChats = (dbGetAllChats) => {
  return dbGetAllChats.all();
};


export const addMessageToChat = (dbInsertMessage, dbGetLastMessageFromChat, dbUpdateChatLastMessage, chatId, text, sender) => {
  dbInsertMessage.run({ chat_id: chatId, text, sender });
  const lastMessage = getLastMessageOfChat(dbGetLastMessageFromChat, chatId);
  if (lastMessage) {
    updateChatLastMessage(dbUpdateChatLastMessage, chatId, lastMessage.created_at);
  }
};

export const createChatWithMessage = ({
  dbInsertChat, 
  dbInsertMessage,
  dbGetLastMessageFromChat, 
  dbUpdateChatLastMessage 
}, userId, text, sender) => {
  const chatId = createChat(dbInsertChat, userId);
  addMessageToChat(dbInsertMessage, dbGetLastMessageFromChat, dbUpdateChatLastMessage, chatId, text, sender);

  return chatId;
};
