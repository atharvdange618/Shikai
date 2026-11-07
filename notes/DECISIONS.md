# Decisions

A log of calls a future reader might question, with the reason for each. Read an entry before you undo it. `ARCHITECTURE.md` covers how the parts fit, and this file covers why.

## Adding an entry

Add a new entry at the bottom with the next number, and never renumber. When a call changes, leave the old entry where it is. Set its status to `Superseded by D-0NN` and write the new call as a new entry. Use this shape:

```
## D-0NN: Short name of the call

**Date:** YYYY-MM-DD · **Status:** Accepted | Open | Superseded by D-0NN

**Context.** What forced a choice.
**Decision.** What we chose.
**Rejected.** What else we looked at, and why not.
**Consequences.** What this costs, and what it means for future work.
**Revisit if.** The change in the world that would reopen it. Optional.
```

Entries D-001 to D-021 were backfilled on 2026-10-15 from commits, the changelog, `notes/shikai.mdx` and session notes. Where nobody wrote down a date or a reason, the entry says so.

---

## D-001: Shikai is read-only

**Date:** 2026-04-06, in the original brief and the first plan (`4dafe3c`, `shikai-plan.md`) · **Status:** Accepted

**Context.** Shikai began as a mentor's task: build a GitHub dashboard in React Native with Expo, close to the web version. The brief set the scope in capitals: "OUR APP IS READ ONLY WE WILL ONLY SHOWCASE THE DATA WE HAVE FETCHED FROM GITHUB WE WILL NOT LET THE USER EDIT ANYTHING." The plan wrote it down as "No GitHub write operations." Read-only later became part of the product's pitch: a viewing space with no write actions means nothing to worry about breaking. GitHub's own app already covers comments, reviews and merges.
**Decision.** The app makes no write calls to GitHub, with one exception: marking notifications as read (`markNotificationAsRead`, `markAllNotificationsAsRead`). Swipe to mark read and tapping an alert use the same call, so they add no new kind of write.
**Rejected.** Comments, reactions and review actions. Each one adds a new kind of risk and pulls the product toward a full client.
**Consequences.** Tokens only need read scopes, plus `notifications`. Any feature idea that needs a write is out of scope unless this entry changes.
**Open.** `DELETE /notifications/threads/{id}/subscription` (unsubscribe from a thread) is undecided. It's useful for triage, but it's a new kind of write. We lean toward stopping at mark as read.

## D-002: Sign in through a GitHub App, PKCE, a browser auth session and a token proxy

**Date:** 2026-05-07 (`bfb25d0`), external browser on 2026-07-05 (`c07206d`) · **Status:** Accepted

**Context.** Shikai started with PAT-only sign-in, and making users generate a token was a bad first run. OAuth needs a client secret to swap the code for a token, and anything shipped in an APK is public. Sign-in inside an in-app view also broke on GitHub's 2FA and device checks. Later, Google Play rejected a release because its reviewer's sandbox couldn't finish the browser redirect.
**Decision.** Shikai is a GitHub App. Sign-in uses PKCE in the phone's real browser and comes back through `shikai://`. A Cloudflare Worker (`oauth-proxy/worker.ts`) holds the secret and does the swap. It checks the `client_id` and the redirect, and it stores nothing. A Cloudflare dashboard rule rate limits it per IP. "Sign in with a token" lets reviewers and anyone stuck on GitHub's checks paste a PAT instead (`b31dd0e`).
**Update, November 3, 2026.** `8c1fdcb` replaced `Linking.openURL` with `WebBrowser.openAuthSessionAsync` so the browser closes on return. The browser result and the Linking listener both reach the same completion function, with a guard against concurrent exchanges of one code. This follows the v1.8.0 tag. D-038 covers the separate blank-route bug found during phone testing.
**Rejected.** Keeping PAT-only sign-in. Putting the secret in the app. Running a full backend that holds tokens.
**Consequences.** A GitHub App only sees the repos its installation covers. Users who picked "Only select repositories" miss the rest, so Settings links to the installation page (`a62a1e8`). The proxy deploys on its own and has its own `wrangler.toml`.

## D-003: An optional PAT covers what the App token can't

**Date:** about 2026-06-30 (`f794d2c`) · **Status:** Accepted

**Context.** A GitHub App user token can't read notifications, and GitHub never returns private events to it.
**Decision.** Users can add a classic PAT in Settings. It unlocks the Notifications tab, the Following feed, alerts, and private events in Recent Activity. Features that need it stay hidden until a PAT is set.
**Rejected.** Asking for a PAT at sign-in. Most users never need it.
**Consequences.** The app holds two tokens, and they must never mix up. D-004 sets the rules.

## D-004: A PAT never follows one account into another

**Date:** 2026-10-15 (`20b91f3`, `30f012b`) · **Status:** Accepted

**Context.** Signing out left the PAT on the phone. The next account to sign in on that phone picked it up, and saw the first person's notifications.
**Decision.** Signing out deletes the PAT. A 401 mid-session or a failed check at boot keeps it, so the same person gets it back without pasting it again. At sign-in, `restorePATFor()` asks GitHub's `/user` who owns the PAT. On a mismatch it deletes the PAT, and it also deletes it when it can't tell (offline, rate limited, revoked).
**Rejected.** Always deleting the PAT on any auth failure. That works, but it makes users paste it again after every expired session.
**Consequences.** Pasting a token again is cheap, and showing one account's notifications to another isn't. When in doubt, the code deletes. The boot path and the poller read the PAT directly. That's safe because the only way a PAT reaches a new account is sign-in, and sign-in runs the check.

## D-005: A rooted device is blocked, with no override

**Date:** not recorded · **Status:** Accepted

**Context.** A review pointed out that the root check will also block GrapheneOS, LineageOS and phones with unlocked bootloaders.
**Decision.** Keep the hard block. Only the debugger and developer mode checks get an "I'm a developer" override.
**Rejected.** A root override. Shikai's users are mainstream Android users. On this audience, a tripped root check more likely means a hacked or pirated setup than a privacy-focused ROM.
**Consequences.** Some power users can't use the app. Don't raise this again in reviews as an open bug.
**Revisit if.** Marketing starts aiming at privacy-focused or de-Googled Android users.

