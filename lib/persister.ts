import { mmkvStorage } from "@/lib/mmkv";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const mmkvPersister = createAsyncStoragePersister({
  storage: mmkvStorage,
  key: "shikai-query-cache",
});

export { PERSISTENCE_MAX_AGE } from "@/lib/query-client";
