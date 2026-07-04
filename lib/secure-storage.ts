import * as SecureStore from "expo-secure-store";

const KEYS = {
  GITHUB_TOKEN: "shikai_github_token",
  GITHUB_PAT: "shikai_github_pat",
  PENDING_AUTH: "shikai_pending_auth",
} as const;

const PENDING_AUTH_TTL_MS = 10 * 60 * 1000;

export interface PendingAuth {
  codeVerifier: string;
  timestamp: number;
}

function isValidToken(token: string | null): token is string {
  if (!token || token.length < 10 || token.length > 500) return false;
  return /^[\w\-\.]+$/.test(token);
}

function isValidPAT(pat: string | null): pat is string {
  if (!pat || pat.length < 10 || pat.length > 500) return false;
  return pat.startsWith("ghp_") || pat.startsWith("github_pat_");
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

export async function getStoredPAT(): Promise<string | null> {
  try {
    const pat = await SecureStore.getItemAsync(KEYS.GITHUB_PAT);
    return isValidPAT(pat) ? pat : null;
  } catch {
    return null;
  }
}

export async function savePAT(pat: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.GITHUB_PAT, pat);
  } catch {
    // Silent fail
  }
}

export async function deletePAT(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.GITHUB_PAT);
  } catch {
    // Silent fail
  }
}

export async function savePendingAuth(codeVerifier: string): Promise<void> {
  try {
    const data: PendingAuth = { codeVerifier, timestamp: Date.now() };
    await SecureStore.setItemAsync(KEYS.PENDING_AUTH, JSON.stringify(data));
  } catch {
    // Silent fail - auth flow will rely on in-memory state
  }
}

export async function getPendingAuth(): Promise<PendingAuth | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.PENDING_AUTH);
    if (!raw) return null;
    const data: PendingAuth = JSON.parse(raw);
    if (Date.now() - data.timestamp > PENDING_AUTH_TTL_MS) {
      await SecureStore.deleteItemAsync(KEYS.PENDING_AUTH);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function clearPendingAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.PENDING_AUTH);
  } catch {
    // Silent fail
  }
}
