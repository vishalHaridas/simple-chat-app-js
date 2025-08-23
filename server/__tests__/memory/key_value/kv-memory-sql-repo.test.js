import { createKVMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/key_value/kv-memory-sql-repo';

describe('Key Value SQL memory repo', () => {

  let db;
  let repo;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createKVMemorySQLRepo(db);
  });

  beforeEach(() => {
    db.exec('DELETE FROM mem_kv');
  });

  afterAll(() => {
    db.close();
  });
  
  it('should write into sql db as expected', () => {
    const result = repo.writeKV('user1', 'key1', 'value1');
    expect(result.changes).toBe(1);

    const items = repo.listKV('user1');
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value1' });
  });

  it('should update existing key on writeKV', () => {
    repo.writeKV('user1', 'key1', 'value1');
    const result = repo.writeKV('user1', 'key1', 'value2');
    expect(result.changes).toBe(1); // 1 row updated
    const items = repo.listKV('user1');
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value2' });
  });

  it('should listKV return empty array if no items', () => {
    const items = repo.listKV('user1');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it('should listKV return only items for given user', () => {
    repo.writeKV('user1', 'key1', 'value1');
    repo.writeKV('user2', 'key2', 'value2');  
    const itemsUser1 = repo.listKV('user1');
    expect(itemsUser1.length).toBe(1);
    expect(itemsUser1[0]).toMatchObject({ key: 'key1', value: 'value1' });
    const itemsUser2 = repo.listKV('user2');
    expect(itemsUser2.length).toBe(1);
    expect(itemsUser2[0]).toMatchObject({ key: 'key2', value: 'value2' });
  });

  it('should remove key on deleteKV', () => {
    repo.writeKV('user1', 'key1', 'value1');
    const result = repo.deleteKV('user1', 'key1');
    expect(result.changes).toBe(1);
    const items = repo.listKV('user1');
    expect(items.length).toBe(0);
  });
});
