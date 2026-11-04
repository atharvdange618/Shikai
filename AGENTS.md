<!-- Important Rules -->

# Shikai - Agent Guide

Read-only GitHub companion for Android. React Native + Expo SDK 58, expo-router, TypeScript strict mode.

## Current progress (November 3, 2026)

- v1.8.0 shipped as a GitHub APK; Play remains on 1.7.0. Compiler cleanup (`276b580`), browser auth sessions (`8c1fdcb`) and env-template cleanup (`d947b51`) follow that tag.
- The critical black-screen report traced to SDK 58's `shikai://?__expo_url=…` pushing the blank index over Overview. `isDevClientUrl()` now rejects both launcher URL formats for native routing and initial-link replay. Phone replay and app restart show Overview; fresh GitHub OAuth and release-build checks remain pending. See D-038 and `notes/ROADMAP.md`.
- Use Git Bash for commands on this machine. Exported build variables live there, not in Command Prompt or PowerShell.

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

# Build release APKs for GitHub releases (after prebuild; skips Sentry upload)
npm run android:assemble

# Build release AAB (Play Store builds go through EAS, not local Gradle)
eas build --platform android --profile production

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

Deeper docs: `notes/ARCHITECTURE.md` (data flow, token rules, background work) and `notes/DECISIONS.md` (why things are this way; read an entry before undoing it, and add one when you make a call a future reader would question). `notes/GITHUB-QUIRKS.md` lists GitHub API quirks that make Shikai look broken: read it before debugging an empty list, a missing item or a 4xx, and add an entry in the same change whenever a bug traces back to GitHub.

**Routing**: expo-router file-based routing in `app/`. Entry is `app/_layout.tsx` (root) → `app/(app)/_layout.tsx` → `app/(app)/(tabs)/` (bottom tabs: overview, repos, search, profile).

**Boot flow**: `app/_layout.tsx` drives boot through a single reducer, `bootReducer` in `lib/boot-flow.ts` (phases: `checkingSecurity` → `restoringAuth` → `ready`, with a `blocked` phase for failed security checks). Add new boot states there, not as ad hoc effects in the layout.

**State**: Zustand stores in `stores/` (auth, signin, watchlist, recent-searches). Server state via React Query (`lib/query-client.ts`) with MMKV-backed disk persistence (`lib/persister.ts`). `lib/mmkv.ts` creates the MMKV instance.

**API layer**: `lib/axios.ts` is the configured axios instance (base URL, auth interceptor, rate limit tracking). `lib/github-rest.ts` has all GitHub REST functions. `lib/github-graphql.ts` has GraphQL queries. PAT-based calls go through the same axios instance with `patHeaders(pat)` in `github-rest.ts`: the request interceptor leaves an explicit `Authorization` header alone, and the response interceptor only calls `clearAuth()` on a 401 when the rejected token was the session's, so a bad PAT never signs the user out.

**Native module**: `modules/shikai-security/` is a local Expo module (Kotlin) for root/debugger detection. Import as `import { runSecurityChecks } from "shikai-security"` (path alias in tsconfig). The security check runs at app boot and blocks on compromised devices.

**OAuth proxy**: `oauth-proxy/worker.ts` is a separate Cloudflare Worker that exchanges OAuth codes for tokens. Deployed independently from the main app.

**Android home screen widget**: `react-native-android-widget` renders `widgets/ContributionWidget.tsx` (a GitHub contribution graph) via `widgets/widget-task-handler.tsx` (imported from `index.ts`), registered as a native task outside the RN tree. `lib/widget-data.ts` fetches contribution data and `lib/widget-refresh.tsx` handles theme/color sync (reads the persisted theme straight from MMKV since the widget has no access to React context).

**Error tracking**: `@sentry/react-native`, set up in `lib/sentry.ts` and initialized by `initSentry()` from `index.ts`, not the root layout, so a headless WorkManager run reports too. `reportApiError()` sends GitHub 5xx and statuses Shikai never expects, and the axios error interceptor calls it (D-030). EAS uploads native-build source maps; after an OTA, run `npm run sentry:sourcemaps`.

**OTA updates**: `expo-updates`, handled in `lib/use-ota-updates.ts`.

**Notification alerts**: opt-in from Settings, needs a PAT. `lib/background-notifications.ts` defines an `expo-background-task` (WorkManager) task, imported from `index.ts` so it exists when Android wakes the app with no UI. Every 15 minutes or later, it runs `pollNotifications()` from `lib/notification-poller.ts`: participating threads only, `If-None-Match` with the stored ETag so a quiet poll is a free 304, and a marker in MMKV so only threads updated since the last poll alert. It posts up to 3 local notifications plus an "N more" summary; there is no push service. A subscription to the auth store turns alerts off whenever the token or the PAT goes away. `hooks/useNotificationTaps.ts` routes a tapped alert through `parseGitHubApiUrl()` in `lib/github-url.ts`, from both warm and cold starts.

## Key Files

