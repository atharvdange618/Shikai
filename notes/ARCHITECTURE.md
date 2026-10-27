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
     REST + GraphQL │          │ code →    │ crash reports
     (Bearer token) │          │ token     │ (tokens scrubbed)
                    ▼          ▼           ▼
            api.github.com   OAuth proxy   Sentry
                             (Cloudflare
                              Worker)
```

Three services sit outside the app:

- **GitHub** gets every data request. The app sends them straight from the phone.
- **The OAuth proxy** (`oauth-proxy/worker.ts`) does one job: swap a sign-in code for a token. It exists because that swap needs the client secret, and a secret inside an APK is public. It checks the `client_id` and the `shikai://` redirect, then forwards to GitHub. It stores nothing.
- **Sentry** gets crash reports. `scrubEvent()` in `lib/sentry.ts` strips anything shaped like a GitHub token first, and a self-test at startup throws if the scrubber stops working.

Expo's update server serves OTA updates to EAS builds. Cloudflare also serves the static web export, which is separate from the proxy.

## Credentials

The app can hold two GitHub tokens at once, and most of the auth code exists to keep them apart.

|                 | Session token                                             | PAT                                                      |
| --------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| Comes from      | OAuth (PKCE, external browser), or "Sign in with a token" | The user pastes it in Settings                           |
| What it unlocks | Everything the GitHub App installation covers             | Notifications, alerts, private events in Recent Activity |
| In memory       | `useAuthStore().token`                                    | `useAuthStore().pat`                                     |
| On disk         | `expo-secure-store` via `lib/secure-storage.ts`           | Same                                                     |
| Sent by         | The axios request interceptor, by default                 | `patHeaders(pat)`, set per call                          |

Rules that must keep holding:

1. **A request that sets its own `Authorization` header keeps it.** The interceptor only fills in the session token when no header is set. That's how PAT calls and token checks share one axios instance.
2. **A 401 only signs you out if the session token got it.** `usedSessionToken()` in `lib/axios.ts` compares the header on the failed request with the session's token. A bad PAT never signs anyone out.
3. **A PAT never moves to another account.** Signing out deletes it (`signOut()` in `lib/session.ts`). A 401 mid-session or a failed check at boot keeps it, so the same person gets it back when they sign in again. At sign-in, `restorePATFor(login)` asks GitHub who owns the PAT and deletes it on a mismatch. It also deletes it when it can't tell.
4. **Background alerts stop when access goes.** A subscription in `lib/background-notifications.ts` watches the auth store and turns alerts off when the token or the PAT goes from set to null.

## Boot

`app/_layout.tsx` runs boot through `bootReducer` in `lib/boot-flow.ts`:

```
checkingSecurity ──pass──▶ restoringAuth ──▶ ready
       │
       └──fail──▶ blocked
```

- `checkingSecurity` runs the native root and debugger checks in `modules/shikai-security/`. A rooted device stays blocked. A debugger or developer mode gets an "I'm a developer" override. The blocking screen runs the checks again every 10 seconds, so turning a setting off lets the user in without a restart.
- `restoringAuth` loads the PAT and the session token from SecureStore. It then checks the token with `GET /user`. If that check fails, the app clears auth state and keeps the PAT. Routing then sends the user to sign-in.
- `ready` hands control to expo-router. `AppStack` then replaces the stack with Overview or sign-in. Hooks that open a screen at launch (`useDeepLinks`, `useNotificationTaps`) run after that replace and wait until `lastRoutedToken === token`. Otherwise the replace lands on top of the screen they opened.

The reducer is a pure function with its own tests. Add new boot states there, not as effects in the layout.

## Data and caching

- **Server state** lives in React Query (`lib/query-client.ts`). Every key comes from the `queryKeys` table, and each resource has a hook in `hooks/`. Stale times run from 1 minute (commits, events) to 30 minutes (profiles). The comment at the top of `query-client.ts` lists them.
- **Prefetch.** `lib/prefetch.ts` warms the cache before a screen opens, in three layers. Route prefetch readies the screen. Data prefetch fires on mount or press: for example, search results prefetch repo details as they appear. Chained prefetch fetches what the next screen depends on, like the repo before its file tree. The goal is that screens paint from cache.
- **Disk cache.** React Query persists to MMKV (`lib/persister.ts`) and keeps entries for 24 hours. A query opts out with `meta: { persist: false }`. Use that for anything short-lived or private, like search.
- **Local state** lives in Zustand stores (`stores/`). The watchlist and recent searches each persist to their own MMKV instance.
- **Account switches wipe everything.** Sign-in and sign-out call `clearAllMMKV()`, which clears the cache and resets the persisted stores. Any new store that holds account data must join that function, or it leaks into the next account.

## Work outside the React tree

Android can start the app with no screen to run a widget update or an alerts poll. In that case only `index.ts` and its imports run, so anything a background task needs must be set up at module load.

- **Widget.** `react-native-android-widget` runs `widgets/widget-task-handler.tsx`. The handler can't use React context, so `lib/widget-refresh.tsx` reads the theme straight from MMKV.
- **Alerts.** `lib/background-notifications.ts` defines an `expo-background-task` task. WorkManager runs it every 15 minutes or later, and Android decides the exact timing. Each run calls `pollNotifications()` once:

```
read PAT from SecureStore (none → stop)
  └─ GET /notifications?participating=true  (If-None-Match: stored ETag)
       ├─ 304  → nothing new, done (costs no rate limit)
       ├─ 401  → turn alerts off, flag "PAT rejected" for Settings
       └─ 200  → first run: save a marker, post nothing, so the backlog stays quiet
                  later runs: keep unread threads updated since the marker
                  → post up to 3 alerts plus an "N more" summary
                  → save the new ETag and marker
```

A tap on an alert goes through `hooks/useNotificationTaps.ts` and `parseGitHubApiUrl()`, on both warm and cold starts.

Two traps here:

- **Dev builds lose the task.** A headless start in a dev build loads JS from Metro. If Metro isn't running, `expo-task-manager` unregisters every task (`TaskService.java`, "Host unreachable"). Test alerts overnight on a release APK only.
- **`dumpsys jobscheduler` lies about alerts.** The widget library keeps a placeholder job named `WORK_MANAGER_HACK` that never runs. To see the real alerts job, use WorkManager's diagnostics broadcast. `AGENTS.md` has the command.

## Builds

Play Store builds come from EAS. GitHub release APKs come from a local Gradle build after `npx expo prebuild --clean`, and they never get OTA updates. Any change to native code needs a store build. `notes/MAINTENANCE.md` has the steps and the OTA rule.
