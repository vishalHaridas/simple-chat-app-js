/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // chats: id, user_id, title, created_at, last_message_at
  // messages: id, chat_id, text, sender (user or assistant), created_at
  await knex.schema.createTable("chats", (table) => {
    table.increments("id").primary();
    table.text("user_id").notNullable();
    table.string("title").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("last_message_at").defaultTo(knex.fn.now());
  });
  return await knex.schema.createTable("messages", (table_1) => {
    table_1.increments("id").primary();
    table_1
      .integer("chat_id")
      .notNullable()
      .references("id")
      .inTable("chats")
      .onDelete("CASCADE");
    table_1.text("text").notNullable();
    table_1.text("sender").notNullable();
    table_1.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("messages");
  return await knex.schema.dropTableIfExists("chats");
}