## D-006: The React Query cache persists to MMKV and resets on account change

**Date:** 2026-06-29 to 2026-06-30 (`cc22322`, `a9cf221`) · **Status:** Accepted

**Context.** The app should open fast and show something offline. Cached data also belongs to one account.
**Decision.** React Query persists to MMKV for 24 hours. Short-lived or private queries opt out with `meta.persist = false`. Sign-in and sign-out call `clearAllMMKV()`, which also resets the watchlist and recent searches.
**Rejected.** AsyncStorage. MMKV is synchronous and about 30 times faster, and a thin async wrapper makes it fit React Query's persister. Persisting everything, which put search terms on disk (`4110849`).
**Consequences.** Every new MMKV-backed store must join `clearAllMMKV()`. Anything kept there on purpose across sign-outs needs its own instance, a lesson from the onboarding flag bug (`0fd2e98`).

## D-007: react-native is pinned to 0.81.5

**Date:** 2026-06-19 (`bdeb53c`) · **Status:** Accepted, reason not recorded

**Context.** The pin came in through `overrides` in `package.json`. The commit doesn't say why.
**Decision.** Keep it until the next SDK upgrade. `notes/MAINTENANCE.md` says to remove it during each SDK upgrade, and to pin again only if a patch release causes trouble.
**Consequences.** If you find the real reason, write it here. Pin moved to 0.88.1 in the SDK 58 upgrade, and `notes/MAINTENANCE.md` now says to re-pin after every SDK hop, not only after a bad patch release.

## D-008: Boot runs through one reducer

**Date:** 2026-09-18 (`6ef14fb`, `46a80d8`) · **Status:** Accepted

**Context.** Boot used to be a chain of `useEffect`s and refs in `app/_layout.tsx`. Two regressions got past `tsc` and lint: an OAuth code race from a second deep link handler, and an MMKV bug with the onboarding flag.
**Decision.** One pure reducer, `bootReducer` in `lib/boot-flow.ts`, with the states `checkingSecurity`, `blocked`, `restoringAuth` and `ready`. It has its own unit tests.
**Rejected.** Patching the effect chain again.
**Consequences.** New boot states go into the reducer. If boot breaks, check the reducer tests first. They're the one part of boot you can test without a phone.

## D-009: Gradle changes go in config plugins, never in `android/`

**Date:** 2026-09-24 (`19a0ec6`) · **Status:** Accepted

**Context.** `npx expo prebuild --clean` rebuilds `android/` from Expo's template, so hand edits disappear. A `post-prebuild.js` script used to patch it after the fact.
**Decision.** Every Gradle change lives in a config plugin under `plugins/`. Each plugin throws when it can't find its anchor in the template. Signing reads `SHIKAI_KEYSTORE_PASSWORD` at build time. Signing and ABI splits skip on EAS.
**Rejected.** Committing `android/`. Keeping the post-prebuild script.
**Consequences.** After an SDK upgrade, a plugin can throw during prebuild. Update its regex to match the new template.

## D-010: Play builds come from EAS and GitHub APKs are local, so native changes need a store build

**Date:** written down 2026-09-24 · **Status:** Accepted

**Context.** An OTA update only works when the JS matches the native code in the build that receives it.
**Decision.** Play Store releases build on EAS and go out through `eas submit`. GitHub release APKs come from a local `assembleRelease`. Local builds have no update channel, so they never get OTA. Any change that adds or bumps native code ships as a store build.
**Rejected.** Sending OTA updates to every build with the same version.
**Consequences.** Before an OTA, check every EAS build that shares the version for the native packages the new JS needs. EAS keeps separate variable sets for `preview` and `production`. Set both, or a build ships with `undefined` config: one did on 2026-09-02.

## D-011: PDFs load through `fetch` and a base64 data URI

**Date:** 2026-09-06 · **Status:** Accepted

**Context.** `react-native-pdf` downloads through `react-native-blob-util`. Blob-util's "trust all certs" default crashes on modern Android, and it can't follow GitHub's redirect from `raw.githubusercontent.com`.
**Decision.** Fetch the bytes with React Native's own `fetch`, build a `data:application/pdf;base64,...` URI, and pass that to `<Pdf>` with `trustAllCerts={false}`. The library then makes no network calls.
**Rejected.** Fixing blob-util. Google's online PDF viewer, which would send the file to a third party.
**Consequences.** The whole PDF sits in memory while it's open. That's fine for normal repo PDFs. If a big one ever hurts, download it to disk with `expo-file-system` and pass a `file://` URI.

## D-012: No @pierre/diffs or @pierre/trees

**Date:** 2026-09-28 · **Status:** Superseded by D-031

**Context.** Both libraries look good, but they need `react-dom` and shadow DOM, so they only run inside a WebView.
**Decision.** Keep the native diff view (a `diff` fence in `MarkdownRenderer`) and the `FlashList` file tree.
**Rejected.** Both libraries. They would cost WebView startup time, nested scrolling, theme bridging and Shiki's bundle size, for an uncertain gain. `trees` is also in beta and would duplicate a working screen.
**Revisit if.** Diff rendering becomes a real complaint. Then try a full-screen `"use dom"` prototype for a single file.

## D-013: React Navigation runs ahead of Expo's ranges through the lockfile only

**Date:** 2026-10-15 · **Status:** Accepted

**Context.** A deprecation warning about passing an object to `navigate` only goes away in bottom-tabs 7.18 or later, which needs native 7.3.1 or later. Raising the ranges in `package.json` breaks `npx expo install --check`.
**Decision.** The lockfile pins the group at 7.21. `package.json` keeps the ranges Expo SDK 54 expects. EAS installs with `npm ci`, so it gets the lockfile versions.
**Consequences.** Don't raise the ranges in `package.json`. If a fresh lockfile ever resolves bottom-tabs below 7.18, the warning comes back.

## D-014: Alerts come from polling on the phone, not push

