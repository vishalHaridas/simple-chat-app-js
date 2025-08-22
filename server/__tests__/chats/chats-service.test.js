import { createNewChat } from '../../chats/chats-service';

describe('Chats Service', () => {

  const userId = 'test_user';
  const beforeAll = () => {

  };

  it('should insert a chat for a user', () => {
    const chat = createNewChat(userId);

    expect(chat).toBeDefined();
    expect(chat.title).toMatch(/Chat @/);
    expect(chat.created_at).toBeDefined();
  });
});