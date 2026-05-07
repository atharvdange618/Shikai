import { create } from "zustand";

interface SignInState {
  isLoading: boolean;
  error: string | null;
  needsInstall: boolean;
  pendingToken: string | null;

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

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setNeedsInstall: (needsInstall) => set({ needsInstall }),
  setPendingToken: (pendingToken) => set({ pendingToken }),
  reset: () =>
    set({
      isLoading: false,
      error: null,
      needsInstall: false,
      pendingToken: null,
    }),
}));