**Date:** 2026-10-15 (`640a3fe` and following) · **Status:** Accepted

**Context.** Users wanted to hear about review requests and mentions without opening the app. Push would need a server that holds users' tokens and polls GitHub for them, or a webhook setup on every repo.
**Decision.** An `expo-background-task` job polls `GET /notifications?participating=true` every 15 minutes or later. A conditional request with the stored ETag makes a quiet poll a free 304. Alerts are opt-in and need a PAT.
**Rejected.** A push server, which would break "no tokens off the device" and add a service to run. Polling every thread instead of only participating ones, which would be noisy and use more rate limit.
**Consequences.** Android decides when the job runs, so alerts can come late when the phone saves battery. Dev builds lose the task when Metro is gone (see `ARCHITECTURE.md`), so test alerts on release builds.

## D-015: Agent session transcripts never go to the public repo

**Date:** 2026-10-10 (`7e6f4a0`) · **Status:** Accepted

**Context.** The Entire CLI records agent sessions as git refs and pushes them on `git push` by default. Origin is public, and those sessions have touched `.env` files and service credentials.
**Decision.** Set `push_sessions: false` and `telemetry: false` in `.entire/settings.json`.
**Consequences.** If you want sync, push to a private remote with `--checkpoint-remote`. After any Entire upgrade, check that `entire status` still shows checkpoint pushing as disabled.

## D-016: A thin axios client instead of Octokit

**Date:** 2026-04-06, in the first plan (`4dafe3c`) · **Status:** Accepted

**Context.** GitHub's official `@octokit/rest` targets Node.js and browsers.
**Decision.** One axios instance (`lib/axios.ts`) serves both REST and GraphQL. Its interceptors track the rate limit for the whole app and handle 401s, and the same code path carries both the session token and a PAT.
**Rejected.** Octokit. It would need plugin adapters for the two-token setup, and it weighs about 50 KB against about 15 KB.
**Consequences.** Endpoint types are ours to write and keep up to date, in `lib/github-rest.ts` and `lib/github-graphql.ts`.

## D-017: REST by default, GraphQL where it saves requests

**Date:** 2026-04-06, in the first plan (`4dafe3c`) · **Status:** Accepted

**Context.** GitHub has two APIs. Some data only exists in GraphQL, and some is simpler and better documented in REST.
**Decision.** REST covers repos, commits, issues, PRs, files and notifications. GraphQL covers what REST can't do in one call: the contribution graph, pinned repos, aggregate stats, blame and discussions.
**Consequences.** Before adding an endpoint, check whether it exists in REST. Use GraphQL only when REST would take several calls or lacks the data.

## D-018: Code and markdown render in a WebView, and repo content counts as untrusted

**Date:** hardened on 2026-09-06 (`06d9ced`) · **Status:** Superseded in part by D-025 (code files)

**Context.** Native syntax highlighters for React Native are unmaintained. A WebView with Prism.js handles over 100 languages with no extra native code. But READMEs and files come from any repo, so the page can hold hostile content.
**Decision.** `MarkdownRenderer` renders code, markdown, diffs and mermaid in a WebView. Mermaid runs at `securityLevel: 'strict'` from a CDN URL pinned to an exact version. Link taps open in the system browser instead of moving the WebView. `allowUniversalAccessFromFileURLs` is off, and `originWhitelist` stays narrow.
**Rejected.** `react-native-syntax-highlighter` and other native options.
**Consequences.** Every WebView change keeps these settings. Features that need per-line data, like exact `#L` scroll, measure inside the WebView and report back.

## D-019: OTA updates ask before they restart the app

**Date:** 2026-08-19 (`c7641fb`) · **Status:** Accepted

**Context.** OTA updates used to download quietly and call `reloadAsync()` at once, which could restart the app under someone mid-scroll or mid-search.
**Decision.** `lib/use-ota-updates.ts` exposes `updateReady` and `reload`. A restart prompt lets the user decide when.
**Consequences.** An update reaches a user only after they accept the prompt or start the app again.

## D-020: GitHub links open inside Shikai when a screen exists for them

**Date:** 2026-06-27 onward (`8c39109`, `b848613`, `b9d6913`) · **Status:** Accepted

**Context.** Early builds sent many taps to the browser, which pulled people out of the app.
**Decision.** Issue, PR, commit, check and repo links route to in-app screens through `parseGitHubUrl()` and `parseGitHubApiUrl()` in `lib/github-url.ts`. Links Shikai has no screen for open in the browser.
**Consequences.** A new screen should add its route case to `lib/github-url.ts`, so links from the feed, share sheet and alerts reach it. `useDeepLinks` is the only handler for github.com links opened into the app: `app/+native-intent.tsx` makes expo-router drop them, so don't add an app route that mirrors a GitHub path. A link opened into the app while signed out and running is dropped, but a link shared to it waits and opens after sign-in.

## D-021: Navigation is tabs plus stacks, with no drawers, and the file explorer is a full screen

**Date:** 2026-04-11 to 2026-06-30 (`a8becc5`, `b37998c`, `9a71e5a`) · **Status:** Accepted, two of three reasons not recorded

**Context.** The brief planned all three navigators: tabs, stacks, and a drawer in the repo detail or profile screen. The first plan (`4dafe3c`) kept the drawer for Profile and Settings only. For the file explorer it chose a custom Reanimated slide panel (`FileExplorerPanel.tsx`), because a drawer manages routes and history and a tree view needs neither.
**Decision.** Three changes, in order:
1. The file explorer shipped as a full stack screen, `files.tsx` (`a8becc5`, 2026-04-11). The panel was never built. Reason not recorded.
2. The Profile drawer became a stack (`b37998c`, 2026-06-28), and `fbf3db1` deleted the orphaned `ProfileDrawerContent`. Reason not recorded.
3. Repo and user screens moved out of the tabs into `(app)/repo/` and `(app)/user/`, and push onto the root stack (`9a71e5a`, 2026-06-30). The rewritten plan (`2701e71`) gives the reason: it "avoids the complexity of nested tab+stack navigation and provides a clean back button behavior."
**Rejected.** The drawer navigator and the slide panel from the first plan.
**Consequences.** The app has no drawers, and `@react-navigation/drawer` is no longer a dependency. Every repo screen, the file tree included, is a route, so deep links and alerts can open it. New detail screens go under `(app)/repo/` or `(app)/user/`, not inside a tab.

