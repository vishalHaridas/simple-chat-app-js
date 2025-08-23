import { createEpiMemorySQLRepo, initializeKVMemoryDB } from '../../../features/memory/episode/epi-memory-sql-repo';
import { createEpisodicMemoryService } from '../../../features/memory/episode/epi-memory-service';

import oneSecondIncrementedTime from '../../utils/oneSecondIncrementedTime';

describe('Episodic Memory Service', () => {

  let db;
  let repo;
  let service;

  beforeAll(() => {
    db = initializeKVMemoryDB(true);
    repo = createEpiMemorySQLRepo(db);
    service = createEpisodicMemoryService(repo);
  });

  let timeAfterOneSecond;
  beforeEach(() => {
    db.exec('DELETE FROM mem_epi');

    timeAfterOneSecond = oneSecondIncrementedTime(new Date());
  });

  afterAll(() => {
    db.close();
  });

  it('should write an episode for a user', () => {
    const result = service.writeEpisode('user1', 'This is an episode.', timeAfterOneSecond());
    expect(result).toBeDefined();
    expect(result.changes).toBe(1);

    const row = db.prepare('SELECT * FROM mem_epi WHERE user_id = ?').get('user1');
    expect(row).toBeDefined();
    expect(row.text).toBe('This is an episode.');
  });

  it('should retrieve recent episodes for a user', () => {
    service.writeEpisode('user1', 'Episode 1', timeAfterOneSecond());
    service.writeEpisode('user1', 'Episode 2', timeAfterOneSecond());
    service.writeEpisode('user1', 'Episode 3', timeAfterOneSecond());

    const episodes = service.recentEpisodes('user1', 3);
    expect(episodes.length).toBe(3);
    expect(episodes[0].text).toBe('Episode 3');
    expect(episodes[1].text).toBe('Episode 2');
    expect(episodes[2].text).toBe('Episode 1');
  });

  it('should limit the number of recent episodes returned', () => {
    for (let i = 1; i <= 10; i++) {
      service.writeEpisode('user1', `Episode ${i}`, timeAfterOneSecond());
    }

    const episodes = service.recentEpisodes('user1', 5);
    expect(episodes.length).toBe(5);
    expect(episodes[0].text).toBe('Episode 10');
    expect(episodes[4].text).toBe('Episode 6');
  });  
});