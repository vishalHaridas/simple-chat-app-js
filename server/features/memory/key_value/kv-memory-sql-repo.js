import Database from "better-sqlite3";

export const createKVMemorySQLRepo = (db) => {
  // on conflict of key, update the value and updated_at with passed in created_at
  const upsertKV = db.prepare(`
    INSERT INTO mem_kv(user_id, key, value, created_at) VALUES (@user_id, @key, @value, @created_at)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.created_at
  `);

  const delKV = db.prepare(`DELETE FROM mem_kv WHERE key=@key AND user_id=@user_id`);
  const listKV = db.prepare(`SELECT key, value FROM mem_kv WHERE user_id=@user_id ORDER BY updated_at DESC`);

  const writeKV = (user_id, key, value, createdAt) => upsertKV.run({ user_id, key, value, created_at: createdAt });
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
      created_at DATETIME,
      updated_at DATETIME 
    );
  `);

  return db;
}