## D-022: Alerts count a thread read seconds after its update as unread

**Date:** 2026-10-25 · **Status:** Accepted

**Context.** Alerts only fired for `unread` threads, and on one account none ever fired. GitHub marks a thread read when anything loads the tracking image in its notification email. On that account something loaded it 1 to 5 seconds after each email arrived, so every thread was read before the 15-minute poll saw it. Mail clients that preload images, like Apple Mail Privacy Protection, cause the same for their users, and we can't ask everyone to change their mail settings.
**Decision.** `planAlerts` in `lib/notification-poller.ts` also alerts on a read thread when `last_read_at` lands between 0 and 2 minutes after `updated_at`. The user's own activity moves `updated_at` past `last_read_at` (a negative gap), so it never alerts. A real read comes minutes or days later.
**Rejected.** Fetching each thread's timeline to see who acted last, which costs a request per thread on every background poll and still misses events like review requests. Leaving it to users to turn off participating email, which most would never find.
**Consequences.** A thread the user really read within 2 minutes, say with the PR open in a browser, still alerts once. If someone else and the user both act on a thread inside one poll window, the user's action hides the other one. The Notifications tab still shows GitHub's own read state.
**Revisit if.** GitHub starts telling apart reads from email images, or a preloader shows up that reads later than 2 minutes after delivery.

## D-023: Stars opens the stargazers list only with push access and a saved PAT

**Date:** 2026-10-26 · **Status:** Accepted

**Context.** Stars, Forks and Commits on the repo screen open lists. Two GitHub changes block the stargazers list. Since mid-2026, `/repos/{owner}/{repo}/stargazers` serves only admins and collaborators ([changelog, 2026-06-30](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/)). For GitHub App tokens it also needs the Contents: write permission ([permissions table](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)). Shikai's app is read-only, so its token got `403 Resource not accessible by integration` even on the signed-in user's own repo. A classic token with `repo` scope got a 200 on the same repo.
**Decision.** Stars is tappable only when the repo's `permissions` says `admin` or `push` and a PAT is saved. `fetchStargazers()` always sends the PAT through `patHeaders()`, never the session token. Without both, Stars shows the count and does nothing, like Watching.
**Rejected.** Adding Contents: write to the GitHub App, which would make every user approve write access to their code for a list of avatars, from an app that promises read-only. Removing the screen, which loses the list for users who have a PAT. Keeping Stars tappable for everyone, which sends most taps to an error.
**Consequences.** Few users see the list, since it needs their own repo and a PAT. Stars and Forks look alike but act differently on most repos. Watching stays inert because the same changelog limits `/subscribers`. `push` stands in for "collaborator", so a triage-only collaborator GitHub would allow still can't open it. Only classic PATs are confirmed; a fine-grained PAT may hit the same Contents: write rule.
**Revisit if.** GitHub drops the Contents: write requirement for App tokens, or the list fails for a viewer with `push` and a classic PAT.

## D-024: Ask for a Play review once, on the fifth signed-in launch

**Date:** 2026-10-26 · **Status:** Accepted

**Context.** Most users are students, so ratings and reviews help Shikai more than sponsorships. A Sponsor link in the app is out: Play's payments policy exempts only tax-exempt donations and bars links to other payment methods.
**Decision.** `expo-store-review` shows Play's review sheet 3 seconds after the fifth launch with a signed-in user, once per install. `lib/review-prompt.ts` holds the counting logic, and `hooks/useReviewPrompt.ts` keeps the count in its own MMKV instance (`shikai-review`), so `clearAllMMKV()` on sign-in and sign-out doesn't reset it. Play's sheet replaces the custom rating modal from 1.6.0, which is gone.
**Rejected.** Asking after an action such as starring a repo, which Shikai can't do since it is read-only. Asking again on a schedule: Play caps the sheet itself and never says whether it showed or whether the user rated, so repeat asks mostly do nothing.
**Consequences.** A user who dismisses the sheet is never asked again. The sheet only shows for Play installs; GitHub APK installs skip it because `isAvailableAsync()` or Play itself declines.
**Revisit if.** Play adds a way to know whether the user rated, or the review count stays flat after 1.7.0 reaches most users.

## D-025: Code files highlight on device; markdown keeps GitHub's renderer

**Date:** 2026-10-27 · **Status:** Accepted

**Context.** Users said code in the file viewer read like a terminal card. Code files went through GitHub's `/markdown` endpoint wrapped in one fenced block, so every open cost a network round trip (about 1.5 s) and the layout was a card inside the screen. A spike on dev Hermes tokenized a 2745-line TypeScript file in 183 ms and a 5266-line file in 299 ms with `@tanstack/highlight`.
**Decision.** Code files render in `components/file/CodeViewer.tsx`, highlighted on device by `@tanstack/highlight` through `lib/highlight.ts`, edge to edge with line numbers, wrap on by default, and the `#L` line marked. Files over 5000 lines or 200,000 characters render as plaintext. Each app theme names a matching syntax theme in `constants/themes.ts`; Tokyo Night uses Nord, since the package ships no Tokyo Night theme. Markdown files stay on `MarkdownRenderer` and GitHub's renderer for full GFM. Since GitHub's HTML has no source positions, a `#L` link into a markdown file scrolls to the line's share of the page height; the old newline count in the first `<pre>` is gone.
**Rejected.** TanStack Markdown for `.md` files: not full GFM, and it escapes raw HTML that READMEs rely on. Keeping code on `/markdown`: slower, and the reason for the complaint. Mapping a markdown `#L` line to the heading above it: more code for links that are rare, since github.com's rendered view ignores `#L` too.
**Consequences.** `MarkdownRenderer` and `blame-highlight.ts` still color with GitHub's `pl-*` classes, so code blocks in a README and a code file can differ slightly in color. Files over 5000 lines, and minified files, lose colors. A `#L` link into a markdown file lands near the line, not on it.
**Revisit if.** Highlighting a 5000-line file takes over a second on a low-end phone, or users ask for exact lines in markdown files.

