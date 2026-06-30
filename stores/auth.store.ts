import type { GitHubUser } from "@/types/github.types";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: GitHubUser | null;
  pat: string | null;

  setToken: (token: string) => void;
  setUser: (user: GitHubUser) => void;
  setPat: (pat: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  pat: null,

  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setPat: (pat) => set({ pat }),
  clearAuth: () => set({ token: null, user: null, pat: null }),
}));
