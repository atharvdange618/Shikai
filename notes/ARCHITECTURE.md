# Architecture

How Shikai's parts talk to each other, and the rules that keep them safe. For the file map and conventions, read `AGENTS.md`. For why things are built this way, read `DECISIONS.md`.

## The system

Shikai is a phone app that talks to GitHub directly. It has no backend of its own and holds no user data off the device.

```
                 ┌────────────────────────────┐
                 │        Shikai (Android)    │
                 │                            │
                 │  React tree    Headless JS │
                 │  (screens)     (widget,    │
                 │                 alerts)    │
                 └──┬──────────┬───────────┬──┘
     REST + GraphQL │          │ code →    │ crash + API
     (Bearer token) │          │ token     │ failures
                    ▼          ▼           ▼
            api.github.com   OAuth proxy   Sentry
                             (Cloudflare
                              Worker)
```

Three services sit outside the app:

- **GitHub** gets every data request. The app sends them straight from the phone.
- **The OAuth proxy** (`oauth-proxy/worker.ts`) does one job: swap a sign-in code for a token. It exists because that swap needs the client secret, and a secret inside an APK is public. It checks the `client_id` and the `shikai://` redirect, then forwards to GitHub. It stores nothing.
- **Sentry** gets crash reports. `scrubEvent()` in `lib/sentry.ts` strips anything shaped like a GitHub token first, and a self-test at startup throws if the scrubber stops working. GitHub 5xx and unexpected statuses go there too, through `reportApiError()` in the axios error interceptor.

Expo's update server serves OTA updates to EAS builds. Cloudflare also serves the static web export, which is separate from the proxy.

## Credentials

The app can hold two GitHub tokens at once, and most of the auth code exists to keep them apart.

|                 | Session token                                                 | PAT                                                                                           |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Comes from      | OAuth (PKCE, browser auth session), or "Sign in with a token" | The user pastes it in Settings                                                                |
| What it unlocks | Everything the GitHub App installation covers                 | Notifications, alerts, issue search, Your work, stargazers, private events in Recent Activity |
| In memory       | `useAuthStore().token`                                        | `useAuthStore().pat`                                                                          |
| On disk         | `expo-secure-store` via `lib/secure-storage.ts`               | Same                                                                                          |
| Sent by         | The axios request interceptor, by default                     | `patHeaders(pat)`, set per call                                                               |

OAuth opens through `WebBrowser.openAuthSessionAsync` in `app/sign-in.tsx`. The browser result and the Linking callback share a completion path with a guard against duplicate exchanges. `persistSessionCredentials()` checks the saved PAT before saving the session token. The screen updates auth state after that succeeds, and the root layout routes the user to Overview.

Dev-client launch URLs are not app routes. `isDevClientUrl()` recognizes both the old `expo-development-client` host and SDK 58's `__expo_url` query parameter. Both `app/+native-intent.tsx` and initial-link replay use this shared filter. Without it, a launch URL can push the blank root index over Overview (D-038). Current QA status lives in [Roadmap](ROADMAP.md).

Rules that must keep holding:

1. **A request that sets its own `Authorization` header keeps it.** The interceptor only fills in the session token when no header is set. That's how PAT calls and token checks share one axios instance.
2. **A 401 only signs you out if the session token got it.** `usedSessionToken()` in `lib/axios.ts` compares the header on the failed request with the session's token. A bad PAT never signs anyone out.
3. **Check PAT ownership before reusing it.** A 401 on the session token clears auth state in memory and keeps the saved PAT. On the next sign-in, `restorePATFor(login)` checks the owner with GitHub and removes the PAT if the owner differs or can't be confirmed. If that removal fails, sign-in stops before saving the new session.
4. **Background alerts stop when access goes.** A subscription in `lib/background-notifications.ts` watches the auth store and turns alerts off when the token or the PAT goes from set to null.

SecureStore writes and deletes throw `CredentialStorageError` with a fixed message and no native error details. Settings updates the in-memory PAT after storage succeeds. Sign-out deletes the PAT before the session token. If PAT deletion fails, the session stays intact. If session-token deletion fails next, the user stays signed in without the PAT and can retry. A completed sign-out clears auth and both caches.

## Boot

`app/_layout.tsx` runs boot through `bootReducer` in `lib/boot-flow.ts`:

```
checkingSecurity ──pass──▶ restoringAuth ──▶ ready
       │
       └──fail──▶ blocked
```

- `checkingSecurity` runs the native root and debugger checks in `modules/shikai-security/`. A rooted device stays blocked. A debugger or developer mode gets an "I'm a developer" override. The blocking screen runs the checks again every 10 seconds, so turning a setting off lets the user in without a restart.
- `restoringAuth` loads the PAT and the session token from SecureStore in one `Promise.all`, then hands control to `ready` without waiting on GitHub. `revalidateSession()` in `lib/session.ts` checks the token with `GET /user` behind the app: a 401 clears auth state and keeps the PAT, so routing sends the user to sign-in, and anything else leaves the session alone. The profile for the first paint comes from the persisted query cache. A boot that waited on that call stalled for a network round trip (up to the 15s axios timeout) and cleared auth when it failed with no signal (D-034).
- `ready` hands control to expo-router. `AppStack` then replaces the stack with Overview or sign-in. Hooks that open a screen at launch (`useDeepLinks`, `useNotificationTaps`) run after that replace and wait until `lastRoutedToken === token`. Otherwise the replace lands on top of the screen they opened.