## D-026: People and fork lists stay off the disk cache

**Date:** 2026-10-28 · **Status:** Accepted

**Context.** Stargazers, forks, followers and following are paged lists that can run to 400 pages. Under D-006 they persisted to MMKV like any other query, so every page a user scrolled through stayed on disk for 24 hours.
**Decision.** `useStargazers`, `useForks`, `useFollowers` and `useFollowing` set `meta: { persist: false }`. They still cache in memory for 5 minutes (`PAGED_LIST_STALE_TIME`).
**Rejected.** Persisting them: users rarely reopen these lists after a restart, and the stargazers list is fetched with the PAT, which D-006 keeps off disk.
**Consequences.** Opening one of these lists after a cold start shows a spinner instead of cached rows.
**Revisit if.** Users reopen these lists often enough that the spinner gets complaints.

## D-027: Issue search runs on the PAT

**Date:** 2026-10-30 · **Status:** Accepted

**Context.** `/search/issues` returns 200 with 0 items for every query on the App token (D-002), even `repo:microsoft/vscode is:open`, which finds 21,957 with no token at all. Your work and the Issues tab in Search looked empty instead of broken. The cause is inferred from results: the App token seems to limit issue search to repos where the app is installed, like D-023.
**Decision.** `searchIssues()` takes a PAT. `useMyWork` and the Issues tab in `useGlobalSearch` only run with a saved PAT, and without one the screens say a PAT is needed and link to Settings.
**Rejected.** Searching with no token: no private repos and 10 requests a minute. Asking users to install the app on all their repos: it still misses public repos they don't own, where most review requests and mentions come from.
**Consequences.** Your work and issue search need a PAT, like Notifications (D-003). Classic PATs are confirmed to work; fine-grained PATs are untested.
**Revisit if.** GitHub lets App user tokens search issues outside installed repos.

## D-028: Activity feeds sort by date and show only what GitHub's events API returns

**Date:** 2026-10-30 · **Status:** Accepted

**Context.** Recent Activity and the Following feed read `/users/{user}/events` and `/users/{user}/received_events`. On 2026-10-30, a user reported that NFC-Manager and Toolchain never showed in Recent Activity. `gh api /users/atharvdange618/events` showed three limits on GitHub's side:
- The API keeps at most 300 events and about 30 days. Busy repos fill it: 117 Shikai and 87 yt-prototype events pushed NFC-Manager and Toolchain to positions 150 to 268, page 8 or later at 20 a page.
- The feed is not in date order. That one response had 83 inversions, and a 2025-06-23 event sat near position 207.
- Some pushes never get an event. Toolchain's push on 2026-10-30 (`pushedAt` 08:48Z) had no PushEvent, though its commits and `pushedAt` showed it.

**Decision.** `sortEventsNewestFirst()` in `lib/github-utils.ts` sorts the loaded events in `useEvents` and `useReceivedEvents`. Beyond that, the feeds show what the API returns. Shikai can't show events that fall past the 300 cap or that GitHub never created.
**Rejected.** Fetching every page up front: it costs up to 15 requests per load and still misses events GitHub never created. Rebuilding activity from per-repo commits: one request per repo, and it drifts from what github.com shows.
**Consequences.** Loading the next page can drop a newer event in above rows already on screen. When a user reports a missing repo or push, check the raw API with `gh api /users/<login>/events --paginate -q '.[] | "\(.created_at) \(.type) \(.repo.name)"'`. If the event is missing there or past position 300, the gap comes from GitHub, not Shikai.
**Revisit if.** Users keep asking for recently active repos. A "recently pushed repos" row from `/user/repos?sort=pushed` would cover both the buried repos and the missing pushes; it isn't built yet.

## D-029: The theme survives a cache wipe

**Date:** 2026-10-30 · **Status:** Accepted

**Context.** `clearAllMMKV()` clears React Query's disk cache and resets every MMKV-backed store on Clear cache, sign-in and sign-out, so account data can't leak into the next account. The theme lived in the same MMKV instance, so a wipe sent the app back to Dark on the next launch. Users read that as a bug: the palette is a device preference, not something tied to the account.
**Decision.** `clearAllMMKV()` reads `THEME_KEY` before `mmkv.clearAll()` and writes it back after. `THEME_KEY` lives in `lib/mmkv.ts` so `ThemeContext` and the widget task handler share one constant. The theme is a device setting, so it stays put while account data goes.
**Rejected.** A separate MMKV instance for device settings, like the review counter's (`shikai-review`, D-024): one more instance and one more place to remember for a single key the shared wipe can handle. Keeping the theme only in React state and re-saving it after the wipe: the context reads MMKV on launch, so a cold start after a wipe would still fall back to Dark.
**Consequences.** Clear cache no longer resets appearance. Any other key that must survive a wipe has to be saved and restored in `clearAllMMKV()` explicitly; a new store that isn't added there is wiped (which is the safe default for account data).
**Revisit if.** A second device-level setting needs the same treatment; at that point a dedicated settings instance beats growing the save-and-restore list.

## D-030: Sentry gets only the GitHub errors that point at a problem

**Date:** 2026-11-01 · **Status:** Accepted

