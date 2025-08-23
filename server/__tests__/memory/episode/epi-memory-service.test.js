import { createEpiMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/episode/epi-memory-sql-repo';
import { createEpisodicMemoryService } from '../../../features/memory/episode/epi-memory-service';

describe('Episodic Memory Service', () => {

  let db;
  let repo;
  let service;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createEpiMemorySQLRepo(db);
    service = createEpisodicMemoryService(repo);
  });

  beforeEach(() => {
    db.exec('DELETE FROM mem_epi');
  });

  afterAll(() => {
    db.close();
  });
  
  it('should write episode and retrieve recent episodes in order', () => {
    service.writeEpisode('user1', 'Episode 1');
    service.writeEpisode('user1', 'Episode 2');
    service.writeEpisode('user1', 'Episode 3');

    const episodes = service.recentEpisodes('user1', 2);
    expect(episodes.length).toBe(2);
    expect(episodes[0].text).toBe('Episode 3');
    expect(episodes[1].text).toBe('Episode 2');
  });

  it('should limit the number of recent episodes returned', () => {
    for (let i = 1; i <= 10; i++) {
      service.writeEpisode('user1', `Episode ${i}`);
    }

    const episodes = service.recentEpisodes('user1', 5);
    expect(episodes.length).toBe(5);
    expect(episodes[0].text).toBe('Episode 10');
    expect(episodes[4].text).toBe('Episode 6');
  });

  it('should return empty array if no episodes for user', () => {
    const episodes = service.recentEpisodes('user2', 5);
    expect(Array.isArray(episodes)).toBe(true);
    expect(episodes.length).toBe(0);
  });
});