/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex("messages").del();

  await knex("messages").insert([
    {
      id: 1,
      chat_id: 1,
      text: "Hello Alice!",
      sender: "user1",
      created_at: "2023-10-01 10:01:00",
    },
    {
      id: 2,
      chat_id: 1,
      text: "Hi there!",
      sender: "Alice",
      created_at: "2023-10-01 10:02:00",
    },
    {
      id: 3,
      chat_id: 1,
      text: "How are you?",
      sender: "user1",
      created_at: "2023-10-01 10:03:00",
    },
    {
      id: 4,
      chat_id: 1,
      text: "I am good, thanks!",
      sender: "Alice",
      created_at: "2023-10-01 10:04:00",
    },
    {
      id: 5,
      chat_id: 2,
      text: "Let's discuss the project.",
      sender: "user2",
      created_at: "2023-10-02 11:01:00",
    },
    {
      id: 6,
      chat_id: 2,
      text: "Sure, what's the agenda?",
      sender: "Bob",
      created_at: "2023-10-02 11:05:00",
    },
    {
      id: 7,
      chat_id: 2,
      text: "We need to finalize the requirements.",
      sender: "user2",
      created_at: "2023-10-02 11:10:00",
    },
    {
      id: 8,
      chat_id: 3,
      text: "Random chat starts here.",
      sender: "user1",
      created_at: "2023-10-03 12:01:00",
    },
    {
      id: 9,
      chat_id: 3,
      text: "Indeed it does!",
      sender: "Charlie",
      created_at: "2023-10-03 12:15:00",
    },
    {
      id: 10,
      chat_id: 3,
      text: "Let's keep it going.",
      sender: "user1",
      created_at: "2023-10-03 12:20:00",
    },
  ]);
}
