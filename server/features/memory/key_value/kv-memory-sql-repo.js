import Database from "better-sqlite3";

export const createKVMemorySQLRepo = (db) => {
  const upsertKV = db.prepare(`
    INSERT INTO mem_kv(user_id, key, value) VALUES (@user_id, @key, @value)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
  `);

  const delKV = db.prepare(`DELETE FROM mem_kv WHERE key=@key AND user_id=@user_id`);
  const listKV = db.prepare(`SELECT key, value FROM mem_kv WHERE user_id=@user_id ORDER BY updated_at DESC`);

  const writeKV = (user_id, key, value) => upsertKV.run({ user_id, key, value });
  const deleteKV = (user_id, key) => delKV.run({ user_id, key });
  const listKVItems = (user_id) => listKV.all({ user_id });

  return { 
    writeKV, deleteKV, listKV: listKVItems 
  };
}

export const initializeKVMemoryDB = (isTesting = false) => {
  const db = isTesting ? new Database(':memory:') : new Database('memory.db');

  db.exec(`
    CREATE TABLE IF NOT EXISTS mem_kv (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}