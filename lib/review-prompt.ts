// Decides when to show Play's in-app review sheet. No React or native
// imports, so Vitest covers it; hooks/useReviewPrompt.ts calls the API.

export const LAUNCHES_BEFORE_REVIEW = 5;

const LAUNCHES_KEY = "launches";
const ASKED_KEY = "asked";

export interface ReviewStorage {
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: number | boolean): void;
}

/**
 * Counts one signed-in launch and returns true on the launch that should
 * ask for a review. Asks once per install: Play caps how often the sheet
 * shows anyway, and never says whether it did.
 */
export function recordLaunch(storage: ReviewStorage): boolean {
  if (storage.getBoolean(ASKED_KEY)) return false;

  const launches = (storage.getNumber(LAUNCHES_KEY) ?? 0) + 1;
  storage.set(LAUNCHES_KEY, launches);
  if (launches < LAUNCHES_BEFORE_REVIEW) return false;

  storage.set(ASKED_KEY, true);
  return true;
}
