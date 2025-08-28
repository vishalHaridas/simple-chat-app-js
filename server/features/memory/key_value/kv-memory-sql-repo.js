import Database from "better-sqlite3";
import { Ok, Err, assumeOk } from "../../../utils/result.js";

export const createKVMemorySQLRepo = (db) => {
  // on conflict of key, update the value and updated_at with passed in created_at
  const upsertKV = db.prepare(`
    INSERT INTO mem_kv(user_id, key, value, created_at) VALUES (@user_id, @key, @value, @created_at)
    ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value, updated_at= daretime('now')
  `);

  const delKV = db.prepare(`DELETE FROM mem_kv WHERE key=@key AND user_id=@user_id`);
  const listKV = db.prepare(`SELECT key, value FROM mem_kv WHERE user_id=@user_id ORDER BY updated_at DESC`);

  const writeKV = (user_id, key, value, createdAt) => {
    try {
      const result = upsertKV.run({ user_id, key, value, created_at: createdAt });
      if (result.changes === 0) {
        return Err('not_inserted', 'Key-Value pair was not inserted or updated');
      }
      return Ok(result);
    } catch (error) {
      return Err('db_error', 'Failed to write key-value pair');
    }
  };
  const deleteKV = (user_id, key) => {
    try {
      const result = delKV.run({ user_id, key });
      if (result.changes === 0) {
        return Err('not_found', 'Key not found');
      }
      return Ok(result);
    } catch (error) {
      return Err('db_error', 'Failed to delete key-value pair');
    }
  };
  const listKVItems = (user_id) => {
    try {
      const result = listKV.all({ user_id });
      if (!Array.isArray(result)) {
        return Err('not_found', 'No key-value pairs found');
      }
      return Ok(result);
    } catch (error) {
      return Err('db_error', 'Failed to list key-value pairs');
    }
  };

  // return {
  //   writeKV: tryCatchSync(writeKV), deleteKV: tryCatchSync(deleteKV), listKV: tryCatchSync(listKVItems)
  // };
  return {
    writeKV,
    deleteKV,
    listKV: listKVItems
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
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `);

  return db;
}