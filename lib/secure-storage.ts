import * as SecureStore from "expo-secure-store";

const KEYS = {
  GITHUB_TOKEN: "shikai_github_token",
} as const;

function isValidToken(token: string | null): token is string {
  if (!token || token.length < 10 || token.length > 500) return false;
  return /^[\w\-\.]+$/.test(token);
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(KEYS.GITHUB_TOKEN);
    return isValidToken(token) ? token : null;
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.GITHUB_TOKEN, token);
  } catch {
    // Silent fail - token is still in Zustand for this session
  }
}

export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.GITHUB_TOKEN);
  } catch {
    // Silent fail - token is cleared from Zustand regardless
  }
}
