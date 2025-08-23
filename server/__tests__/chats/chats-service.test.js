import { createChatService } from '../../features/chats/chats-service';
import { initializeChatDB, createChatRepository } from '../../features/chats/chats-repo';  
import oneSecondIncrementedTime from '../utils/oneSecondIncrementedTime';

describe('Chats Service', () => {

  const userId = 'test_user';
  let chatService;
  let db;
  beforeAll(() => {
    db = initializeChatDB(true);
    const chatRepo = createChatRepository(db);
    chatService = createChatService(chatRepo, isTesting = true);
  });

  let timeAfterOneSecond;
  beforeEach(() => {
    db.exec('DELETE FROM messages');
    db.exec('DELETE FROM chats');

    timeAfterOneSecond = oneSecondIncrementedTime(new Date());
  });

  it('should insert a chat for a user', () => {
    const firstMessage = 'Hello, this is a test chat!';
    const chat = chatService.createNewChat(userId, firstMessage, timeAfterOneSecond());

    expect(chat).toHaveProperty('title');
    expect(chat).toHaveProperty('created_at');
    expect(chat).toHaveProperty('last_message_at');

    // Verify that the message was created in the database
    const message = db.prepare('SELECT * FROM messages WHERE chat_id = ?').get(chat.id);
    expect(message).toBeDefined();
    expect(message.text).toBe(firstMessage);
    expect(message.sender).toBe('user');

    // Verify that the chat's last message time was updated
    const chatDetails = db.prepare('SELECT * FROM chats WHERE id = ?').get(chat.id);
    expect(chatDetails).toBeDefined();
    expect(chatDetails.last_message_at).toBe(chat.last_message_at);


    // Verify the shape of the chat object
    expect(chat).toEqual({
      id: expect.any(Number),
      title: expect.stringMatching(/Chat @/),
      created_at: expect.any(String),
      last_message_at: expect.any(String)
    });
  });

  it('should add a message to an existing chat', async () => {
    const firstMessage = 'Hello, this is a test chat!';
    const chat = chatService.createNewChat(userId, firstMessage, timeAfterOneSecond());
    const secondMessage = 'This is a follow-up message.';
    
    // Add a new message to the existing chat
    const addedMessage = chatService.addChatMessage(chat.id, secondMessage, 'user', timeAfterOneSecond());

    expect(addedMessage).toBeDefined();
    expect(addedMessage.text).toBe(secondMessage);
    expect(addedMessage.sender).toBe('user');

    // Verify that the last message time was updated
    const updatedChatDetails = db.prepare('SELECT * FROM chats WHERE id = ?').get(chat.id);

    // last_message_at is of type string, so we can compare it directly
    // format: 2025-08-22 17:54:06
    expect(updatedChatDetails.last_message_at).toBe(addedMessage.created_at);
    expect(updatedChatDetails.last_message_at).not.toBe(chat.last_message_at);
  });

  it('should retrieve all messages from a chat', async () => {
    const firstMessage = 'Hello, this is a test chat!';
    const secondMessage = 'This is a follow-up message.';

    const chat = chatService.createNewChat(userId, firstMessage, timeAfterOneSecond());
    chatService.addChatMessage(chat.id, secondMessage, 'user', timeAfterOneSecond());

    const messages = chatService.getAllMessagesFromChat(chat.id);
    expect(messages).toBeDefined();
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe(secondMessage);
    expect(messages[1].text).toBe(firstMessage);
  });

  it('should retrieve all chats for a user', () => {
    const chat1 = chatService.createNewChat(userId, 'First chat message', timeAfterOneSecond());
    const chat2 = chatService.createNewChat(userId, 'Second chat message', timeAfterOneSecond());

    const chats = chatService.getAllChats(userId);

    expect(chats).toBeDefined();
    expect(chats.length).toBe(2);
    expect(chats[0].id).toBe(chat2.id);
    expect(chats[1].id).toBe(chat1.id);
  });
});