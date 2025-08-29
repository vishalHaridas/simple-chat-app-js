import { createEpiMemorySQLRepo, initializeEpisodeMemoryDB } from '../../../features/memory/episode/epi-memory-sql-repo';
import oneSecondIncrementedTime from '../../utils/oneSecondIncrementedTime';
import { assumeOk } from '../../../utils/result.js';

describe('Episodic Memory SQL repo', () => {

  let db;
  let repo;

  beforeAll(() => {
    db = initializeEpisodeMemoryDB(true);
    repo = createEpiMemorySQLRepo(db);
  });

  let timeAfterOneSecond
  beforeEach(() => {
    db.exec('DELETE FROM mem_epi');

    timeAfterOneSecond = oneSecondIncrementedTime(new Date())
  });

  afterAll(() => {
    db.close();
  });
  
  it.only('should write episode and retrieve recent episodes in order', () => {
    assumeOk(repo.writeEpisode('user1', 'Episode 1', timeAfterOneSecond()));
    assumeOk(repo.writeEpisode('user1', 'Episode 2', timeAfterOneSecond()));
    assumeOk(repo.writeEpisode('user1', 'Episode 3', timeAfterOneSecond()));

    const episodes = assumeOk(repo.recentEpisodes('user1', 2));
    expect(episodes.length).toBe(2);
    expect(episodes[0].text).toBe('Episode 3');
    expect(episodes[1].text).toBe('Episode 2');
  });

  it('should limit the number of recent episodes returned', () => {
    for (let i = 1; i <= 10; i++) {
      assumeOk(repo.writeEpisode('user1', `Episode ${i}`, timeAfterOneSecond()));
    }

    const episodes = assumeOk(repo.recentEpisodes('user1', 5));
    expect(episodes.length).toBe(5);
    expect(episodes[0].text).toBe('Episode 10');
    expect(episodes[4].text).toBe('Episode 6');
  });

  it('should return empty array if no episodes for user', () => {
    const episodes = assumeOk(repo.recentEpisodes('user2', 5));
    expect(Array.isArray(episodes)).toBe(true);
    expect(episodes.length).toBe(0);
  });
});