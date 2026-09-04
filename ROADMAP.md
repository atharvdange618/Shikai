# Shikai Roadmap

> **Version:** 1.3.1 · **Last Updated:** September 04, 2026 · **Status:** Active Development

This document tracks the feature backlog and development progress for Shikai.

---

## Completed (since v1.2.0)

| Feature                           | Description                                                                                                                                     | Status |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| GitHub Contribution Streak Widget | Android home screen widget displaying current streak, longest streak, and recent activity. Syncs with app theme and updates on data refresh.    | Done   |
| OTA Updates                       | Silent over-the-air updates via `expo-updates` with EAS build profiles. App checks for updates on launch and applies them transparently.        | Done   |
| SVG and PDF Rendering             | File viewer now supports SVG and PDF files with native rendering. Replaced `VirtualizedCodeViewer` with `MarkdownRenderer` for unified display. | Done   |
| OAuth 2FA Fix                     | Opens OAuth in external browser and handles deep link redirect to survive 2FA authentication flows.                                             | Done   |
| Tooltip Behavior Fix              | Tooltips close on outside press and tab change for cleaner UX.                                                                                  | Done   |
| Mermaid Diagram Improvements      | Improved loading with fetch API and loading placeholders.                                                                                       | Done   |
| Repo Detail Decomposition         | Decomposed repo detail screen into focused sub-components for better maintainability.                                                           | Done   |
| Utility Extraction                | Extracted duplicated utility functions into shared modules.                                                                                     | Done   |
| Scroll Indicator                  | Bouncing chevron on repo details hints at README below the fold. Fades out after scrolling, reappears at top.                                   | Done   |
| Responsive Overview               | Overview screen adapts across mobile sizes. Pinned repos and activity feed scale with screen width.                                             | Done   |
| "Your work" dashboard             | Overview sub-screen listing open items that need you: review requests, assignments, authored issues/PRs, mentions. Four `searchIssues` queries with `@me`, collapsible sections, pull-to-refresh. Shared `IssueResultCard` pulled out of the search screen. (Backlog 3.2) | Done   |
| Gist viewer                       | List any user's gists and a detail screen that renders each file through `MarkdownRenderer`. Reached from a Gists row on your own profile and on searched-user profiles. (Backlog 4.2)                                                                  | Done   |
| Full user repo list               | "See all" link on a profile's Top Repositories opens a full paginated list of that user's public repos using the standard `RepoCard`.                                                                                                                 | Done   |
| Commit detail screen              | Tapping a commit (commits list, PR commits section, repo-detail spotlight) opens a screen with the message, author, SHA, and full diff. `FilesChangedSection` extracted to `components/repo/DiffFileList.tsx`. (Backlog 1.1)                             | Done   |
| Compare two refs                  | `repo/[repoId]/compare.tsx` shows commits and file diffs between a base and head ref. Opened from a compare button on each branch row in the commits screen. `CommitsSection` extracted to `components/repo/DiffCommitList.tsx`. (Backlog 1.2)          | Done   |
| Releases tab                      | A "Releases" row on repo detail (shown when the repo has releases) opens a list, and each opens a detail screen: notes via `MarkdownRenderer`, author, "compare to previous tag", asset rows with size and download count plus source-code zip/tar.gz, each with a Share / Copy link / Download menu. (Backlog 1.3)                                                                    | Done   |

---

## Completed (v1.2.0)

