import Database from "better-sqlite3";
import { Ok, Err } from "../../../utils/result.js";

export const createEpiMemorySQLRepo = (db) => {

  const insertEpi = db.prepare(`INSERT INTO mem_epi(user_id, text, created_at) VALUES (@user_id, @text, @created_at)`);
  const recentEpi = db.prepare(`SELECT text FROM mem_epi WHERE user_id=@user_id ORDER BY created_at DESC LIMIT @limit`);

  const writeEpisode = (user_id, text, createdAt) => {
    try {
      const result = insertEpi.run({ user_id, text, createdAt });
      if (result.changes === 0) {
        return Err('not_inserted', 'Episode was not inserted');
      }
      return Ok(result);
    } catch (error) {
      return Err('db_error', 'Failed to write episode');
    }
  };

  const recentEpisodes = (user_id, limit = 5) => {
    try {
      const rows = recentEpi.all({ user_id, limit });
      if (!Array.isArray(rows)) {
        return Err('not_found', 'No episodes found');
      }
      return Ok(rows);
    } catch (error) {
      return Err('db_error', 'Failed to retrieve episodes');
    }
  };

  return { 
    writeEpisode, recentEpisodes
  };
}

//broken
export const initializeEpisodeMemoryDB = (isTesting = false) => {
  const db = isTesting ? new Database(':memory:') : new Database('memory.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS mem_epi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME NOT NULL
    );
  `);

  return db;
}