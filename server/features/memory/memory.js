import Database from 'better-sqlite3';
const db = new Database('memory.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS mem_kv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mem_epi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    text TEXT NOT NULL
  );
`);

const upsertKV = db.prepare(`
  INSERT INTO mem_kv(user_id, key, value) VALUES (@user_id, @key, @value)
  ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
`);

const delKV = db.prepare(`DELETE FROM mem_kv WHERE key=@key AND user_id=@user_id`);
const listKV = db.prepare(`SELECT key, value FROM mem_kv WHERE user_id=@user_id ORDER BY updated_at DESC`);
const insertEpi = db.prepare(`INSERT INTO mem_epi(user_id, text) VALUES (@user_id, @text)`);
const recentEpi = db.prepare(`SELECT text FROM mem_epi WHERE user_id=@user_id ORDER BY ts DESC LIMIT @limit`);

export default {
  writeKV: (user_id, key, value) => upsertKV.run({ user_id, key, value }),
  deleteKV: (user_id, key) => delKV.run({ user_id, key }),
  listKV: (user_id) => listKV.all({ user_id }),
  writeEpisode: (user_id, text) => insertEpi.run({ user_id, text }),
  recentEpisodes: (user_id, limit = 5) => recentEpi.all({ user_id, limit })
};