import { initializeChatDB, createChatRepository } from '../../chats/chats-repo';
import oneSecondIncrementedTime from '../utils/oneSecondIncrementedTime';

describe('Chats Repository Wrappers', () => {
  let db;
  let repo;

  beforeAll(() => {
    db = initializeChatDB(true);
    repo = createChatRepository(db);
  });

  let timeAfterOneSecond
  beforeEach(() => {
    db.exec('DELETE FROM messages');
    db.exec('DELETE FROM chats');
    timeAfterOneSecond = oneSecondIncrementedTime(new Date());
  });

  afterAll(() => {
    db.close();
  });


  test('createChat returns a numeric ID', () => {
    const chatId = repo.createChat('user1', timeAfterOneSecond());
    expect(typeof chatId).toBe('number');
    expect(chatId).toBeGreaterThan(0);
  });

  test('createMessage returns a numeric ID', () => {
    const chatId = repo.createChat('user1');
    const messageId = repo.createMessage(chatId, 'hello', 'user');
    expect(typeof messageId).toBe('number');
    expect(messageId).toBeGreaterThan(0);
  });

  test('getLastMessageOfChat returns the last message inserted', async () => {
    const chatId = repo.createChat('user1', timeAfterOneSecond());
    repo.createMessage(chatId, 'first', 'bot', timeAfterOneSecond());
    repo.createMessage(chatId, 'second', 'bot', timeAfterOneSecond());
    const lastMessage = repo.getLastMessageOfChat(chatId);
    expect(lastMessage).toMatchObject({ chat_id: chatId, text: 'second', sender: 'bot' });
  });

  test('getChatMessagesById returns all messages for a chat in descending order', async () => {
    const chatId = repo.createChat('user1', timeAfterOneSecond());
    repo.createMessage(chatId, 'one', 'user', timeAfterOneSecond());
    repo.createMessage(chatId, 'two', 'user', timeAfterOneSecond());
    const messages = repo.getChatMessagesById(chatId);
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe('two');
    expect(messages[1].text).toBe('one');
  });

  test('getAllChats returns all chats', () => {
    const chatId1 = repo.createChat('user1', timeAfterOneSecond());
    const chatId2 = repo.createChat('user2', timeAfterOneSecond());
    const chats = repo.getAllChats();
    expect(Array.isArray(chats)).toBe(true);
    expect(chats.map(c => c.id)).toEqual(expect.arrayContaining([chatId1, chatId2]));
  });

  test('updateChatLastMessage updates the last_message_at field', () => {
    const chatId = repo.createChat('user1');
    const timestamp = new Date().toISOString();
    repo.updateLastMessageTimeOfChat(chatId, timestamp);
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    expect(chat.last_message_at).toBe(timestamp);
  });
});