| Feature                             | Description                                                                                                                                                                                                                                                             | Status |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Prefetch Implementation             | Custom prefetch system in `lib/prefetch.ts` with inline press handlers across 8+ screens for speculative data loading.                                                                                                                                                  | Done   |
| File Tree Search                    | `SearchBar` in `app/(app)/(tabs)/repos/[repoId]/files.tsx` filters the flattened file tree by name/path.                                                                                                                                                                | Done   |
| Contribution Stats Summary          | `useContributions` hook computes streaks and most active day; displayed via `ContributionStatsRow` on the Overview tab.                                                                                                                                                 | Done   |
| Repo Health Badges                  | `getHealthBadges()` in repo detail screen flags missing License, Topics, README, and stale repos (>90 days). Warning/danger pill badges in title row.                                                                                                                   | Done   |
| Branch Selector                     | Horizontal pill-based branch picker in file tree and commits views. Fetches branches via `fetchBranches()`, resets tree on switch.                                                                                                                                      | Done   |
| Virtualized File Viewer             | Replaced 500-line truncation with chunk-based FlashList. Files of any length now render smoothly via `VirtualizedCodeViewer` component.                                                                                                                                 | Done   |
| Profile Page Caching                | Heavy caching (30 min staleTime) for user profile, social accounts, and repo count. Pull-to-refresh invalidates all profile queries.                                                                                                                                    | Done   |
| About Screen Redesign               | Hero-focused layout with features list, developer card, open source section, and credits/acknowledgments.                                                                                                                                                               | Done   |
| Brand Compliance                    | Replaced GitHub octocat with Shikai's own logo on sign-in screen. Octocat only used where it links to or indicates GitHub as a service.                                                                                                                                 | Done   |
| React Hooks Bug Fixes               | Fixed hooks-before-early-return in LoadingProgress, missing useMemo import in sign-in screen.                                                                                                                                                                           | Done   |
| In-App Version Check                | Fetches latest GitHub release on mount, compares semver against installed version, shows dismissible update banner. Dismiss state persisted via expo-secure-store.                                                                                                      | Done   |
| In-App README Preview               | WebView-based markdown renderer (`MarkdownRenderer` component) using GitHub's `/markdown` API for 100% GFM fidelity. Renders inline on repo detail screen with themed CSS. Fixed UTF-8 decoding for Japanese/emoji support.                                             | Done   |
| Native Issue/PR Detail Screens      | In-app detail screens for issues and PRs with markdown body + comments rendering via MarkdownRenderer. Navigates from list screens instead of opening external browser.                                                                                                 | Done   |
| Markdown Syntax Highlighting        | GitHub-native `pl-*` CSS classes for syntax-colored code blocks in MarkdownRenderer. Per-block copy buttons, language labels, Mermaid diagram support. Zero JS dependency.                                                                                              | Done   |
| About Page Version Check            | Interactive update status below version badge on about page. Shows loading spinner, "vX.Y.Z available" tappable pill, or green "up to date" checkmark. Shares React Query cache with home tab banner.                                                                   | Done   |
| List Performance Optimization       | Pre-built styles + hoisted `isDark` in RepoCard, `overrideItemLayout`/`getItemType` for FlashList virtualization, `drawDistance: 400`, nested ScrollView removal for topics.                                                                                            | Done   |
| Developer Mode Override             | Developers with Android dev options enabled can now bypass the security block by accepting a risk warning. Root and debugger detection remain hard-blocked. Override persisted via SharedPreferences.                                                                   | Done   |
| Post-Build Automation               | `npm run prebuild:clean` script auto-restores Android build customizations (ABI splits, R8 minification, resource shrinking) that are wiped by `expo prebuild --clean`.                                                                                                 | Done   |
| Global Search                       | New search tab with GitHub Search API integration. Tab switching between repos/users/issues. MiniSearch fuzzy index, debounced input, eager-load pagination. Result cards with user avatars, navigate in-app to repo or user profile.                                   | Done   |
| Saved/Watchlist Repos               | Bookmark toggle on every RepoCard. Local persistence via MMKV. Saved Repos sub-screen under Profile with Stars/Watchlist tabs.                                                                                                                                          | Done   |
| User Profile Screen                 | View any GitHub user's profile - avatar, bio, stats, social links, top repositories. Tappable from search results and contributor lists. Reuses profile layout patterns with skeleton states and pull-to-refresh.                                                       | Done   |
| Profile Declutter                   | Moved Theme, About, and Sign out to Settings screen (gear icon). Profile now shows: user info, stats, social links, GitHub link, Saved Repos, notifications bell + settings gear in header.                                                                             | Done   |
| Keyboard Shortcuts                  | `useKeyboardShortcuts` hook with Cmd+1-4 tab switching, Cmd+F search focus, arrow key list navigation, Escape to dismiss. Haptic feedback on all actions.                                                                                                               | Done   |
| Offline Support                     | Network state manager via `@react-native-community/netinfo`. MMKV-backed React Query disk persistence with 24h max age. Offline banner with safe area support. Ephemeral queries excluded from disk cache.                                                              | Done   |
| Tooltip/InfoDot Components          | Shared `Tooltip` and `InfoDot` components with mutual exclusivity. Used for repo health badges and info hints across the app.                                                                                                                                           | Done   |
| Activity Feed Infinite Scroll       | FlashList-based activity feed with `onEndReached` pagination, `isFetchingNextPage` loading indicator, and grouped consecutive events.                                                                                                                                   | Done   |
| Navigation Overhaul                 | Fixed broken file navigation path, eliminated double auth guard race condition, replaced fragile `__` repoId encoding with safe `~~` separator (updated 19 files), added keyboard shortcuts for all 4 tabs, fixed `router.navigate` vs `push` inconsistency.            | Done   |
| Error Boundaries                    | `ErrorBoundary` class component wrapping root and tabs layouts. Catches render errors and displays fallback UI with "Go to Home" recovery button.                                                                                                                       | Done   |
| 404 Screen                          | Custom `+not-found.tsx` with themed design matching the app. Shows "Go to Home" button instead of default Expo Router 404.                                                                                                                                              | Done   |
| Flash-Free Navigation               | Delayed native splash hide until app is fully ready (auth + security checks). Added `contentStyle` background to all Stack navigators. Wrapped Tabs in background View. Root Stack uses fade animation.                                                                 | Done   |
| Custom Alert System                 | Themed `Alert` component replacing native `Alert.alert()`. Consistent styling with the app's design system.                                                                                                                                                             | Done   |
| Safe Repo ID Encoding               | `encodeRepoId`/`decodeRepoId` utility functions with `~~` separator. Replaces fragile `__` encoding across 19 files.                                                                                                                                                    | Done   |
| MMKV Cache Clearing                 | Clear MMKV cache on sign-in and sign-out to prevent stale data.                                                                                                                                                                                                         | Done   |
| Custom Theme Engine                 | User-selectable themes with 5 palettes (Light, Dark, Tokyo Night, Dracula, Atom One Dark). Theme picker in profile settings, MMKV persistence, theme-specific contribution graph colors.                                                                                | Done   |
| Notifications-Lite / Attention Feed | GitHub notifications API (`/notifications`) with attention-worthy filtering (review requests, mentions, assignments). Accessible via bell icon in Profile header. All/Unread/Attention filters, mark-all-read, FlashList virtualization, tap-to-navigate to issues/PRs. | Done   |
| Tab Reorganization                  | Consolidated 7 tabs to 4 (Overview, Repos, Search, Profile). Stars + Watchlist merged into "Saved Repos" sub-screen under Profile. Notifications moved to Profile header bell icon. Keyboard shortcuts updated for 4 tabs.                                              | Done   |
| Following Activity Feed             | Dashboard-style feed showing recent activity from users you follow on GitHub. Uses `/user/received_events` API. Accessible via "Following" button in Overview. Avatar, actor name, event details with tap-to-navigate.                                                  | Done   |

