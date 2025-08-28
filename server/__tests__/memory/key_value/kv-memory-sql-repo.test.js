import { createKVMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/key_value/kv-memory-sql-repo';
import oneSecondIncrementedTime from '../../utils/oneSecondIncrementedTime';

import { assumeOk } from '../../../utils/result.js';

describe('Key Value SQL memory repo', () => {

  let db;
  let repo;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createKVMemorySQLRepo(db);
  });

  let timeAfterOneSecond
  beforeEach(() => {
    db.exec('DELETE FROM mem_kv');

    timeAfterOneSecond = oneSecondIncrementedTime(new Date())
  });

  afterAll(() => {
    db.close();
  });
  
  it('should write into sql db as expected', () => {
    const result = assumeOk(repo.writeKV('user1', 'key1', 'value1', timeAfterOneSecond()));
    expect(result.changes).toBe(1);

    const items = assumeOk(repo.listKV('user1'));
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value1' });
  });

  it('should update existing key on writeKV', () => {
    repo.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    const result = assumeOk(repo.writeKV('user1', 'key1', 'value2', timeAfterOneSecond())); // update
    expect(result.changes).toBe(1); // 1 row updated
    const items = assumeOk(repo.listKV('user1'));
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value2' });
  });

  it('should listKV return empty array if no items', () => {
    const items = assumeOk(repo.listKV('user1'));
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it('should listKV return only items for given user', () => {
    repo.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    repo.writeKV('user2', 'key2', 'value2', timeAfterOneSecond());
    const itemsUser1 = assumeOk(repo.listKV('user1'));
    expect(itemsUser1.length).toBe(1);
    expect(itemsUser1[0]).toMatchObject({ key: 'key1', value: 'value1' });
    const itemsUser2 = assumeOk(repo.listKV('user2'));
    expect(itemsUser2.length).toBe(1);
    expect(itemsUser2[0]).toMatchObject({ key: 'key2', value: 'value2' });
  });

  it('should remove key on deleteKV', () => {
    repo.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    const result = assumeOk(repo.deleteKV('user1', 'key1'));
    expect(result.changes).toBe(1);
    const items = assumeOk(repo.listKV('user1'));
    expect(items.length).toBe(0);
  });
});
