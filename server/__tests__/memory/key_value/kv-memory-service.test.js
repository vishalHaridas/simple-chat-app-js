import { createKVMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/key_value/kv-memory-sql-repo';
import { createKVMemoryService } from '../../../features/memory/key_value/kv-memory-service';

describe('Key Value Memory Service', () => {

  let db;
  let repo;
  let service;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createKVMemorySQLRepo(db);
    service = createKVMemoryService(repo);
  });

  beforeEach(() => {
    db.exec('DELETE FROM mem_kv');
  });

  afterAll(() => {
    db.close();
  });
  
  it('should write and list key-value pairs correctly', () => {
    service.writeKV('user1', 'key1', 'value1');
    let items = service.listKV('user1');
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value1' });

    service.writeKV('user1', 'key2', 'value2');
    items = service.listKV('user1');
    expect(items.length).toBe(2);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value1' });
    expect(items[1]).toMatchObject({ key: 'key2', value: 'value2' }); 
  });

  it('should update existing key on writeKV', () => {
    service.writeKV('user1', 'key1', 'value1');
    service.writeKV('user1', 'key1', 'value2'); // update
    const items = service.listKV('user1');
    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({ key: 'key1', value: 'value2' });
  });

  it('should return empty array if no items for user', () => {
    const items = service.listKV('user1');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it('should return only items for the specified user', () => {
    service.writeKV('user1', 'key1', 'value1');
    service.writeKV('user2', 'key2', 'value2');  
    const itemsUser1 = service.listKV('user1');
    expect(itemsUser1.length).toBe(1);
    expect(itemsUser1[0]).toMatchObject({ key: 'key1', value: 'value1' });
    const itemsUser2 = service.listKV('user2');
    expect(itemsUser2.length).toBe(1);
    expect(itemsUser2[0]).toMatchObject({ key: 'key2', value: 'value2' });
  });
});