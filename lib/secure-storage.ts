import * as SecureStore from "expo-secure-store";

const KEYS = {
  GITHUB_TOKEN: "shikai_github_token",
} as const;

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.GITHUB_TOKEN);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.GITHUB_TOKEN, token);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.GITHUB_TOKEN);
}
