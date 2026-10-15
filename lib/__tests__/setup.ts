// React Native defines this global at runtime; the pure modules under test
// read it (e.g. lib/sentry.ts gates its dev self-check on it).
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
