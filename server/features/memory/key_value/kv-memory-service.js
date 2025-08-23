export const createKVMemoryService = (kvMemoryRepo) => {
  const writeKV = (user_id, key, value) => kvMemoryRepo.writeKV(user_id, key, value);
  const deleteKV = (user_id, key) => kvMemoryRepo.deleteKV(user_id, key);
  const listKV = (user_id) => kvMemoryRepo.listKV(user_id);

  return { writeKV, deleteKV, listKV };
}