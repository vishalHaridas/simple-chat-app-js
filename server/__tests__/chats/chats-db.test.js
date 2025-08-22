import { initializeChatDB, 
  addMessageToChat,
  getAllChats,
  getChatMessagesById,
  createChatWithMessage } from '../../chats/chats-db';

describe('Chats DB', () => {

  const userId = 'test_user';
  let dbDeps;
  let dbInx;
  let createChatDbDeps;
  beforeAll(() => {
    dbDeps = initializeChatDB(isTesting = true);
    dbInx = dbDeps.db;

    createChatDbDeps = {
      dbInsertChat: dbDeps.insertChat,
      dbInsertMessage: dbDeps.insertMessage,
      dbGetLastMessageFromChat: dbDeps.getLastMessageFromChat,
      dbUpdateChatLastMessage: dbDeps.updateChatLastMessageTime,
    }
  });

  beforeEach(() => {
    dbInx.exec('DELETE FROM chats');
    dbInx.exec('DELETE FROM messages');
  });

  afterAll(() => {
    dbInx.close();
  });



  it('should create a new chat properly', async () => {
    const TextMessage = 'Hello, this is a test message';
    const chatId = createChatWithMessage({...createChatDbDeps}, userId, TextMessage, 'user');
    expect(chatId).toBeDefined();

    const chat = dbInx.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    expect(chat).toBeDefined();

    const lastMessage = dbInx.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1').get(chatId);
    expect(lastMessage).toBeDefined();
    expect(lastMessage.text).toBe(TextMessage);

    expect(chat.user_id).toBe(userId);
    expect(chat.title).toMatch(/Chat @/);
    expect(chat.created_at).toBeDefined();
    expect(chat.last_message_at).toBe(lastMessage.created_at);
  });

  it('should get the messages from a chat', async () => {
    const TextMessage1 = 'First message';
    const TextMessage2 = 'Second message';
    const TextMessage3 = 'Third message';

    const chatId = createChatWithMessage({...createChatDbDeps}, userId, TextMessage1, 'user');
    addMessageToChat(dbDeps.insertMessage, dbDeps.getLastMessageFromChat, dbDeps.updateChatLastMessageTime, chatId, TextMessage2, 'user');
    addMessageToChat(dbDeps.insertMessage, dbDeps.getLastMessageFromChat, dbDeps.updateChatLastMessageTime, chatId, TextMessage3, 'user');

    const messages = getChatMessagesById(dbDeps.getNewestSortedChatMessagesById, chatId);
    expect(messages).toBeDefined();
    expect(messages.length).toBe(3);
    expect(messages[0].text).toBe(TextMessage1);
    expect(messages[1].text).toBe(TextMessage2);
    expect(messages[2].text).toBe(TextMessage3);
  });

  it('should get the list of all chats in descending order', async () => {
    const chatId1 = createChatWithMessage({...createChatDbDeps}, userId, 'First chat message', 'user');
    //delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));
    const chatId2 = createChatWithMessage({...createChatDbDeps}, userId, 'Second chat message', 'user');

    const chats = getAllChats(dbDeps.getAllChatsByNewestMessageFirst);
    expect(chats).toBeDefined();
    expect(chats.length).toBe(2);
    expect(chats[0].id).toBe(chatId2);
    expect(chats[1].id).toBe(chatId1);
  });

  it('should get the list of all chats in descending order after adding messages', async () => {
    const chatId1 = createChatWithMessage({...createChatDbDeps}, userId, 'First chat message', 'user');
    //delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));
    const chatId2 = createChatWithMessage({...createChatDbDeps}, userId, 'Second chat message', 'user');

    // Add a new message to the first chat to update its last_message_at
    await new Promise(resolve => setTimeout(resolve, 1000));
    addMessageToChat(dbDeps.insertMessage, dbDeps.getLastMessageFromChat, dbDeps.updateChatLastMessageTime, chatId1, 'New message in first chat', 'user');

    const chats = getAllChats(dbDeps.getAllChatsByNewestMessageFirst);
    expect(chats).toBeDefined();
    expect(chats.length).toBe(2);
    expect(chats[0].id).toBe(chatId1); // First chat should now be first
    expect(chats[1].id).toBe(chatId2);
  });
});