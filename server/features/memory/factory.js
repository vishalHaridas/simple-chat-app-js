import { createMemoryFacade } from './facade.js';
import { createKVMemoryService } from './key_value/kv-memory-service.js';
import { createEpisodicMemoryService } from './episode/epi-memory-service.js';
import { createEpiMemorySQLRepo, initializeEpisodeMemoryDB } from './episode/epi-memory-sql-repo.js';
import { createKVMemorySQLRepo, initializeKVMemoryDB } from './key_value/kv-memory-sql-repo.js';

import { tryCatchSync } from '../../utils/result.js'

export default ({ isTesting = false } = {}) => {
  const kvDb = initializeKVMemoryDB(isTesting);
  const epiDb = initializeEpisodeMemoryDB(isTesting);

  const epiRepo = createEpiMemorySQLRepo(epiDb);
  const kvRepo = createKVMemorySQLRepo(kvDb);

  const kvService = createKVMemoryService(kvRepo);
  const epiService = createEpisodicMemoryService(epiRepo);

  const memoryFacade = createMemoryFacade(kvService, epiService);

  const shutdown = () => {
    const kvDbCloseResult = tryCatchSync(kvDb.close());
    const epiDbCloseResult = tryCatchSync(epiDb.close());
    return [kvDbCloseResult, epiDbCloseResult];
  };

  return { kvDb, epiDb, kvRepo, epiRepo, kvService, epiService, memoryFacade, shutdown };
};
