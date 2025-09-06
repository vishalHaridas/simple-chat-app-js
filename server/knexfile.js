export default {
  client: "better-sqlite3",
  connection: {
    filename: "./chats.db",
  },
  userNullAsDefault: true,
  migrations: {
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};
