import Database from "better-sqlite3";

export const createEpiMemorySQLRepo = (db) => {

  const insertEpi = db.prepare(`INSERT INTO mem_epi(user_id, text, created_at) VALUES (@user_id, @text, @createdAt)`);
  const recentEpi = db.prepare(`SELECT text FROM mem_epi WHERE user_id=@user_id ORDER BY created_at DESC LIMIT @limit`);

  const writeEpisode = (user_id, text, createdAt) => insertEpi.run({ user_id, text, createdAt });
  const recentEpisodes = (user_id, limit = 5) => recentEpi.all({ user_id, limit });

  return { 
    writeEpisode, recentEpisodes
  };
}

export const initializeKVMemoryDB = (isTesting = false) => {
  const db = isTesting ? new Database(':memory:') : new Database('memory.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS mem_epi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME
    );
  `);

  return db;
}