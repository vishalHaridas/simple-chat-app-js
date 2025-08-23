import Database from "better-sqlite3";

export const createEpiMemorySQLRepo = (db) => {

  const insertEpi = db.prepare(`INSERT INTO mem_epi(user_id, text) VALUES (@user_id, @text)`);
  const recentEpi = db.prepare(`SELECT text FROM mem_epi WHERE user_id=@user_id ORDER BY ts DESC LIMIT @limit`);

  const writeEpisode = (user_id, text) => insertEpi.run({ user_id, text });
  const recentEpisodes = (user_id, limit = 5) => recentEpi.all

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
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      text TEXT NOT NULL
    );
  `);

  return db;
}