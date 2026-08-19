<!-- Important Rules -->

# Shikai - Agent Guide

Read-only GitHub companion for Android. React Native + Expo SDK 54, expo-router, TypeScript strict mode.

## Commands

```bash
# Lint (uses expo's built-in eslint wrapper, NOT npx eslint)
expo lint

# Start dev server
expo start

# Android dev build
expo run:android

# Regenerate native Android folder + re-apply custom gradle patches
npx expo prebuild --clean && node scripts/post-prebuild.js

# Build release APK (after prebuild)
cd android && gradlew.bat assembleRelease

# Build release AAB (Play Store)
cd android && gradlew.bat bundleRelease

# Web deploy (static export → Cloudflare Workers)
npx expo export -p web && wrangler deploy

# Web preview (local)
npx expo export -p web && wrangler dev
```

No test suite exists. `expo lint` is the only verification step.

## Architecture

**Routing**: expo-router file-based routing in `app/`. Entry is `app/_layout.tsx` (root) → `app/(app)/_layout.tsx` → `app/(app)/(tabs)/` (bottom tabs: overview, repos, search, profile).

**State**: Zustand stores in `stores/` (auth, signin, watchlist). Server state via React Query with MMKV-backed disk persistence (`lib/persister.ts`). `lib/mmkv.ts` creates the MMKV instance.

**API layer**: `lib/github-axios.ts` is the configured axios instance (base URL, auth interceptor, rate limit tracking). `lib/github-rest.ts` has all GitHub REST functions. `lib/github-graphql.ts` has GraphQL queries. PAT-based calls use native `fetch` via `fetchWithPAT()` in `github-rest.ts` (not axios).

**Native module**: `modules/shikai-security/` is a local Expo module (Kotlin) for root/debugger detection. Import as `import { runSecurityChecks } from "shikai-security"` (path alias in tsconfig). The security check runs at app boot and blocks on compromised devices.

**OAuth proxy**: `oauth-proxy/worker.ts` is a separate Cloudflare Worker that exchanges OAuth codes for tokens. Deployed independently from the main app.

## Key Conventions

- **Path aliases**: `@/*` → project root. `shikai-security` → `./modules/shikai-security`.
- **Theme**: Use `useTheme()` from `contexts/ThemeContext` (or re-exported from `constants/theme.ts`). Colors live in `constants/themes.ts`. Never hardcode colors.
- **Fonts**: Inter (body) and JetBrains Mono (code). Loaded in root layout via `@expo-google-fonts/*`.
- **Lists**: Use `@shopify/flash-list` `FlashList`, not `FlatList`.
- **Animations**: `react-native-reanimated` for all animations and gesture-driven interactions.
- **No iOS**: Android-only app. The `ios` folder is gitignored.
- **New Architecture**: Enabled (`newArchEnabled: true` in app.json).
- **React Compiler**: Enabled (`reactCompiler: true` in app.json experiments).
- **Typed Routes**: Enabled (`typedRoutes: true` in app.json experiments).

## Build Gotchas

- After `expo prebuild --clean`, you **must** run `node scripts/post-prebuild.js` to re-apply ABI splits, R8 minification, resource shrinking, and META-INF exclusion patches to `android/app/build.gradle` and `android/gradle.properties`.
- Release builds (`assembleRelease`/`bundleRelease`) need the keystore password set as `SHIKAI_KEYSTORE_PASSWORD` in your shell before running `post-prebuild.js` — it's never hardcoded in the script. Without it, the script skips patching `KEYSTORE_PASSWORD` and warns; the Gradle build then fails at signing.
- `react-native` is pinned to `0.81.5` via `overrides` in package.json - do not upgrade without testing.
- `.env` contains `EXPO_PUBLIC_*` variables (GitHub client ID, OAuth proxy URL). These are baked in at build time.
- `dist/` is the web build output (Cloudflare Workers serves from there).
- `wrangler.jsonc` configures the web deployment; `oauth-proxy/wrangler.toml` is separate.

## Token & Auth Flow

OAuth uses PKCE flow. Tokens are stored in `expo-secure-store` (Keychain/Keystore) via `lib/secure-storage.ts`. PATs (optional, for notifications) use the same storage. Auth state is managed in `stores/auth.store.ts`. On boot, `app/_layout.tsx` restores tokens from SecureStore and validates them. On 401, the axios interceptor calls `clearAuth()`.

## Caching

MMKV is the disk cache for React Query. Cache is cleared on sign-in and sign-out (`clearAllMMKV()` in `lib/mmkv.ts`). Ephemeral queries (search, etc.) should set `meta.persist = false` to exclude from disk cache. The persister max age is defined in `lib/persister.ts`.
