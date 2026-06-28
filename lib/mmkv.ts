import { createMMKV } from "react-native-mmkv";

const mmkv = createMMKV({ id: "shikai-cache" });

export const mmkvStorage = {
  getItem: async (key: string) => mmkv.getString(key) ?? null,
  setItem: async (key: string, value: string) => mmkv.set(key, value),
  removeItem: async (key: string) => { mmkv.remove(key); },
};
