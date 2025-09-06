/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const calculateDateWithOffset = (offset) => {
    // Date starts from Jan 1, 2024 @ 12:00 PM + offset days
    const date = new Date("2024-01-01T12:00:00");
    date.setDate(date.getDate() + offset);
    return date.toISOString().replace("T", " ").substring(0, 19);
  };

  const chatId1Messages = [
    {
      chat_id: 1,
      text: "Hello Alice!",
      sender: "user",
      created_at: calculateDateWithOffset(1 + 0),
    },
    {
      chat_id: 1,
      text: "Hi there!",
      sender: "assistant",
      created_at: calculateDateWithOffset(1 + 1),
    },
    {
      chat_id: 1,
      text: "How are you?",
      sender: "user",
      created_at: calculateDateWithOffset(1 + 2),
    },
    {
      chat_id: 1,
      text: "I am good, thanks!",
      sender: "assistant",
      created_at: calculateDateWithOffset(1 + 3),
    },
  ];

  const chatId2Messages = [
    {
      chat_id: 2,
      text: "Let's discuss the project.",
      sender: "user",
      created_at: calculateDateWithOffset(2 + 0),
    },
    {
      chat_id: 2,
      text: "Sure, what's the agenda?",
      sender: "assistant",
      created_at: calculateDateWithOffset(2 + 1),
    },
    {
      chat_id: 2,
      text: "We need to finalize the requirements.",
      sender: "user",
      created_at: calculateDateWithOffset(2 + 2),
    },
    {
      chat_id: 2,
      text: "Got it. I'll prepare the document.",
      sender: "assistant",
      created_at: calculateDateWithOffset(2 + 3),
    },
  ];

  const chatId3Messages = [
    {
      chat_id: 3,
      text: "Random chat starts here.",
      sender: "user",
      created_at: calculateDateWithOffset(3 + 0),
    },
    {
      chat_id: 3,
      text: "Indeed it does!",
      sender: "assistant",
      created_at: calculateDateWithOffset(3 + 1),
    },
    {
      chat_id: 3,
      text: "Let's keep it going.",
      sender: "user",
      created_at: calculateDateWithOffset(3 + 2),
    },
    {
      chat_id: 3,
      text: "Absolutely, I'm here for it.",
      sender: "assistant",
      created_at: calculateDateWithOffset(3 + 3),
    },
  ];

  await knex("messages").del();
  await knex("messages").insert([
    ...chatId1Messages,
    ...chatId2Messages,
    ...chatId3Messages,
  ]);
}