**Context.** Request errors end in React Query, which keeps them out of Sentry, so Sentry showed no API errors at all. The monthly "4xx by endpoint" check could never find anything.
**Decision.** The axios error interceptor calls `reportApiError()` in `lib/sentry.ts`. It sends 5xx and any status Shikai never expects, tagged `http.status_code` and `endpoint`, one issue per endpoint and status. It skips 0 (offline, timeout) and 401, 403, 404, 409, 410, 422, 429 and 451, which GitHub sends for ordinary reasons (`notes/GITHUB-QUIRKS.md`; 429 is the secondary rate limit). The endpoint tag keeps only known GitHub path words; owner, repo, username and ids become `:x`, so no report names a person. The same method, endpoint and status goes out at most once a minute, because React Query retries a failed query up to 3 times and screens share queries, so one outage would otherwise send the same event many times.
**Rejected.** Reporting every 4xx: a 404 on a private repo or a 403 on the rate limit happens daily and would bury real problems and spend the free event quota. Sending the raw URL: it carries usernames, against the no-PII rule in `lib/sentry.ts`. Reporting from `QueryCache.onError`, which fires once after retries: it doesn't see the method or URL, and it misses calls made outside React Query, such as the background poller.
**Consequences.** A deprecation that answers with an expected status (say 404 or 410) stays invisible. A new endpoint whose path words are missing from `ENDPOINT_WORDS` groups less precisely but never leaks. Event counts undercount an outage: a minute of failures on one endpoint shows as one event. The dedupe lives in memory, so a restart clears it. `initSentry()` runs in `index.ts`, not `app/_layout.tsx`, because a headless WorkManager run never loads the layout; until 2026-11-01 that meant a 5xx from the poller went nowhere. The widget fetches with `fetch`, not the axios instance, so `lib/widget-data.ts` calls `reportApiError()` itself on a non-OK response; until 2026-11-01 a widget 5xx went nowhere. GraphQL errors inside a 200 still go unreported there.
**Revisit if.** GitHub starts answering deprecated endpoints with a status in the skip list.

## D-031: Diffs highlight on device and open full screen

**Date:** 2026-11-01 · **Status:** Accepted

**Context.** Testing showed PR, commit and compare diffs still used the old `MarkdownRenderer` code card after D-025 moved code files to `CodeViewer`, and each expanded file cost a GitHub `/markdown` round trip. This is the complaint D-012 said would reopen diffs.
**Decision.** `highlightDiff()` in `lib/highlight.ts` parses a patch, strips the signs and highlights each hunk in the file's language. A file row in `DiffFileList` opens `repo/[repoId]/diff`, which shows the patch in `CodeViewer`'s diff mode (`buildDiffHtml`): old and new line numbers, a sign column, and Wrap and Copy. The screen gets only the file name and source in its params and reads the patch back from the cached PR, commit or compare query, so a large patch never goes through the URL. Review thread hunks render natively in `components/repo/DiffHunk.tsx`, so a long thread list doesn't open one WebView per thread.
**Rejected.** Inline diffs with one auto-height WebView per file: cramped width and nested scrolling. `@pierre/diffs` stays rejected for D-012's reasons.
**Consequences.** Diff colors now match code files. A diff over 5000 lines or 200,000 characters loses colors, same as files. The PR diff list still shows only the first 30 files GitHub returns.

## D-032: One refresh spinner, coloured from the theme

**Date:** 2026-11-01 · **Status:** Accepted

**Context.** Pull-to-refresh was built inline in 19 screens, each passing `tintColor` and `colors` and nothing else. Android draws the tray behind the arc from `progressBackgroundColor`, and RN leaves that to the *platform* theme, so on a phone in light mode every screen showed a white circle over the app's dark background (confirmed on the Narzo on 2026-11-01, on Overview, Repos and repo details). The repo details screen had no pull-to-refresh at all until the same day.
**Decision.** `components/shared/PullToRefresh.tsx` is the only place a refresh control is built. It takes the arc from `colors.accent` (`tintColor` for iOS, `colors` for Android) and the tray from `colors.surface`, all from `useTheme()`, and every screen passes `refreshControl={<PullToRefresh refreshing onRefresh />}`. The component spreads `...rest` before its token props for two reasons: Android's `ScrollView` clones the element passed to `refreshControl` and injects `style` and `children`, which must reach the real `RefreshControl`, and the token props have to win over anything a caller passes so no screen can go off-theme again.
**Rejected.** A helper that returns the element (`pullToRefresh(colors, refreshing, onRefresh)`): same element, but it keeps a props spread at each call site, which is how the 19 copies drifted. Keeping the inline controls and only adding `progressBackgroundColor`: 19 places to keep in sync, and the next screen would forget it.
**Consequences.** A screen with pull-to-refresh must use `PullToRefresh`; `grep RefreshControl` should only hit that file. In the Light theme `colors.surface` equals `colors.background`, so the tray disappears and only the arc shows, which is intended. Other native widgets already read tokens (StatusBar in `app/_layout.tsx`, the Settings `Switch`, every `ActivityIndicator`); this was the only one left on the platform theme.
**Revisit if.** A screen needs a custom indicator (an animated header instead of the native spinner), or RN changes the Android `cloneElement` contract.

## D-033: A cold-start link opens once, not on every start

**Date:** 2026-11-01 · **Status:** Accepted

