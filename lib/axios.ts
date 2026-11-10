import { reportApiError } from "@/lib/sentry";
import { useAuthStore } from "@/stores/auth.store";
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

let authReady = false;
export function setAuthReady(ready: boolean) {
  authReady = ready;
}

export interface RateLimitState {
  limit: number | null;
  remaining: number | null;
  reset: Date | null;
  used: number | null;
}

export const rateLimit: RateLimitState = {
  limit: null,
  remaining: null,
  reset: null,
  used: null,
};

export function isRateLimited(): boolean {
  return (
    rateLimit.remaining === 0 && rateLimit.reset !== null && Date.now() < rateLimit.reset.getTime()
  );
}

function parseRateLimitHeader(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class GitHubApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

// eslint-disable-next-line import/no-named-as-default-member
export const githubAxios: AxiosInstance = axios.create({
  baseURL: GITHUB_API_BASE,
  timeout: 15_000,
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "Content-Type": "application/json",
  },
});

// A 401 should only clear the OAuth session if that session's token is what
// actually got rejected. A request authed with an explicit override (a PAT,
// or validateToken's candidate token) failing shouldn't sign out the session.
function usedSessionToken(config: InternalAxiosRequestConfig | undefined): boolean {
  const usedAuth = config?.headers.get("Authorization");
  const sessionToken = useAuthStore.getState().token;
  const sessionAuth = sessionToken ? `Bearer ${sessionToken}` : undefined;
  return usedAuth === sessionAuth;
}

githubAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // A request that already set its own Authorization header (e.g. to
  // validate a token that isn't the active session's) keeps it as-is.
  if (!config.headers.has("Authorization")) {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return config;
});

githubAxios.interceptors.response.use(
  (response) => {
    const h = response.headers;

    const limitVal = parseRateLimitHeader(h["x-ratelimit-limit"]);
    const remainingVal = parseRateLimitHeader(h["x-ratelimit-remaining"]);
    const resetVal = parseRateLimitHeader(h["x-ratelimit-reset"]);
    const usedVal = parseRateLimitHeader(h["x-ratelimit-used"]);

    if (limitVal !== undefined) rateLimit.limit = limitVal;
    if (remainingVal !== undefined) rateLimit.remaining = remainingVal;
    if (resetVal !== undefined) rateLimit.reset = new Date(resetVal * 1000);
    if (usedVal !== undefined) rateLimit.used = usedVal;

    return response;
  },

  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message = (data?.message as string) ?? error.message ?? "Unknown error";

    if (status === 401 && authReady && usedSessionToken(error.config)) {
      useAuthStore.getState().clearAuth();
    }

    if (status === 403) {
      const retryAfter = parseRateLimitHeader(error.response?.headers["x-ratelimit-reset"]);
      if (retryAfter !== undefined) {
        rateLimit.reset = new Date(retryAfter * 1000);
        rateLimit.remaining = 0;
      }
    }

    reportApiError(status ?? 0, error.config?.method, error.config?.url);

    return Promise.reject(new GitHubApiError(status ?? 0, message));
  },
);