| File | What it does |
|---|---|
| `app/_layout.tsx` | Root layout. Drives the boot-flow reducer and restores auth tokens on boot. |
| `app/+native-intent.tsx` | Drops warm OAuth redirects that would cover sign-in with the blank index. `app/sign-in.tsx` handles the code through its Linking listener or browser auth-session result. Also drops dev-client launch URLs (legacy host and SDK 58 `__expo_url`), github.com links, and cold-start app links that `hooks/useDeepLinks.ts` replays after boot routing. |
| `lib/boot-flow.ts` | Boot state reducer: `checkingSecurity` → `restoringAuth` → `ready`, or `blocked`. |
| `lib/axios.ts` | Configured axios instance: base URL, auth interceptor, rate-limit tracking. |
| `lib/github-rest.ts` | All GitHub REST API functions, plus `patHeaders()` for PAT-based calls. |
| `lib/github-graphql.ts` | GitHub GraphQL queries. |
| `lib/secure-storage.ts` | Token storage wrapper over `expo-secure-store`. |
| `lib/mmkv.ts` | MMKV instance and `clearAllMMKV()`. |
| `lib/persister.ts` | React Query disk persister (MMKV-backed), defines cache max age. |
| `lib/query-client.ts` | React Query client configuration. |
| `lib/sentry.ts` | Sentry setup, token scrubbing, and `reportApiError()` for GitHub failures. Initialized from `index.ts`. |
| `lib/highlight.ts` | `highlightDiff()`: parses a unified patch and colors each hunk by language. Powers the diff screen and review-thread hunks. |
| `lib/file-html.ts` | Builds the WebView page for the code and diff viewers (`buildCodeHtml`, `buildDiffHtml`). Pure functions, covered by Vitest. |
| `app/(app)/repo/[repoId]/pr/[number].tsx` | PR overview: state, compact check and review status, links to the four section screens, description and conversation. D-039. |
| `app/(app)/repo/[repoId]/pr/[number]/` | PR section screens (`files`, `reviews`, `commits`, `checks`) and `thread/[threadId]` for one review thread. Each pages its data and keeps loaded rows on a page error. |
| `lib/pr-review.ts` | Pure PR logic: review threads from comments, check grouping and summaries, each reviewer's latest decision. Covered by Vitest. |
| `components/repo/PRHeader.tsx`, `components/repo/PRList.tsx` | PR screen header (title plus `owner / repo · PR #n`), and the shared FlashList, page state and GitHub link for the section screens. |
| `app/(app)/repo/[repoId]/diff.tsx` | Full-screen diff for one changed file; reads the patch back from the PR, commit or compare query the previous screen cached. |
| `components/shared/PullToRefresh.tsx` | The app's only `RefreshControl`; takes its arc and tray colors from the theme. |
| `lib/use-ota-updates.ts` | `expo-updates` OTA check/apply hook. |
| `lib/background-notifications.ts` | Background alerts task, `enableAlerts()`/`disableAlerts()`, and the auth store subscription that stops alerts on sign-out. |
| `lib/notification-poller.ts` | One background poll: ETag request, marker, and which threads to alert on. No React or native imports, so Vitest covers it. |
| `hooks/useNotificationTaps.ts` | Opens the thread behind a tapped alert, warm or cold start. |
| `lib/widget-data.ts` | Fetches GitHub contribution data for the home screen widget. |
| `lib/widget-refresh.tsx` | Widget theme/color sync; reads the persisted theme from MMKV directly. |
| `stores/auth.store.ts` | Zustand auth state; `clearAuth()` called on 401. |
| `stores/signin.store.ts` | Sign-in flow state. |
| `stores/watchlist.store.ts` | Watchlisted repos. |
| `stores/recent-searches.store.ts` | Recent search history. |
| `modules/shikai-security/` | Local Expo module (Kotlin): root/debugger detection. |
| `oauth-proxy/worker.ts` | Cloudflare Worker that exchanges OAuth codes for tokens. Deployed separately. |
| `widgets/widget-task-handler.tsx` | Native task entry point for the Android home screen widget. |
| `widgets/ContributionWidget.tsx` | Widget UI: the contribution graph. |
| `hooks/` | One React Query hook per GitHub resource (repos, issues, PRs, etc.). |
| `plugins/` | Local config plugins that patch the generated native files on every prebuild: R8, resource shrinking, ABIs (`withGradleProperties`), META-INF exclusion and ABI splits (`withAndroidPackaging`), clearing the restored launch intent in `MainActivity.onCreate` (`withLaunchIntent`), release signing (`withReleaseSigning`). |
| `app.config.ts` | Expo app config: new architecture, React Compiler, typed routes. |
| `contexts/ThemeContext.tsx` | Theme provider; exposes `useTheme()`. |
| `constants/themes.ts` | Theme color definitions. |
| `tsconfig.json` | Path aliases (`@/*`, `shikai-security`). |

## Key Conventions

