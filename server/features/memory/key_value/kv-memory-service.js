import { tryCatchSync, assumeOk } from "../../../utils/result.js";

export const createKVMemoryService = (kvMemoryRepo) => {
  const writeKV = (user_id, key, value, createdAt = new Date().toISOString()) => {
    return assumeOk(kvMemoryRepo.writeKV(user_id, key, value, createdAt));
  };

  const deleteKV = (user_id, key) => {
    return assumeOk(kvMemoryRepo.deleteKV(user_id, key));
  };

  const listKV = (user_id) => {
    return assumeOk(kvMemoryRepo.listKV(user_id));
  };

  return { writeKV: tryCatchSync(writeKV), deleteKV: tryCatchSync(deleteKV), listKV: tryCatchSync(listKV) };
}