The reducer is a pure function with its own tests. Add new boot states there, not as effects in the layout.

## Data and caching

- **Server state** lives in React Query (`lib/query-client.ts`). Shared cache keys live in `queryKeys`, and hooks set stale times for individual resources. File content keys include the ref, and workflow job keys include the run attempt.
- **Prefetch.** `lib/prefetch.ts` loads routes and data before a screen opens. Some requests depend on earlier data, such as the repository's default branch before its file tree. File prefetch uses the same revision as the viewer, and API prefetch entry points skip a known rate limit.
- **Disk cache.** React Query persists to MMKV (`lib/persister.ts`). Its default in-memory `gcTime` matches the 24-hour disk max age, so a query can survive the full offline window even after its screen unmounts (D-043). A query opts out of disk persistence with `meta: { persist: false }`. Use that for short-lived queries such as search and long paged lists such as stargazers and followers (D-026).
- **Local state** lives in Zustand stores (`stores/`). The watchlist and recent searches each persist to their own MMKV instance.
- **Account switches wipe everything.** Sign-in and sign-out call `clearAllMMKV()`, which clears the cache and resets the persisted stores. Any new store that holds account data must join that function, or it leaks into the next account. The one exception is the theme: it's a device setting, not account data, so `clearAllMMKV()` saves and restores it (`THEME_KEY`).

## Repository navigation and pagination

- **Shared files and folders.** `parseGitHubUrl()` preserves the path segments. The `linked-path` route asks GitHub for candidate refs in one GraphQL request and picks the longest matching prefix. It replaces itself with the viewer at the resolved commit. Files opened from that tree, blame, file history and relative Markdown links use the same revision.
- **Headers.** Dynamic titles and actions are applied in the owning route's layout effect. An unexpected setup failure can reach the app's error handling.
- **Releases and Actions.** Release detail looks up its predecessor in GitHub's ordered release list and can follow the next page without the list screen. Actions job requests use the attempt shown on screen, so loading another page cannot switch to a newer rerun. A page error keeps the jobs already loaded.

## Rendering code, diffs and blame

`CodeViewer.tsx` renders a WebView page built by `lib/file-html.ts`. `highlightFile()` and `highlightDiff()` use `@tanstack/highlight` on-device. With wrapping off, the code gutter and both diff number columns stay visible while the text scrolls horizontally. The diff screen reads the patch from the original PR, commit or compare query using the filename and source in the route params.

Blame tokenizes the whole file before attaching GitHub's line numbers and commit ranges. Markdown source-line links use the numbered source viewer. Ordinary Markdown links use GitHub's rendered preview through `MarkdownRenderer`.

## Work outside the React tree

Android can start the app with no screen to run a widget update or an alerts poll. In that case only `index.ts` and its imports run, so anything a background task needs must be set up at module load. Sentry starts there for the same reason (D-030), so a poller failure in a headless run still reports.

- **Widget.** `react-native-android-widget` runs `widgets/widget-task-handler.tsx`. The handler can't use React context, so `lib/widget-refresh.tsx` reads the theme straight from MMKV.
- **Alerts.** `lib/background-notifications.ts` defines an `expo-background-task` task. WorkManager runs it every 15 minutes or later, and Android decides the exact timing. Each run calls `pollNotifications()` once:

```
read PAT from SecureStore (none → stop)
  └─ GET /notifications?participating=true  (If-None-Match: stored ETag)
       ├─ 304  → nothing new, done (costs no rate limit)
       ├─ 401  → turn alerts off, flag "PAT rejected" for Settings
       └─ 200  → first run: save the newest GitHub timestamp, or the epoch if empty
                  → post nothing on this first run
                  later runs: find unseen threads updated since the marker
                  → store the marker and available ETag, then post up to 3 alerts and an "N more" summary
```

A tap on an alert goes through `hooks/useNotificationTaps.ts` and `parseGitHubApiUrl()`, on both warm and cold starts.

Two traps here:

- **Dev builds lose the task.** A headless start in a dev build loads JS from Metro. If Metro isn't running, `expo-task-manager` unregisters every task (`TaskService.java`, "Host unreachable"). Test alerts overnight on a release APK only.
- **`dumpsys jobscheduler` lies about alerts.** The widget library keeps a placeholder job named `WORK_MANAGER_HACK` that never runs. To see the real alerts job, use WorkManager's diagnostics broadcast. `AGENTS.md` has the command.

## Builds

Play Store builds come from EAS. GitHub release APKs come from a local Gradle build after `npx expo prebuild --clean`, and they never get OTA updates. Any change to native code needs a store build. `notes/MAINTENANCE.md` has the steps and the OTA rule.
