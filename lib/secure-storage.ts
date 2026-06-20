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
  try {
    await SecureStore.setItemAsync(KEYS.GITHUB_TOKEN, token);
  } catch {
    // Silent fail — token is still in Zustand for this session
  }
}

export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.GITHUB_TOKEN);
  } catch {
    // Silent fail — token is cleared from Zustand regardless
  }
}
