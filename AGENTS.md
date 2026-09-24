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

# Regenerate native Android folder (gradle patches come from plugins/)
npx expo prebuild --clean

# Build release APK (after prebuild)
cd android && gradlew.bat assembleRelease

# Build release AAB (Play Store)
cd android && gradlew.bat bundleRelease

# Web deploy (static export → Cloudflare Workers)
npx expo export -p web && wrangler deploy

# Web preview (local)
npx expo export -p web && wrangler dev
```

```bash
# Run tests
npx vitest run
```

Tests live in `lib/__tests__/`. Run `expo lint` and `npx vitest run` before considering a change done.

## Architecture

**Routing**: expo-router file-based routing in `app/`. Entry is `app/_layout.tsx` (root) → `app/(app)/_layout.tsx` → `app/(app)/(tabs)/` (bottom tabs: overview, repos, search, profile).

**Boot flow**: `app/_layout.tsx` drives boot through a single reducer, `bootReducer` in `lib/boot-flow.ts` (phases: `checkingSecurity` → `restoringAuth` → `ready`, with a `blocked` phase for failed security checks). Add new boot states there, not as ad hoc effects in the layout.

**State**: Zustand stores in `stores/` (auth, signin, watchlist, recent-searches). Server state via React Query (`lib/query-client.ts`) with MMKV-backed disk persistence (`lib/persister.ts`). `lib/mmkv.ts` creates the MMKV instance.

**API layer**: `lib/axios.ts` is the configured axios instance (base URL, auth interceptor, rate limit tracking). `lib/github-rest.ts` has all GitHub REST functions. `lib/github-graphql.ts` has GraphQL queries. PAT-based calls use native `fetch` via `fetchWithPAT()` in `github-rest.ts` (not axios).

**Native module**: `modules/shikai-security/` is a local Expo module (Kotlin) for root/debugger detection. Import as `import { runSecurityChecks } from "shikai-security"` (path alias in tsconfig). The security check runs at app boot and blocks on compromised devices.

**OAuth proxy**: `oauth-proxy/worker.ts` is a separate Cloudflare Worker that exchanges OAuth codes for tokens. Deployed independently from the main app.

**Android home screen widget**: `react-native-android-widget` renders `widgets/ContributionWidget.tsx` (a GitHub contribution graph) via `widget-task-handler.tsx` at the project root, registered as a native task outside the RN tree. `lib/widget-data.ts` fetches contribution data and `lib/widget-refresh.tsx` handles theme/color sync (reads the persisted theme straight from MMKV since the widget has no access to React context).

**Error tracking**: `@sentry/react-native`, configured in `lib/sentry.ts`. Release builds upload source maps via `npm run sentry:sourcemaps`.

**OTA updates**: `expo-updates`, handled in `lib/use-ota-updates.ts`.

## Key Files

| File | What it does |
|---|---|
| `app/_layout.tsx` | Root layout. Drives the boot-flow reducer and restores auth tokens on boot. |
| `lib/boot-flow.ts` | Boot state reducer: `checkingSecurity` → `restoringAuth` → `ready`, or `blocked`. |
| `lib/axios.ts` | Configured axios instance: base URL, auth interceptor, rate-limit tracking. |
| `lib/github-rest.ts` | All GitHub REST API functions, plus `fetchWithPAT()` for PAT-based calls. |
| `lib/github-graphql.ts` | GitHub GraphQL queries. |
| `lib/secure-storage.ts` | Token storage wrapper over `expo-secure-store`. |
| `lib/mmkv.ts` | MMKV instance and `clearAllMMKV()`. |
| `lib/persister.ts` | React Query disk persister (MMKV-backed), defines cache max age. |
| `lib/query-client.ts` | React Query client configuration. |
| `lib/sentry.ts` | Sentry error tracking setup. |
| `lib/use-ota-updates.ts` | `expo-updates` OTA check/apply hook. |
| `lib/widget-data.ts` | Fetches GitHub contribution data for the home screen widget. |
| `lib/widget-refresh.tsx` | Widget theme/color sync; reads the persisted theme from MMKV directly. |
| `stores/auth.store.ts` | Zustand auth state; `clearAuth()` called on 401. |
| `stores/signin.store.ts` | Sign-in flow state. |
| `stores/watchlist.store.ts` | Watchlisted repos. |
| `stores/recent-searches.store.ts` | Recent search history. |
| `modules/shikai-security/` | Local Expo module (Kotlin): root/debugger detection. |
| `oauth-proxy/worker.ts` | Cloudflare Worker that exchanges OAuth codes for tokens. Deployed separately. |
| `widget-task-handler.tsx` | Native task entry point for the Android home screen widget. |
| `widgets/ContributionWidget.tsx` | Widget UI: the contribution graph. |
| `hooks/` | One React Query hook per GitHub resource (repos, issues, PRs, etc.). |
| `plugins/` | Local config plugins that patch the generated gradle files on every prebuild: R8, resource shrinking, ABIs (`withGradleProperties`), META-INF exclusion and ABI splits (`withAndroidPackaging`), release signing (`withReleaseSigning`). |
| `app.config.ts` | Expo app config: new architecture, React Compiler, typed routes. |
| `contexts/ThemeContext.tsx` | Theme provider; exposes `useTheme()`. |
| `constants/themes.ts` | Theme color definitions. |
| `tsconfig.json` | Path aliases (`@/*`, `shikai-security`). |

## Key Conventions

- **Path aliases**: `@/*` → project root. `shikai-security` → `./modules/shikai-security`.
- **Theme**: Use `useTheme()` from `contexts/ThemeContext` (or re-exported from `constants/theme.ts`). Colors live in `constants/themes.ts`. Never hardcode colors.
- **Fonts**: Inter (body) and JetBrains Mono (code). Loaded in root layout via `@expo-google-fonts/*`.
- **Lists**: Use `@shopify/flash-list` `FlashList`, not `FlatList`.
- **Animations**: `react-native-reanimated` for all animations and gesture-driven interactions.
- **No iOS**: Android-only app. The `ios` folder is gitignored.
- **New Architecture**: Enabled (`newArchEnabled: true` in `app.config.ts`).
- **React Compiler**: Enabled (`reactCompiler: true` in `app.config.ts` experiments).
- **Typed Routes**: Enabled (`typedRoutes: true` in `app.config.ts` experiments).

## Build Gotchas

See `MAINTENANCE.md` for the upgrade schedule, the release steps, and the OTA vs new build rule.

- Custom gradle changes belong in a config plugin under `plugins/`, never in hand edits to `android/`, which prebuild regenerates. A plugin that can't find its anchor in Expo's template throws during prebuild; update the plugin's regex after an SDK upgrade.
- Local release builds (`assembleRelease`/`bundleRelease`) sign with `keystore/release.keystore` (gitignored) and read the password from `SHIKAI_KEYSTORE_PASSWORD` at Gradle time, so it must be set in the shell running Gradle. Without it, the build fails at signing validation. The password is never written to disk.
- `withReleaseSigning` and the ABI splits skip when `EAS_BUILD` is set: EAS signs with its own credentials and expects a single APK.
- `react-native` is pinned to `0.81.5` via `overrides` in package.json - do not upgrade without testing.
- `.env` contains `EXPO_PUBLIC_*` variables (GitHub client ID, OAuth proxy URL). These are baked in at build time.
- `dist/` is the web build output (Cloudflare Workers serves from there).
- `wrangler.jsonc` configures the web deployment; `oauth-proxy/wrangler.toml` is separate.

## Token & Auth Flow

OAuth uses PKCE flow. Tokens are stored in `expo-secure-store` (Keychain/Keystore) via `lib/secure-storage.ts`. PATs (optional, for notifications) use the same storage. Auth state is managed in `stores/auth.store.ts`. On boot, `app/_layout.tsx` restores tokens from SecureStore and validates them. On 401, the axios interceptor calls `clearAuth()`.

## Caching

MMKV is the disk cache for React Query. Cache is cleared on sign-in and sign-out (`clearAllMMKV()` in `lib/mmkv.ts`). Ephemeral queries (search, etc.) should set `meta.persist = false` to exclude from disk cache. The persister max age is defined in `lib/persister.ts`.
