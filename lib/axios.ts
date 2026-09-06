import { useAuthStore } from "@/stores/auth.store";
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

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
    rateLimit.remaining === 0 &&
    rateLimit.reset !== null &&
    Date.now() < rateLimit.reset.getTime()
  );
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

githubAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // A request that already set its own Authorization header (e.g. to
    // validate a token that isn't the active session's) keeps it as-is.
    if (!config.headers.has("Authorization")) {
      const token = useAuthStore.getState().token;

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

githubAxios.interceptors.response.use(
  (response) => {
    const h = response.headers;

    const limitVal = h["x-ratelimit-limit"];
    const remainingVal = h["x-ratelimit-remaining"];
    const resetVal = h["x-ratelimit-reset"];
    const usedVal = h["x-ratelimit-used"];

    if (limitVal) rateLimit.limit = parseInt(limitVal, 10);
    if (remainingVal) rateLimit.remaining = parseInt(remainingVal, 10);
    if (resetVal) rateLimit.reset = new Date(parseInt(resetVal, 10) * 1000);
    if (usedVal) rateLimit.used = parseInt(usedVal, 10);

    return response;
  },

  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message =
      (data?.message as string) ?? error.message ?? "Unknown error";

    if (status === 401 && authReady && usedSessionToken(error.config)) {
      useAuthStore.getState().clearAuth();
    }

    if (status === 403) {
      const retryAfter = error.response?.headers["x-ratelimit-reset"];
      if (retryAfter) {
        rateLimit.reset = new Date(parseInt(retryAfter, 10) * 1000);
        rateLimit.remaining = 0;
      }
    }

    return Promise.reject(new GitHubApiError(status ?? 0, message));
  },
);