---

## Backlog

Read-only value additions, sequenced so each item unlocks the next. The through-line:
Shikai already has a working diff renderer (`file.patch` in a ```diff fence handed to
`MarkdownRenderer`with a repo`context`). Commit detail, compare, and release diffs all
reuse it. No new diff engine.

Already shipped and not repeated below: the PR diff view with file-level review threads,
checks, reviewers, and a commits list; `markNotificationAsRead` / `markAllNotificationsAsRead`
(the only write calls, and the whole write exception).

**Suggested order:** 3.1 → 3.3 → 2.1 → 2.2 → 4.1 → fold in 5.x opportunistically.
(Phase 1, plus 3.2 and 4.2, shipped, see Completed. `DiffFileList` and `DiffCommitList`
now exist in `components/repo/`.)

### Phase 2 - Code reading

#### 2.1 File history · size S · depends on 1.1

- **API:** add an optional `path` arg to `fetchCommits` (it already forwards params).
  `GET /repos/{o}/{r}/commits?path={path}&sha={branch}`.
- **Route:** reuse `commits.tsx`. When it gets a `path` param, set the title to the filename
  and pass `path` through. Each row → commit detail.
- **Entry:** a header button on `app/(app)/repo/[repoId]/file.tsx`.

#### 2.2 Blame · size L · depends on 1.1

- **API:** GraphQL only. `repository.object(expression: "{ref}:{path}") { ... on Blob { blame
{ ranges { startingLine endingLine commit { oid message author { name } committedDate } } } } }`.
  Add to `lib/github-graphql.ts`.
- **Route:** `app/(app)/repo/[repoId]/blame.tsx` with `path` and `ref`.
- **UI:** file lines with a left gutter showing short SHA plus relative date; tinted band per
  range; tap a range → commit detail. The work is line rendering plus virtualization for big
  files. Reuse the mono-font line approach from the file viewer.

### Phase 3 - Triage and navigation

#### 3.1 Universal GitHub URL router · size M · highest daily-use payoff

The app only registers `shikai://` today. Nothing catches `github.com` links.

- **Config:** add Android `intentFilters` in `app.config.ts` for `https://github.com` and
  `https://www.github.com`. Skip `autoVerify` at first; the app just shows in the chooser,
  which is fine. Keep the `shikai` scheme.
- **Parser:** `lib/github-url.ts`, pure function `parseGitHubUrl(url): Href | null`:
  - `/{o}/{r}` → repo detail
  - `/{o}/{r}/pull/{n}` (+ `/files`) → PR detail
  - `/{o}/{r}/issues/{n}` → issue detail
  - `/{o}/{r}/commit/{sha}` → commit detail (1.1)
  - `/{o}/{r}/compare/{range}` → compare (1.2)
  - `/{o}/{r}/releases`, `/releases/tag/{t}` → releases (1.3)
  - `/{o}/{r}/blob/{ref}/{path}` with `#L10-L20` → file view scrolled to the range
  - `/{o}/{r}/tree/{ref}/{path}` → file tree
  - `/{user}` → user profile
  - no match → `Linking.openURL`, fall back to the browser
- **Root:** a `useDeepLinks` hook in `app/_layout.tsx` that runs the parser and `router.push`es,
  else opens externally.
- **Stretch:** register `android.intent.action.SEND` (text/plain) so links shared from other
  apps land here too.
- **Verify:** on device, tap a github.com link in Gmail, confirm Shikai is in the chooser and
  lands right; an unmatched URL opens the browser. Add route cases as those screens land.

#### 3.3 In-app check annotations · size M · no deps

`ChecksSection` currently does `Linking.openURL(check.url)`.

- **Route:** `app/(app)/repo/[repoId]/checks/[runId].tsx`.
- **API:** `fetchCheckRun` (`GET /repos/{o}/{r}/check-runs/{id}`) plus annotations
  (`/annotations`). Render the run's summary markdown and the annotations (path, line, message,
  level).
