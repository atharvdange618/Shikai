import type { GitHubUser } from "@/types/github.types";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: GitHubUser | null;

  setToken: (token: string) => void;
  setUser: (user: GitHubUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),

  clearAuth: () => set({ token: null, user: null }),
}));
