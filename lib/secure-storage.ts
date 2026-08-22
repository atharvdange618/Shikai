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

async function safeRead<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// Silent fail - callers keep the in-memory (Zustand) value regardless.
async function safeWrite(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch {
    // ignore
  }
}

export const getStoredToken = (): Promise<string | null> =>
  safeRead(async () => {
    const token = await SecureStore.getItemAsync(KEYS.GITHUB_TOKEN);
    return isValidToken(token) ? token : null;
  }, null);

export const saveToken = (token: string): Promise<void> =>
  safeWrite(() => SecureStore.setItemAsync(KEYS.GITHUB_TOKEN, token));

export const deleteToken = (): Promise<void> =>
  safeWrite(() => SecureStore.deleteItemAsync(KEYS.GITHUB_TOKEN));

export const getStoredPAT = (): Promise<string | null> =>
  safeRead(async () => {
    const pat = await SecureStore.getItemAsync(KEYS.GITHUB_PAT);
    return isValidPAT(pat) ? pat : null;
  }, null);

export const savePAT = (pat: string): Promise<void> =>
  safeWrite(() => SecureStore.setItemAsync(KEYS.GITHUB_PAT, pat));

export const deletePAT = (): Promise<void> =>
  safeWrite(() => SecureStore.deleteItemAsync(KEYS.GITHUB_PAT));

export const savePendingAuth = (codeVerifier: string): Promise<void> =>
  safeWrite(() => {
    const data: PendingAuth = { codeVerifier, timestamp: Date.now() };
    return SecureStore.setItemAsync(KEYS.PENDING_AUTH, JSON.stringify(data));
  });

export const getPendingAuth = (): Promise<PendingAuth | null> =>
  safeRead(async () => {
    const raw = await SecureStore.getItemAsync(KEYS.PENDING_AUTH);
    if (!raw) return null;
    const data: PendingAuth = JSON.parse(raw);
    if (Date.now() - data.timestamp > PENDING_AUTH_TTL_MS) {
      await SecureStore.deleteItemAsync(KEYS.PENDING_AUTH);
      return null;
    }
    return data;
  }, null);

export const clearPendingAuth = (): Promise<void> =>
  safeWrite(() => SecureStore.deleteItemAsync(KEYS.PENDING_AUTH));
