/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const user_id = "default";

  const calculateDateWithOffset = (offset) => {
    // Date starts from Jan 1, 2024 @ 12:00 PM + offset days
    const date = new Date("2024-01-01T12:00:00");
    date.setDate(date.getDate() + offset);
    return date.toISOString().replace("T", " ").substring(0, 19);
  };
  await knex("chats").del();

  await knex("chats").insert([
    {
      id: 1,
      user_id: user_id,
      title: "Chat with Alice",
      created_at: calculateDateWithOffset(0),
      last_message_at: calculateDateWithOffset(1 + 3),
    },
    {
      id: 2,
      user_id: user_id,
      title: "Project Discussion",
      created_at: calculateDateWithOffset(1),
      last_message_at: calculateDateWithOffset(2 + 3),
    },
    {
      id: 3,
      user_id: user_id,
      title: "Random Chat",
      created_at: calculateDateWithOffset(2),
      last_message_at: calculateDateWithOffset(3 + 3),
    },
  ]);
}
