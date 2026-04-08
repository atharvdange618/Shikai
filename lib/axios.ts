import { useAuthStore } from "@/stores/auth.store";
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

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

export class GitHubApiError extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.message = message;
  }
}

export const githubAxios: AxiosInstance = axios.create({
  baseURL: GITHUB_API_BASE,
  timeout: 15_000,
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "Content-Type": "application/json",
  },
});

githubAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    if (__DEV__) {
      console.log("[API Request]", config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error("[API Request Error]", error);
    }
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

    if (__DEV__) {
      console.log("[API Response]", response.status, response.config.url);
      if (rateLimit.remaining !== null) {
        console.log(
          "[Rate Limit]",
          `${rateLimit.remaining}/${rateLimit.limit} remaining`,
        );
      }
    }

    return response;
  },

  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message =
      (data?.message as string) ?? error.message ?? "Unknown error";

    if (__DEV__) {
      console.error("[API Error]", status, message);
    }

    if (status === 401) {
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