**Context.** `dc674fe` made `useDeepLinks` push the `shikai://` link that cold-started the app, and after that every later start reopened the same diff. Android hands back the intent that created the app's *task*, not the intent that started this run: `MainActivity` is `singleTask`, the activity keeps its first `ACTION_VIEW` intent, `ActivityRecord.intent` survives the launcher bringing the task back, and RN's `Linking.getInitialURL()` reads `activity.intent`. It is still there after a Metro reload and after the system kills the process in the background. The replay was invisible until `dc674fe`: expo-router made the link the first screen and the boot replace threw it away. Confirmed on the Narzo with `dumpsys activity activities` (the task's intent was a days-old diff link) and by killing the app, bringing the task back, and watching the diff reopen.
**Decision.** Two layers, because a restore and a JS reload reach the same code by different routes.
- `plugins/withLaunchIntent` patches `MainActivity.onCreate` to clear the restored intent (`if (savedInstanceState != null) intent = intent?.setData(null)`) before `super.onCreate`. A restored task announces itself through `savedInstanceState`; expo-linking's lifecycle listener copies `intent.data` into its initial URL inside `super.onCreate`, so the strip has to run first. This is the layer that survives a wiped MMKV (Settings → Clear cache) and a task recreated after a process kill.
- `useDeepLinks` remembers the path it pushed in MMKV (`deep-links.last-initial-link`) and skips an initial link equal to it. A JS reload keeps the activity, so `savedInstanceState` is null and the native strip does nothing; the marker covers that case. A start with no link intent removes the marker, so the same link works again after a plain launch.

`appLinkPath()` also rejects the dev client's `shikai://expo-development-client/?url=…`: it has no route, and pushing it showed "Page not found" on every dev launch. `app/+native-intent.tsx` drops it too, warm or cold.
**Rejected.** Consuming the intent after reading it (`setIntent` clears only the live activity, so a task recreated after a process kill replays the link anyway). Opening the link only when `ExpoLinking.getLinkingURL()` differs from `getInitialURL()`: they differ for a reload, but agree in the restore case, which is the one that hurts. Re-reading `getInitialURL()` after a delay: instrumented runs showed a *different* link aimed at a dead task delivers nothing at all (`null` on the re-read too), so there is nothing to read.
**Consequences.** The marker is account data, so `clearAllMMKV` wipes it, which keeps "a link opened while signed out waits for sign-in" working. Warm links are untouched: they arrive as `url` events and the router opens them itself. Tapping a link into a dead-but-restorable task still shows Overview: Android recycles the existing task (`recycleTask` → `START_TASK_TO_FRONT`) and brings it forward without calling `onNewIntent`, and instrumented runs showed this holds even when the tapped link differs from the task's own (`getInitialURL()` was `null`, and still `null` on an 8-second re-read). A live backgrounded task still receives the link as a warm `url` event, and a `force-stop` drops the task so the next link starts a new one. That is platform behaviour; no app code can see the dropped tap. The plugin throws during prebuild if Expo's template loses `super.onCreate(` or switches `MainActivity` off Kotlin, so an SDK upgrade fails loudly instead of silently dropping the guard.
**Revisit if.** Expo starts providing a first-class "was this intent restored" signal, in which case the Kotlin patch can go. Also if a link that opened nothing is reported: check `getLinkingURL()` first, since a missing link is more likely a manifest filter than this guard.

## D-034: Boot ends before the token check, not after it

**Date:** 2026-11-01 · **Status:** Accepted

**Context.** `restoringAuth` awaited `GET /user` before handing control to `ready`, so the splash stayed up for a whole network round trip. Instrumented on the Narzo it took 800 ms on a good connection, and the axios timeout is 15 s, so a flaky network held the splash that long. The same `catch` treated every failure as a bad token, so opening the app offline (`status: 0`) cleared auth and dropped the user on sign-in. The same run showed the rest of the JS boot is cheap: 408 ms of fonts, 3 ms of security checks, 60 ms for both SecureStore reads.
**Decision.** Boot restores the PAT and token, dispatches `AUTH_RESTORE_COMPLETE` in `finally`, and only then calls `revalidateSession()` (`lib/session.ts`), which runs `GET /user` behind the app. Only a 401 signs the user out; status 0, 403 and 5xx leave the session as restored. The first paint takes the profile from the persisted query cache, and the check writes the fresh one into `queryKeys.user()` with `staleTime: 0`, so `useUser()` doesn't repeat the request. Two smaller ordering fixes came with it: the security check no longer waits for fonts, and the native splash hands over to `AnimatedSplashScreen` on that view's first layout instead of waiting for `ready`.
**Rejected.** Keeping the check on the critical path behind a shorter timeout: startup would still depend on the network. Trusting the stored token with no check: a revoked token would fail on every screen instead of landing on sign-in once.
**Consequences.** A token revoked between sessions shows the app for as long as its first request takes, then signs out. `setAuthReady(true)` now arms the 401 interceptor before the check rather than after, so any request can end the session during boot. Do not read a dev-build startup time as this app's startup time: on the same device a cold start spent 5.7 s in native init and Metro (`isMetroRunning`, dev bundle download, Hermes parsing an unminified bundle) before any app code ran, against 1.3 s of actual boot. Measure on a preview or release build.

## D-035: SDK 56 is skipped on the way to 58

**Date:** 2026-11-03 · **Status:** Accepted

**Context.** Shikai went 54 → 55 → 57 → 58 and never ran SDK 56. Hermes V1 became the default engine in SDK 56, and in apps that load reanimated or worklets it has a memory regression that Expo fixed in expo 57.0.9; Expo's own upgrade advice was to skip 56. Shikai loads both, and the one crash still open in #37 is a `SIGSEGV` inside `libworklets.so`, so 56 was the hop most likely to land back there. The alternative was to take 56, confirm the regression and roll forward, which buys a day of QA for a runtime that ships two SDKs later anyway.
**Decision.** Skip SDK 56. Every other hop keeps its own commit, so a later bug still traces to one SDK (D-036 relies on the same rule).
**Rejected.** Taking 56 with Expo's memory workaround and re-testing: worklets and reanimated are on the path of almost every screen here, so the QA would be the whole list twice for no shipped difference.
**Consequences.** Never roll the branch back below expo `57.0.17`: 56 and early 57 carry the regression. `notes/MAINTENANCE.md` now allows skipping an SDK when the release notes say to, instead of "one at a time" as an absolute.
**Revisit if.** A future SDK needs a change that only landed between 55 and 56, or Expo publishes a fix that makes 56/early-57 safe and someone wants the intermediate hops for a bisect.

## D-036: Defer React Compiler cleanup until after the SDK upgrade

**Date:** 2026-11-03 · **Status:** Accepted

**Context.** The SDK 57 hop brought eslint-config-expo 57 with eslint-plugin-react-hooks 7, which turns on the React Compiler rules `refs`, `set-state-in-effect`, `immutability`, `preserve-manual-memoization` and `purity`. They flagged 25 places in 13 files, all written before the rules existed. Lint is a lint change here, not a runtime one: when the compiler meets one of these patterns it skips that component and leaves it as written, which is what it already did on SDK 55.
**Decision at the SDK hop.** Set the five rules to `warn` for the upgrade commit, then fix them separately. The SDK hop stays an upgrade with no behaviour changes, so a break still traces to one SDK.
**Rejected.** Fixing all 25 inside the hop: it rewrites effects, refs and Reanimated writes across 13 screens, so a bug found in QA could come from the SDK or from the rewrite. Disabling the rules: the warnings would vanish and nobody would come back to them.
**Consequences.** The upgrade deferred the 25 warnings to a separate change after 1.8.0.
**Completed, November 3, 2026.** `276b580` fixed the warnings and restored all five rules to `error`. This cleanup follows the v1.8.0 tag; warnings are no longer the current policy.

## D-037: The tooltip provider sits above the tabs, not inside them

**Date:** 2026-11-03 · **Status:** Accepted

**Context.** `5da3870` put `TooltipProvider` in `app/(app)/(tabs)/_layout.tsx`, which was enough while repo detail lived at `(tabs)/repos/[repoId]`. `9a71e5a` then moved repo and user screens to standalone routes under `app/(app)/`, and the provider stayed behind, so every `InfoDot` in `RepoHeader` read a null context. `InfoDot` renders nothing when the context is missing (`ctx ? ctx.activeId === id : false`), so the health badges drew but tapping them did nothing — no crash, no warning. It survived three releases because only repo headers use `InfoDot` outside the tabs; the Overview stats tooltips (Q4) kept working. Found in SDK 58 QA (Q5).
**Decision.** Render `TooltipProvider` in `app/(app)/_layout.tsx`, wrapping the `Stack` that owns `(tabs)`, `repo` and `user`. One provider covers every screen that can show a tooltip, so "only one tooltip open at a time" holds across the tabs-and-detail boundary too. It still sits inside a navigator, which `useNavigation()` in the provider needs to dismiss on navigation.
**Rejected.** A second provider inside `repo/_layout.tsx`: two contexts, so two tooltips can be open at once, and the next new route group would forget it again. Making `InfoDot` render its own tooltip without a provider: loses the mutual-exclusivity the provider exists for.
**Consequences.** Anything that renders `Tooltip` or `InfoDot` must be below `app/(app)/`; screens outside that group (sign-in) have no tooltip context by design. `grep -r "TooltipProvider" app/` should only hit `app/(app)/_layout.tsx`.
**Revisit if.** A tooltip is needed on a screen outside `(app)`, or the provider's `useNavigation()` call is replaced by expo-router's imperative API.

## D-038: Drop both dev-client launch URL formats before app routing

**Date:** 2026-11-03 · **Status:** Accepted; fresh OAuth verified on a debug and a release build (2026-11-07)

**Context.** After GitHub sign-in, the phone showed a black screen despite Overview being mounted. Native navigation had a second root `index` route with `__expo_url` above `(app)`. Back removed it and restored Overview without a reload. SDK 58 uses `shikai://?__expo_url=…`; the existing helper only recognized `shikai://expo-development-client/?url=…`.
**Decision.** Extend `isDevClientUrl` in `lib/github-url.ts`, which both `redirectSystemPath` and `appLinkPath` already use. Drop launcher links before warm navigation and cold-start replay. Keep OAuth callbacks and ordinary app links on their existing paths.
**Rejected.** A timer, forced reload, or another Overview redirect: each hides the wrong route instead of rejecting the non-route URL that created it.
**Evidence.** The warm-link regression test failed before the change. After it, the routing tests pass and replaying the failing URL leaves Overview visible on the physical Android phone. Restarting the app also restores Overview. A fresh browser OAuth flow and a release-build check remain required.

## D-039: PR overview with separate reading screens

**Date:** 2026-11-04 · **Status:** Accepted

**Context.** Expanded CI jobs pushed descriptions, files, commits and code comments far down the PR page. Issue #42 approves an overview with four section links, using the same navigation for small and large PRs.

**Decision.** Keep title, state, branches, compact status, description and conversation on the existing PR route. Files, review threads, commits and checks each have a separate route in the repo stack. Files open the existing diff viewer; threads open their own view with code context and ordered replies. Commit and check details accept optional PR context. Native stack screens stay mounted under their children, retaining list positions and expansion state on Back; React Query retains loaded pages.

**Data.** Page files, commits, submitted reviews, inline comments, conversation, activity, check runs and legacy statuses. A summary cannot report success while either check source loads, fails or has more pages. Count threads from root comments, never from all comment records. Review summaries load every submitted-review page because later decisions can replace earlier ones. A comment-only review never replaces a reviewer's approval or change request, matching GitHub. Page errors retain loaded rows and offer retry. Bot reports start collapsed.

**Limits.** GitHub exposes at most 250 PR commits and 3,000 files. The section screens keep PR totals separate from loaded counts and link to GitHub for the remainder. The checks screen explains the API's limit of the 1,000 most recent check suites.

**Rejected.** Expanding all four lists on the overview recreates the long page. Repo-wide commit history cannot substitute for PR-scoped commits.

## D-040: The PR section screens reuse the app's existing row and card designs

**Date:** 2026-11-04 · **Status:** Accepted

**Context.** The first cut of the issue #42 section screens invented their own rows: diff counts printed as plain text, review threads as a flat wall of blocks, PR commits as the compact row meant for the collapsible commit card, and checks as a name plus a bare conclusion string. Every one of those already had a better-looking implementation elsewhere in the app.

**Decision.** Reuse, don't redraw. `components/repo/DiffStat.tsx` owns the colored `+N / −M` and the per-file status icon, and `DiffFileList` uses it too. Reviews are light thread cards (file group header, line, two-line body, author, reply count) that open the existing thread screen, which keeps the hunk and every reply. `components/repo/CommitCard.tsx` is the repo commits card, used unchanged by the repo list and by the PR commits screen. Checks rows copy the repo Actions anatomy: status icon from `getRunDisplay`, name, reporting app, branch pill, duration and age.

**Data.** A check row needs more than a conclusion, so `CheckSummaryItem` now carries `status`, `app`, `startedAt` and `completedAt` from the check-run and legacy-status responses. `getCheckDisplay` maps the merged list's two pseudo-conclusions (`pending`, `error`) onto the shared run display.

**Consequence.** A visual change to commits, diff counts or check rows now happens in one place, so the repo screens and the PR screens cannot drift apart.
