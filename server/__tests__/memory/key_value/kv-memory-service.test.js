import { createKVMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/key_value/kv-memory-sql-repo';
import { createKVMemoryService } from '../../../features/memory/key_value/kv-memory-service';
import oneSecondIncrementedTime from '../../utils/oneSecondIncrementedTime';

describe('Key Value Memory Service', () => {

  let db;
  let repo;
  let service;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createKVMemorySQLRepo(db);
    service = createKVMemoryService(repo);
  });

  let timeAfterOneSecond
  beforeEach(() => {
    db.exec('DELETE FROM mem_kv');

    timeAfterOneSecond = oneSecondIncrementedTime(new Date())
  });

  afterAll(() => {
    db.close();
  });
  
  it('should write and list key-value pairs correctly', () => {
    const writeResult = service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    let itemsResult = service.listKV('user1');
    if (!itemsResult.ok)
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    let items = itemsResult.value;
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value1' });

    service.writeKV('user1', 'key2', 'value2', timeAfterOneSecond());
    itemsResult = service.listKV('user1');
    if (!itemsResult.ok)
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    items = itemsResult.value;
    expect(items.length).toBe(2);
    expect(items[0]).toMatchObject({ key: 'key2', value: 'value2' }); 
    expect(items[1]).toMatchObject({ key: 'key1', value: 'value1' });
  });

  it('should handle multiple users separately', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    service.writeKV('user2', 'key2', 'value2', timeAfterOneSecond());
    let itemsUser1Result = service.listKV('user1');
    if (!itemsUser1Result.ok)
      console.error('List Result Error:', itemsUser1Result.error, itemsUser1Result.message);
    let itemsUser1 = itemsUser1Result.value;
    expect(itemsUser1.length).toBe(1);
    expect(itemsUser1[0]).toMatchObject({ key: 'key1', value: 'value1' });
    let itemsUser2Result = service.listKV('user2');
    if (!itemsUser2Result.ok)
      console.error('List Result Error:', itemsUser2Result.error, itemsUser2Result.message);
    let itemsUser2 = itemsUser2Result.value;
    expect(itemsUser2.length).toBe(1);
    expect(itemsUser2[0]).toMatchObject({ key: 'key2', value: 'value2' });
  });

  it.skip('should update value for user, even with same key for different users', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    service.writeKV('user2', 'key1', 'value2', timeAfterOneSecond()); // same key, different user
    let itemsUser1 = service.listKV('user1');
    expect(itemsUser1.length).toBe(1);
    expect(itemsUser1[0]).toMatchObject({ key: 'key1', value: 'value1' });
    let itemsUser2 = service.listKV('user2');
    expect(itemsUser2.length).toBe(1);
    expect(itemsUser2[0]).toMatchObject({ key: 'key1', value: 'value2' });
  });

  it('should update existing key on writeKV', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    service.writeKV('user1', 'key1', 'value2', timeAfterOneSecond()); // update
    const itemsResult = service.listKV('user1');
    if (!itemsResult.ok) {
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    }
    const items = itemsResult.value;
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value2' });
  });

  it('should listKV in order of most recently updated', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    service.writeKV('user1', 'key2', 'value2', timeAfterOneSecond());
    service.writeKV('user1', 'key1', 'value3', timeAfterOneSecond()); // update key1 again
    const itemsResult = service.listKV('user1');
    if (!itemsResult.ok) {
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    }
    const items = itemsResult.value;
    expect(items.length).toBe(2);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value3' }); // key1 should be first
    expect(items[1]).toMatchObject({ key: 'key2', value: 'value2' });
  });

  it('should return empty array if no items for user', () => {
    const itemsResult = service.listKV('user1');
    if (!itemsResult.ok) {
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    }
    const items = itemsResult.value;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it('should return only items for the specified user', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    service.writeKV('user2', 'key2', 'value2', timeAfterOneSecond());
    const itemsUser1Result = service.listKV('user1');
    if (!itemsUser1Result.ok) {
      console.error('List Result Error:', itemsUser1Result.error, itemsUser1Result.message);
    }
    const itemsUser1 = itemsUser1Result.value;
    expect(itemsUser1.length).toBe(1);
    expect(itemsUser1[0]).toMatchObject({ key: 'key1', value: 'value1' });
    const itemsUser2Result = service.listKV('user2');
    if (!itemsUser2Result.ok) {
      console.error('List Result Error:', itemsUser2Result.error, itemsUser2Result.message);
    }
    const itemsUser2 = itemsUser2Result.value;
    expect(itemsUser2.length).toBe(1);
    expect(itemsUser2[0]).toMatchObject({ key: 'key2', value: 'value2' });
  });

  it('should remove key on deleteKV', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    let itemsResult = service.listKV('user1');
    if (!itemsResult.ok) {
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    }
    let items = itemsResult.value;
    expect(items.length).toBe(1);
    const resultResult = service.deleteKV('user1', 'key1');
    if (!resultResult.ok) {
      console.error('Delete Result Error:', resultResult.error, resultResult.message);
    }
    const result = resultResult.value;
    expect(result.changes).toBe(1);
    itemsResult = service.listKV('user1');
    if (!itemsResult.ok) {
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    }
    items = itemsResult.value;
    expect(items.length).toBe(0);
  });

  it('should not delete key for different user', () => {
    service.writeKV('user1', 'key1', 'value1', timeAfterOneSecond());
    const resultResult = service.deleteKV('user2', 'key1'); // different user
    if (!resultResult.ok) {
    }
    if (!resultResult.ok) {
      const error = resultResult.code;
      const message = resultResult.message;
      expect(error).toBe('INTERNAL_ERROR');
      expect(message).toContain('Key not found');
      expect(message).toContain('Expected Ok result but got Err');
    }
    const itemsResult = service.listKV('user1');
    if (!itemsResult.ok) {
      console.error('List Result Error:', itemsResult.error, itemsResult.message);
    }
    const items = itemsResult.value;
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value1' });
  });
});