- **Skip for now:** full step logs. That endpoint returns a redirect to a zip, much heavier.
  Annotations plus summary cover most "why is it red" cases. Mark it
  `ponytail: annotations only, add job-log tail if people ask`.

### Phase 4 - Content types

#### 4.1 Discussions viewer · size M-L · no deps

- **API:** GraphQL. List: `repository.discussions(first, after) { nodes { number title author
category { name emoji } comments { totalCount } } }`. Detail: body plus
  `comments(first) { nodes { body author replies { nodes { body author } } } }` and `isAnswered`.
- **Routes:** `discussions.tsx` and `discussion/[number].tsx`. Close copies of the issues
  screens; body and comments via `MarkdownRenderer`, "Answered" badge, one level of replies.
- **Entry:** repo detail row, shown only when `repo.has_discussions`.

### Phase 5 - PR detail polish

| #   | Item                          | Size | Note                                                                                                                                                   |
| --- | ----------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Line-anchored review comments | S-M  | Use `comment.diff_hunk` and `comment.line` (already in the API response) to show the hunk above each thread instead of bucketing by file path          |
| 5.2 | Reactions row                 | S    | `reactions` counts are already on issues/PRs/comments; render a small emoji-count strip                                                                |
| 5.3 | Issue/PR timeline events      | M    | `GET /repos/{o}/{r}/issues/{n}/timeline`: labels, cross-refs, closed/reopened, force-pushes, linked PRs. Merge into the comment stream by `created_at` |
| ~~5.4~~ | ~~Per-commit diff inside a PR~~ | XS | Done. `DiffCommitList` rows push to the commit detail screen, in the PR and compare screens both.                                                    |

### What each phase needs

- **New REST functions:** `fetchCheckRun` plus annotations, `fetchIssueTimeline`, plus a
  `path` arg on `fetchCommits`. (`fetchCommit`, `fetchComparison`, `fetchReleases` done.)
- **New GraphQL queries:** blame ranges, discussions list plus detail.
- **Config:** Android `intentFilters` for github.com, optional SEND share target.

### Boundary note: writes

`markNotificationAsRead` and `markAllNotificationsAsRead` already exist and are the only write
calls in the app. That is the narrow exception, already taken.

- **Cheap add:** per-row swipe-to-mark-read in the notifications screen if it is not wired yet.
- **Second write, undecided:** `DELETE /notifications/threads/{id}/subscription` for
  "unsubscribe from this thread". Useful for triage but a new kind of write. Leaning toward
  stopping at mark-read to keep the story clean.

---
