/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  /**
   * Chats table seed: 
   *  id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_message_at DATETIME 
   */
  /**
   * Messages table seed: 
   *  id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      sender TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   */

  await knex("chats").del();

  await knex("chats").insert([
    {
      id: 1,
      user_id: "user1",
      title: "Chat with Alice",
      created_at: "2023-10-01 10:00:00",
      last_message_at: "2023-10-01 10:05:00",
    },
    {
      id: 2,
      user_id: "user2",
      title: "Project Discussion",
      created_at: "2023-10-02 11:00:00",
      last_message_at: "2023-10-02 11:15:00",
    },
    {
      id: 3,
      user_id: "user1",
      title: "Random Chat",
      created_at: "2023-10-03 12:00:00",
      last_message_at: "2023-10-03 12:30:00",
    },
  ]);
}
