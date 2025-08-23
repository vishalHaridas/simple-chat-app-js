import { createEpiMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/episode/epi-memory-sql-repo';

describe('Episodic Memory SQL repo', () => {

  let db;
  let repo;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createEpiMemorySQLRepo(db);
  });

  beforeEach(() => {
    db.exec('DELETE FROM mem_epi');
  });

  afterAll(() => {
    db.close();
  });
  
  it('should write episode and retrieve recent episodes in order', () => {
    repo.writeEpisode('user1', 'Episode 1');
    repo.writeEpisode('user1', 'Episode 2');
    repo.writeEpisode('user1', 'Episode 3');

    const episodes = repo.recentEpisodes('user1', 2);
    expect(episodes.length).toBe(2);
    expect(episodes[0].text).toBe('Episode 3');
    expect(episodes[1].text).toBe('Episode 2');
  });

  it('should limit the number of recent episodes returned', () => {
    for (let i = 1; i <= 10; i++) {
      repo.writeEpisode('user1', `Episode ${i}`);
    }

    const episodes = repo.recentEpisodes('user1', 5);
    expect(episodes.length).toBe(5);
    expect(episodes[0].text).toBe('Episode 10');
    expect(episodes[4].text).toBe('Episode 6');
  });

  it('should return empty array if no episodes for user', () => {
    const episodes = repo.recentEpisodes('user2', 5);
    expect(Array.isArray(episodes)).toBe(true);
    expect(episodes.length).toBe(0);
  });
});