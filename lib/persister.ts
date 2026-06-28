import { mmkvStorage } from "@/lib/mmkv";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const mmkvPersister = createAsyncStoragePersister({
  storage: mmkvStorage,
  key: "shikai-query-cache",
});

export const PERSISTENCE_MAX_AGE = 1000 * 60 * 60 * 24;