- **Path aliases**: `@/*` → project root. `shikai-security` → `./modules/shikai-security`.
- **Theme**: Use `useTheme()` from `contexts/ThemeContext` (or re-exported from `constants/theme.ts`). Colors live in `constants/themes.ts`. Never hardcode colors.
- **Fonts**: Inter (body) and JetBrains Mono (code). Loaded in root layout via `@expo-google-fonts/*`.
- **Lists**: Use `@shopify/flash-list` `FlashList`, not `FlatList`.
- **Pull-to-refresh**: Use `PullToRefresh` from `components/shared/PullToRefresh`. A bare `RefreshControl` takes its tray color from the Android platform theme, so a dark app on a light-mode phone draws a white circle.
- **Code and diffs**: Both render through `components/file/CodeViewer.tsx`, colored on device by `lib/highlight.ts` with the page built by `lib/file-html.ts`. Never send code or patches to GitHub's `/markdown` for coloring.
- **Animations**: `react-native-reanimated` for all animations and gesture-driven interactions.
- **Android Modals**: No `zIndex` or `elevation` inside a `Modal`: the shadow shows through the dimmed backdrop as a pale column (`126a254`). Don't slide a bottom sheet in with a Reanimated `entering` animation either: the Modal lays out short and then grows, the animation keeps the first frame, and the sheet floats above the bottom edge. Drive `translateY` with a shared value instead (`8d2f657`). `navigationBarTranslucent` and `statusBarTranslucent` do nothing here, since RN forces both on under edge-to-edge.
- **No iOS**: Android-only app. The `ios` folder is gitignored.
- **New Architecture**: The only option since SDK 55; there is no flag to turn it off.
- **React Compiler**: Enabled (`reactCompiler: true` in `app.config.ts` experiments).
- **Typed Routes**: Enabled (`typedRoutes: true` in `app.config.ts` experiments).

## Build Gotchas

See `notes/MAINTENANCE.md` for the upgrade schedule, the release steps, and the OTA vs new build rule.

- Custom gradle changes belong in a config plugin under `plugins/`, never in hand edits to `android/`, which prebuild regenerates. A plugin that can't find its anchor in Expo's template throws during prebuild; update the plugin's regex after an SDK upgrade.
- Local release builds (`assembleRelease`/`bundleRelease`) sign with `keystore/release.keystore` (gitignored) and read the password from `SHIKAI_KEYSTORE_PASSWORD` at Gradle time, so it must be set in the shell running Gradle. Without it, the build fails at signing validation. The password is never written to disk.
- `withReleaseSigning` and the ABI splits skip when `EAS_BUILD` is set: EAS signs with its own credentials and expects a single APK.
- `react-native` is pinned to `0.88.1` in the dependency and under `overrides` in package.json - do not upgrade without testing. Re-pin after every SDK hop: an npm override must match the direct dependency's spec exactly.
- `.env` contains `EXPO_PUBLIC_*` variables (GitHub client ID, OAuth proxy URL). These are baked in at build time.
- `dist/` is the web build output (Cloudflare Workers serves from there).
- `wrangler.jsonc` configures the web deployment; `oauth-proxy/wrangler.toml` is separate.
- After editing `lib/background-notifications.ts`, press `r` in Metro for a full reload. The module runs side effects when it loads (`defineTask`, the notification handler, the auth subscription), so Fast Refresh keeps the old copy and new exports come back `undefined`.
- `expo-background-task` skips runs while the app is in the foreground, including `triggerTaskWorkerForTestingAsync()`. To test the alerts task, background the app and force the job: `adb shell cmd jobscheduler run -f com.atharvdange618.Shikai <id>`, where `<id>` is the Job Id on the `EXPO_BACKGROUND_WORKER` row of `adb shell am broadcast -a androidx.work.diagnostics.REQUEST_DIAGNOSTICS -p com.atharvdange618.Shikai && adb logcat -d -s WM-DiagnosticsWrkr`. Don't take it from `dumpsys jobscheduler`: `react-native-android-widget` keeps a `WORK_MANAGER_HACK` job there that never runs, so a grep for the package finds a job even when alerts are off. WorkManager gives the job a new ID after each run, and no `ENQUEUED` row means the task is not registered.

## Token & Auth Flow

OAuth uses PKCE flow. Tokens are stored in `expo-secure-store` (Keychain/Keystore) via `lib/secure-storage.ts`. PATs (optional, for notifications, alerts, issue search, Your work, and stargazers) use the same storage. Signing out from Settings (`signOut()` in `lib/session.ts`) deletes both. A 401 mid-session or from the boot token check only clears auth state and keeps the PAT, so sign-in restores it through `restorePATFor()`, which checks the PAT's `/user` login against the account signing in and deletes it on a mismatch or when it can't confirm the owner. Auth state is managed in `stores/auth.store.ts`. On boot, `app/_layout.tsx` restores tokens from SecureStore and finishes without waiting on GitHub; `revalidateSession()` in `lib/session.ts` then checks the token with `GET /user` in the background, and only a 401 signs the user out (D-034). On 401, the axios interceptor calls `clearAuth()`.

## Caching

MMKV is the disk cache for React Query. Cache is cleared on sign-in and sign-out (`clearAllMMKV()` in `lib/mmkv.ts`). Ephemeral queries (search, etc.) should set `meta.persist = false` to exclude from disk cache. The persister max age is defined in `lib/persister.ts`.
