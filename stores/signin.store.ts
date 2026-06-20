import { create } from "zustand";

const PENDING_TOKEN_TTL_MS = 5 * 60 * 1000;

interface SignInState {
  isLoading: boolean;
  error: string | null;
  needsInstall: boolean;
  pendingToken: string | null;
  pendingTokenExpiry: number | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsInstall: (needs: boolean) => void;
  setPendingToken: (token: string | null) => void;
  reset: () => void;
}

export const useSignInStore = create<SignInState>((set) => ({
  isLoading: false,
  error: null,
  needsInstall: false,
  pendingToken: null,
  pendingTokenExpiry: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setNeedsInstall: (needsInstall) => set({ needsInstall }),
  setPendingToken: (pendingToken) =>
    set({
      pendingToken,
      pendingTokenExpiry: pendingToken ? Date.now() + PENDING_TOKEN_TTL_MS : null,
    }),
  reset: () =>
    set({
      isLoading: false,
      error: null,
      needsInstall: false,
      pendingToken: null,
      pendingTokenExpiry: null,
    }),
}));
