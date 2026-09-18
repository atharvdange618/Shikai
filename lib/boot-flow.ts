export type BootState =
  | { phase: "checkingSecurity" }
  | { phase: "blocked"; reasons: string[]; devModeBlocked: boolean }
  | { phase: "restoringAuth" }
  | { phase: "ready"; lastRoutedToken: string | null | undefined };

export type BootAction =
  | { type: "SECURITY_PASSED" }
  | { type: "SECURITY_BLOCKED"; reasons: string[]; devModeBlocked: boolean }
  | { type: "AUTH_RESTORE_COMPLETE" }
  | { type: "TOKEN_CHANGED"; token: string | null };

export const initialBootState: BootState = { phase: "checkingSecurity" };

export function bootReducer(state: BootState, action: BootAction): BootState {
  switch (action.type) {
    case "SECURITY_PASSED":
      return state.phase === "checkingSecurity" || state.phase === "blocked"
        ? { phase: "restoringAuth" }
        : state;
    case "SECURITY_BLOCKED":
      return {
        phase: "blocked",
        reasons: action.reasons,
        devModeBlocked: action.devModeBlocked,
      };
    case "AUTH_RESTORE_COMPLETE":
      return state.phase === "restoringAuth"
        ? { phase: "ready", lastRoutedToken: undefined }
        : state;
    case "TOKEN_CHANGED":
      if (state.phase !== "ready") return state;
      if (state.lastRoutedToken === action.token) return state;
      return { phase: "ready", lastRoutedToken: action.token };
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}
