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

## D-002: Sign in through a GitHub App, PKCE, an external browser and a token proxy

**Date:** 2026-05-07 (`bfb25d0`), external browser on 2026-07-05 (`c07206d`) · **Status:** Accepted

**Context.** Shikai started with PAT-only sign-in, and making users generate a token was a bad first run. OAuth needs a client secret to swap the code for a token, and anything shipped in an APK is public. Sign-in inside an in-app view also broke on GitHub's 2FA and device checks. Later, Google Play rejected a release because its reviewer's sandbox couldn't finish the browser redirect.
**Decision.** Shikai is a GitHub App. Sign-in uses PKCE in the phone's real browser and comes back through `shikai://`. A Cloudflare Worker (`oauth-proxy/worker.ts`) holds the secret and does the swap. It checks the `client_id` and the redirect, and it stores nothing. A Cloudflare dashboard rule rate limits it per IP. "Sign in with a token" lets reviewers and anyone stuck on GitHub's checks paste a PAT instead (`b31dd0e`).
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
**Consequences.** If you find the real reason, write it here.

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

**Date:** 2026-09-28 · **Status:** Accepted

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
**Decision.** `expo-store-review` shows Play's review sheet 3 seconds after the fifth launch with a signed-in user, once per install. `lib/review-prompt.ts` keeps the count in its own MMKV instance (`shikai-review`), so `clearAllMMKV()` on sign-in and sign-out doesn't reset it.
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
