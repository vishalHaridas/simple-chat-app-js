export const createEpisodicMemoryService = (epiMemoryRepo) => {
  const writeEpisode = (user_id, text) => epiMemoryRepo.writeEpisode(user_id, text);
  const recentEpisodes = (user_id, limit = 5) => epiMemoryRepo.recentEpisodes(user_id, limit);

  return { writeEpisode, recentEpisodes };
}