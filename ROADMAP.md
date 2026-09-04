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
| GitHub URL router                 | `lib/github-url.ts` maps a github.com web URL to an in-app route (repo, PR, issue, commit, compare, releases, blob, tree, user). `useDeepLinks` in `app/_layout.tsx` runs it for links opened into the app and, via `expo-share-intent`, for links shared from the Android share sheet. Unmatched URLs fall back to the browser. Android `intentFilters` for github.com added (no `autoVerify`). (Backlog 3.1) | Done   |
| In-app check annotations          | Tapping a GitHub Actions check in the PR checks list opens `repo/[repoId]/checks/[runId].tsx`: status line, the run's `output` summary via `MarkdownRenderer`, and annotation cards (level icon, `path:line`, title, message, raw details). `fetchCheckRun` and `fetchCheckRunAnnotations` added to `lib/github-rest.ts`; annotations fetch only when `annotations_count > 0`. External CI statuses still link out. Full job logs still open on GitHub. (Backlog 3.3) | Done   |
| File history                      | A "history" button in the file viewer header opens `commits.tsx` with a `path` param. In that mode the branch selector is hidden, the header title is the filename, and the list shows only commits that touched the file. `fetchCommits` / `useCommits` / `queryKeys.repoCommits` gained an optional `path` arg. Each row still opens commit detail. (Backlog 2.1) | Done   |
| Blame                             | A second file-viewer header button (hidden for images/video/PDF) opens `repo/[repoId]/blame.tsx`: a `FlashList` of lines with a left gutter showing short SHA and relative date on each range's first line, alternating tint per range, tap → commit detail. `fetchBlame` in `lib/github-graphql.ts` resolves the ref's tip commit and reads `blame(path)` off it (GitHub's schema puts `blame` on `Commit`, not `Blob`), plus the blob text in the same request via an aliased `object(expression)`. Plain text, no syntax highlighting. (Backlog 2.2) | Done   |
| Discussions viewer                | A "Discussions" row on repo detail, shown only when `repo.has_discussions`, opens `discussions.tsx` (cursor-paginated list) and `discussion/[number].tsx`: category emoji/name pill, "Answered" badge, body and comments via `MarkdownRenderer`, one level of replies indented under each comment. `fetchDiscussions` / `fetchDiscussion` added to `lib/github-graphql.ts`; `useDiscussions` / `useDiscussionDetail` in `hooks/useDiscussions.ts`. (Backlog 4.1) | Done   |

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

**Suggested order:** fold in 5.x opportunistically.
(Phase 1, plus 2.1, 2.2, 3.1, 3.2, 3.3, 4.1 and 4.2, shipped, see Completed. `DiffFileList` and
`DiffCommitList` now exist in `components/repo/`. `parseGitHubUrl` lives in `lib/github-url.ts`;
add route cases there as new screens land.)

### Phase 2 - Code reading

#### 2.1 File history · shipped

See Completed. `fetchCommits` / `useCommits` / `queryKeys.repoCommits` take an optional
`path`. `commits.tsx` reads `path` + `fileName` params: in that mode it hides the branch
selector and sets the header title to the filename. Entry is a `history` header button in
the file viewer. Rows open commit detail as before.

#### 2.2 Blame · shipped

See Completed. Correction to the original sketch below: `blame` lives on `Commit`, not
`Blob` — confirmed against GitHub's public GraphQL schema. `fetchBlame` resolves
`repository.object(expression: ref) { ... on Commit { blame(path) { ranges { ... } } } }`,
plus the blob text in the same request via an aliased `object(expression: "ref:path")`.
`app/(app)/repo/[repoId]/blame.tsx`: `FlashList` of lines, left gutter with short SHA and
relative date on each range's first line, alternating tint per range, tap → commit detail.
Entry is a `feed-person` header button in the file viewer, hidden for images/video/PDF.

Not done: syntax highlighting (plain mono text — the WebView-based `MarkdownRenderer` can't
drive a native gutter, and a from-scratch tokenizer wasn't worth it here) and horizontal
scroll for long lines (lines clip at the screen edge; the tap-through to commit detail is the
way to read a full line for now). `ponytail: plain text and clipped lines, add if people ask`.

### Phase 3 - Triage and navigation

#### 3.1 Universal GitHub URL router · shipped

See Completed. `lib/github-url.ts` holds `parseGitHubUrl`; `hooks/useDeepLinks.ts` runs it
for VIEW links and for share-sheet links via `expo-share-intent`. github.com verified app
links send a plain tap to the GitHub app, so the share sheet is the reliable entry on
Android; the unverified `github.com` VIEW filter only helps on older Android, when the user
opts Shikai in, or when the GitHub app is absent. `blob` drops the ref and `#L` range for
now (the file viewer reads the default branch); `tree` lands on the tree root.

Not done: `#L10-L20` scroll target, `tree` path drill-down. Add route cases to
`parseGitHubUrl` as new screens land.

#### 3.3 In-app check annotations · shipped

See Completed. `app/(app)/repo/[repoId]/checks/[runId].tsx` renders the run's `output`
summary via `MarkdownRenderer` and the annotation list (path, line range, level, title,
message, raw details). `fetchCheckRun` and `fetchCheckRunAnnotations` live in
`lib/github-rest.ts`; `useCheckRun` / `useCheckRunAnnotations` in `hooks/useCheckRun.ts`,
with the annotations query gated on `output.annotations_count > 0`. `CheckSummaryItem` now
carries `runId` so `ChecksSection` routes Actions check-runs into the screen while legacy
external-CI statuses keep `Linking.openURL`.

Not done: full job-step logs (that endpoint redirects to a zip). "Open full logs on GitHub"
covers it. `ponytail: annotations only, add job-log tail if people ask`.

### Phase 4 - Content types

#### 4.1 Discussions viewer · shipped

See Completed. `fetchDiscussions` (cursor-paginated via `useInfiniteQuery`) and `fetchDiscussion`
live in `lib/github-graphql.ts`; `useDiscussions` / `useDiscussionDetail` in
`hooks/useDiscussions.ts`. `discussions.tsx` and `discussion/[number].tsx` are close copies of
the issues screens: category emoji/name pill, "Answered" badge, body and comments via
`MarkdownRenderer`, one level of replies rendered indented under each comment. Entry is a
"Discussions" row in `RepoActivity`, shown only when `repo.has_discussions` (added to
`GitHubRepo`).

Not done: replies beyond the first 10 per comment (mirrors GitHub's own "show more replies"
gap, not wired here). `ponytail: first 10 replies only, add a load-more if threads run long`.

### Phase 5 - PR detail polish

| #   | Item                          | Size | Note                                                                                                                                                   |
| --- | ----------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Line-anchored review comments | S-M  | Use `comment.diff_hunk` and `comment.line` (already in the API response) to show the hunk above each thread instead of bucketing by file path          |
| 5.2 | Reactions row                 | S    | `reactions` counts are already on issues/PRs/comments; render a small emoji-count strip                                                                |
| 5.3 | Issue/PR timeline events      | M    | `GET /repos/{o}/{r}/issues/{n}/timeline`: labels, cross-refs, closed/reopened, force-pushes, linked PRs. Merge into the comment stream by `created_at` |
| ~~5.4~~ | ~~Per-commit diff inside a PR~~ | XS | Done. `DiffCommitList` rows push to the commit detail screen, in the PR and compare screens both.                                                    |

### What each phase needs

- **New REST functions:** `fetchIssueTimeline`.
  (`fetchCommit`, `fetchComparison`, `fetchReleases`, `fetchCheckRun` plus annotations, and
  the `path` arg on `fetchCommits`, done.)
- **New GraphQL queries:** none remaining. (Blame and discussions done.)
- **Config:** github.com `intentFilters` and the `expo-share-intent` SEND target are done.

### Boundary note: writes

`markNotificationAsRead` and `markAllNotificationsAsRead` already exist and are the only write
calls in the app. That is the narrow exception, already taken.

- **Cheap add:** per-row swipe-to-mark-read in the notifications screen if it is not wired yet.
- **Second write, undecided:** `DELETE /notifications/threads/{id}/subscription` for
  "unsubscribe from this thread". Useful for triage but a new kind of write. Leaning toward
  stopping at mark-read to keep the story clean.

---
