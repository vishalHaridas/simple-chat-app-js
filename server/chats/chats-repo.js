import Database from "better-sqlite3";

export const createChatRepository = (db) => {
  const insertChat = db.prepare(`
    INSERT INTO chats(title, user_id) VALUES (@title, @user_id)
  `);

  const insertChatWithTime = db.prepare(`
    INSERT INTO chats(title, user_id, created_at) VALUES (@title, @user_id, @created_at)
  `);

  const insertMessage = db.prepare(`
    INSERT INTO messages(chat_id, text, sender) VALUES (@chat_id, @text, @sender)
  `);
  
  const insertMessageWithTime = db.prepare(`
    INSERT INTO messages(chat_id, text, sender, created_at) VALUES (@chat_id, @text, @sender, @created_at)
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

  const getChatDetailsById = db.prepare(`
    SELECT * FROM chats WHERE id = ?
  `);


  const createChat = (userId, createdAt) => {
    const dateTime = createdAt || Date.now();
    // should be Chat @ 7:57PM on 20 Aug 2025
    const formattedDate = dateTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    const generatedTitle = `Chat @ ${formattedDate}`;

    const result = createdAt 
      ? insertChatWithTime.run({ title: generatedTitle, user_id: userId, created_at: createdAt }) 
      : insertChat.run({ title: generatedTitle, user_id: userId });

    return result.lastInsertRowid; 
  };

  const createMessage = (chatId, text, sender, createdAt) => {
    const result = createdAt 
      ? insertMessageWithTime.run({ chat_id: chatId, text, sender, created_at: createdAt }) 
      : insertMessage.run({ chat_id: chatId, text, sender });

    return result.lastInsertRowid;
  };

  const getChatDetails = (chatId) => {
    return getChatDetailsById.get(chatId);
  };

  const getLastMessageOfChat = (chatId) => {
    return getLastMessageFromChat.get(chatId);
  };

  const updateLastMessageTimeOfChat = (chatId, last_message_at_value) => {
    updateChatLastMessageTime.run(last_message_at_value, chatId);
  };

  const getChatMessagesById = (chatId) => {
    return getNewestSortedChatMessagesById.all(chatId);
  };

  const getAllChats = () => {
    return getAllChatsByNewestMessageFirst.all();
  };
  
  return { 
    createChat,
    createMessage,
    getLastMessageOfChat,
    updateLastMessageTimeOfChat,
    getChatMessagesById,
    getAllChats,
    getChatDetails
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