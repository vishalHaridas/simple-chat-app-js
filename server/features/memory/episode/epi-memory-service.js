import { tryCatchSync, assumeOk } from "../../../utils/result.js";

export const createEpisodicMemoryService = (epiMemoryRepo) => {
  const writeEpisode = (user_id, text, createdAt) =>
    assumeOk(epiMemoryRepo.writeEpisode(user_id, text, createdAt));

  const recentEpisodes = (user_id, limit = 5) =>
    assumeOk(epiMemoryRepo.recentEpisodes(user_id, limit));

  return {
    writeEpisode: tryCatchSync(writeEpisode),
    recentEpisodes: tryCatchSync(recentEpisodes)
  };
};