# Changelog

## Unreleased

### Features

- **Crash and performance reporting** - Released builds now send anonymous crash reports and sampled performance data to Sentry. No PII, no repository contents, no session replay; GitHub tokens are stripped from every report before it is sent. Disabled in development. Privacy policy, README, and the Play data-safety checklist updated to match. ([`472bdaa`](https://github.com/atharvdange618/Shikai/commit/472bdaa))
- **"Your work" dashboard** - Overview sub-screen listing open items that need you: review requests, assignments, authored issues/PRs, and mentions. ([`27c7664`](https://github.com/atharvdange618/Shikai/commit/27c7664))
- **Gist viewer and full repo list** - Browse any user's gists with file contents rendered through `MarkdownRenderer`, and a "See all" link on a profile's Top Repositories opens the complete paginated repo list. ([`999ad95`](https://github.com/atharvdange618/Shikai/commit/999ad95))
- **Commit detail screen** - Tapping a commit anywhere in the app (commits list, PR commits, repo spotlight) opens its message, author, SHA, and full diff. ([`361ca76`](https://github.com/atharvdange618/Shikai/commit/361ca76))
- **Compare two refs** - Shows commits and file diffs between a base and head ref, opened from a compare button on each branch row in the commits screen. ([`abd153e`](https://github.com/atharvdange618/Shikai/commit/abd153e))
- **Releases tab** - Lists a repo's releases; each opens release notes, a compare-to-previous-tag link, and downloadable assets with size and download count. ([`e0b1783`](https://github.com/atharvdange618/Shikai/commit/e0b1783))
- **GitHub URL deep links** - Opening or sharing a github.com link routes straight to the matching in-app screen (repo, issue, PR, commit, compare, release, file, folder) instead of the browser. A shared folder link now also drills into and expands that folder in the file tree, and a shared file link with a `#L10` line number scrolls the file viewer to roughly that line. ([`d4521ca`](https://github.com/atharvdange618/Shikai/commit/d4521ca), [`bfd1a51`](https://github.com/atharvdange618/Shikai/commit/bfd1a51))
- **In-app check annotations** - Tapping a GitHub Actions check run shows its output summary and annotation details in-app instead of linking out. ([`b9d6913`](https://github.com/atharvdange618/Shikai/commit/b9d6913))
- **File history** - A history button in the file viewer shows only the commits that touched that file. ([`ca71081`](https://github.com/atharvdange618/Shikai/commit/ca71081))
- **Blame** - Line-by-line blame view with commit SHA and date in the gutter, tap-through to commit detail. ([`6ba642d`](https://github.com/atharvdange618/Shikai/commit/6ba642d))
- **Discussions viewer** - Browse a repo's Discussions list and read a thread's comments and replies. ([`acbb9d6`](https://github.com/atharvdange618/Shikai/commit/acbb9d6))
- **Review comment diff context** - Each PR review comment thread now shows its diff hunk above the conversation instead of requiring the file diff to be expanded separately. ([`2b863a0`](https://github.com/atharvdange618/Shikai/commit/2b863a0))
- **Timeline events** - Issue and PR screens merge label, state, and cross-reference events into the comment stream in chronological order. ([`d2feb68`](https://github.com/atharvdange618/Shikai/commit/d2feb68))
- **Reactions** - Emoji reaction counts shown under issue bodies and comments on both issue and PR detail screens. ([`dc53f05`](https://github.com/atharvdange618/Shikai/commit/dc53f05))
- **GitHub icon in the Overview header** - A one-tap link to the app's own repository sits next to the avatar on the Overview screen, so it no longer takes a trip through Profile > Settings > About to find it. ([`3c9c1d1`](https://github.com/atharvdange618/Shikai/commit/3c9c1d1))

### Bug Fixes

- **Notifications lag** - Marking a notification, or all of them, read now updates the list instantly instead of waiting on a full refetch of every loaded page. ([`35741ce`](https://github.com/atharvdange618/Shikai/commit/35741ce))
- **Markdown white flash** - PR and issue bodies and comments, the repo README, and the file viewer no longer flash white for a few frames when they open or when the theme is toggled. The WebView stays hidden until its content paints, then fades in. ([`f7944b0`](https://github.com/atharvdange618/Shikai/commit/f7944b0))
- **Narrow-screen layout** - On smaller, low-density screens the contribution graph drew two month labels on top of each other ("AuSept") and the repo action bar clipped the "Commits" label. Month labels now sit on the column that starts each month, and the action bar keeps its button text inside the pill. ([`bf0c986`](https://github.com/atharvdange618/Shikai/commit/bf0c986))

### Refactoring

- **Paginated query hooks** - Nine hooks that each hand-rolled the same `useInfiniteQuery` boilerplate now share a `useInfinitePagedQuery` helper, and the list-plus-search logic behind `useRepos` and `useStarred` moved into a shared `useFilterableRepoList`. ([`93fc5b5`](https://github.com/atharvdange618/Shikai/commit/93fc5b5))
- **Theme tokens** - Removed unused `Duration`, `Easing`, and dead `Shadows.dark` tokens and collapsed `ZIndex` to the tiers actually in use. ([`4a816ca`](https://github.com/atharvdange618/Shikai/commit/4a816ca))
- **About screen** - Trimmed the feature list to headline items. ([`8795f9c`](https://github.com/atharvdange618/Shikai/commit/8795f9c))

### Notes

- After an `eas update`, run `npm run sentry:sourcemaps` so OTA stack traces stay readable. Native build source maps upload automatically through the Sentry Expo plugin.

## v1.3.1

### Features

- **Notifications tab** - Notifications promoted from the profile menu to a top-level tab with an unread count badge. Swipe left on a notification to mark it read. Attention-worthy items (review requests, mentions, assignments) sort to the top. ([`d070d92`](https://github.com/atharvdange618/Shikai/commit/d070d92), [`ab99556`](https://github.com/atharvdange618/Shikai/commit/ab99556), [`ced9aec`](https://github.com/atharvdange618/Shikai/commit/ced9aec))
- **PR detail expansion** - Pull request screens now show file diffs, check runs, requested reviewers, the commit list, and review comments inline. ([`490670a`](https://github.com/atharvdange618/Shikai/commit/490670a))
- **Video playback in file viewer** - Repository files that are videos play in-app. ([`46966ad`](https://github.com/atharvdange618/Shikai/commit/46966ad))
- **Topic search** - Search by topic and tap topic pills on a repo to run a new search. Repo cards render correctly in the Topics tab. ([`f3b4184`](https://github.com/atharvdange618/Shikai/commit/f3b4184), [`cf1c9e2`](https://github.com/atharvdange618/Shikai/commit/cf1c9e2))
- **Recent searches** - Last searches saved to MMKV and shown on the search screen. ([`aaa4789`](https://github.com/atharvdange618/Shikai/commit/aaa4789))
- **Rate limit in Settings** - Settings shows the tracked GitHub rate limit and adds a manual clear-cache button. ([`3c2130b`](https://github.com/atharvdange618/Shikai/commit/3c2130b))
- **OTA restart prompt** - The app asks before restarting on an OTA update instead of auto-reloading. ([`c7641fb`](https://github.com/atharvdange618/Shikai/commit/c7641fb))
- **Scoped error boundaries** - Error boundaries wrap the file viewer and PR/issue detail screens so one failing screen no longer crashes the app. ([`ac6c916`](https://github.com/atharvdange618/Shikai/commit/ac6c916))
- **Retention nudges** - Goal-gradient progress bar on the streak display, a prompt to finish an incomplete profile, and a nudge on the first bookmark. ([`62cb23b`](https://github.com/atharvdange618/Shikai/commit/62cb23b), [`5a617c5`](https://github.com/atharvdange618/Shikai/commit/5a617c5), [`5429026`](https://github.com/atharvdange618/Shikai/commit/5429026))
- **App rating prompt** - Prompts for a store rating after five launches. ([`ebf3e4f`](https://github.com/atharvdange618/Shikai/commit/ebf3e4f))
- **Haptics** - Haptic feedback on pull-to-refresh, tab switch, and bookmark. ([`6281efd`](https://github.com/atharvdange618/Shikai/commit/6281efd))
- **Reduced motion** - Respects the system reduced-motion preference. ([`cd844b8`](https://github.com/atharvdange618/Shikai/commit/cd844b8))
- **Keyboard handling** - `KeyboardAvoidingView` added to screens with text inputs. ([`8a41355`](https://github.com/atharvdange618/Shikai/commit/8a41355))
- **Staggered loading** - Loading sections on the overview fade in with a stagger. ([`999b62c`](https://github.com/atharvdange618/Shikai/commit/999b62c))
- **PAT prompt card** - Overview shows a card explaining the value of adding a Personal Access Token. ([`3282ed2`](https://github.com/atharvdange618/Shikai/commit/3282ed2))
- **Offline polish** - Search degradation messaging, a contribution timestamp, and a brighter offline banner. ([`5c566d4`](https://github.com/atharvdange618/Shikai/commit/5c566d4))

### Bug Fixes

- **Recent activity pagination** - The overview's recent activity list pages past 10 records with a Load more button, and touch scrolling inside it works. ([`45ac2fd`](https://github.com/atharvdange618/Shikai/commit/45ac2fd), [`b33e707`](https://github.com/atharvdange618/Shikai/commit/b33e707))
- **Rate limit enforcement** - The tracked rate limit actually stops requests once reached. ([`12b0d42`](https://github.com/atharvdange618/Shikai/commit/12b0d42))
- **Auth state** - `validateToken` no longer mutates shared auth state. ([`661a7c5`](https://github.com/atharvdange618/Shikai/commit/661a7c5))
- **Duplicate OAuth exchange** - Removed a duplicate OAuth code exchange in the root layout. ([`378b6b0`](https://github.com/atharvdange618/Shikai/commit/378b6b0))
- **Search persistence** - Search queries excluded from disk persistence. ([`4110849`](https://github.com/atharvdange618/Shikai/commit/4110849))
- **Onboarding flag** - `clearAllMMKV` no longer wipes the onboarding-complete flag. ([`0fd2e98`](https://github.com/atharvdange618/Shikai/commit/0fd2e98))
- **Account switch cleanup** - Watchlist and recent searches cleared on account switch. ([`c4ee986`](https://github.com/atharvdange618/Shikai/commit/c4ee986))
- **UI fixes** - Owner name hidden on RepoCard in the repos tab, repo link added to issue detail, owner shown in repo cards, larger hitSlop on small controls, tab bar and card contrast improved, better empty states for pinned repos and the contribution graph. ([`dc0731d`](https://github.com/atharvdange618/Shikai/commit/dc0731d), [`5a649c2`](https://github.com/atharvdange618/Shikai/commit/5a649c2), [`fc84edd`](https://github.com/atharvdange618/Shikai/commit/fc84edd), [`7094fa7`](https://github.com/atharvdange618/Shikai/commit/7094fa7), [`10c8b12`](https://github.com/atharvdange618/Shikai/commit/10c8b12))
- **Play Store badge** - Fixed the badge image link in the README. ([`e7dc982`](https://github.com/atharvdange618/Shikai/commit/e7dc982))
- **versionCode duplication** - Removed the remote `appVersionSource` to stop versionCode duplication in Android builds. ([`a05d4e6`](https://github.com/atharvdange618/Shikai/commit/a05d4e6), [`c69275b`](https://github.com/atharvdange618/Shikai/commit/c69275b))

### Security

- **Keystore password** - Stopped hardcoding the release keystore password. ([`7e0e039`](https://github.com/atharvdange618/Shikai/commit/7e0e039))
- **Security gate** - Token restore and the OAuth exchange run only after the device security check passes. ([`afb8678`](https://github.com/atharvdange618/Shikai/commit/afb8678))

### Refactoring

- **Shared axios client** - PAT auth folded into the shared axios client. ([`9bab0a8`](https://github.com/atharvdange618/Shikai/commit/9bab0a8))
- **Zustand persist** - Watchlist and recent searches backed by zustand persist. ([`4a8f529`](https://github.com/atharvdange618/Shikai/commit/4a8f529))
- **Helper cleanup** - Simplified date formatting helpers and collapsed repeated try/catch in secure-storage. ([`0eec00f`](https://github.com/atharvdange618/Shikai/commit/0eec00f), [`8f91848`](https://github.com/atharvdange618/Shikai/commit/8f91848))
- **Lint** - Cleared all pre-existing lint warnings. ([`34640be`](https://github.com/atharvdange618/Shikai/commit/34640be))

### Build

- **EAS config** - `cli.appVersionSource` set to local in `eas.json`; gradle.properties config plugin for EAS builds; the single gradle.properties patch inlined. ([`74333b0`](https://github.com/atharvdange618/Shikai/commit/74333b0), [`c69275b`](https://github.com/atharvdange618/Shikai/commit/c69275b), [`deed059`](https://github.com/atharvdange618/Shikai/commit/deed059))
- **Fail loudly** - `post-prebuild.js` fails loudly instead of silently degrading the build. ([`248ff4b`](https://github.com/atharvdange618/Shikai/commit/248ff4b))
- **Deps** - Removed a duplicate `expo-video` entry. ([`5ee4b14`](https://github.com/atharvdange618/Shikai/commit/5ee4b14))

### Docs

- **AGENTS.md** - Replaced the global instructions boilerplate with a project-specific guide and added new rules. ([`2632044`](https://github.com/atharvdange618/Shikai/commit/2632044), [`0a26581`](https://github.com/atharvdange618/Shikai/commit/0a26581))
- **Play Store link** - Added to the README and privacy policy. ([`a1f4413`](https://github.com/atharvdange618/Shikai/commit/a1f4413))

### Removed

- **Onboarding screens** - The first-run carousel added earlier in this cycle was removed before release. ([`28ccd0a`](https://github.com/atharvdange618/Shikai/commit/28ccd0a), [`2a59a88`](https://github.com/atharvdange618/Shikai/commit/2a59a88))

---

## v1.3.0

### Features

- **GitHub Contribution Streak Widget** - Android home screen widget displaying your contribution streak. Shows current streak, longest streak, and recent activity. Widget syncs with app theme and updates on data refresh. ([#13](https://github.com/atharvdange618/Shikai/pull/13), [`d82ac9e`](https://github.com/atharvdange618/Shikai/commit/d82ac9e), [`b52038d`](https://github.com/atharvdange618/Shikai/commit/b52038d))
- **OTA Updates** - Silent over-the-air updates via `expo-updates` with EAS build profiles. App checks for updates on launch and applies them transparently without user intervention. ([`213b332`](https://github.com/atharvdange618/Shikai/commit/213b332), [`f6cab90`](https://github.com/atharvdange618/Shikai/commit/f6cab90))
- **SVG and PDF Rendering** - File viewer now supports SVG and PDF files with native rendering. Replaced `VirtualizedCodeViewer` with `MarkdownRenderer` for unified markdown/file display. ([`310427f`](https://github.com/atharvdange618/Shikai/commit/310427f))
- **Item Separators in Saved Repos** - Visual dividers between saved repos for better readability. ([`4b16d78`](https://github.com/atharvdange618/Shikai/commit/4b16d78))
- **Scroll Indicator on Repo Details** - Bouncing chevron hints at README content below the fold. Fades out after scrolling, reappears at top. ([`66fcca6`](https://github.com/atharvdange618/Shikai/commit/66fcca6))
- **Play Store In-App Updates** - Replaced GitHub releases version check with native Play Store update flow via `expo-in-app-updates`. App now checks the Play Store on launch and prompts users to update through the native Play Store overlay.

### Bug Fixes

- **Tooltip behavior** - Tooltips now close on outside press and tab change for cleaner UX. ([`91159f0`](https://github.com/atharvdange618/Shikai/commit/91159f0))
- **OAuth 2FA flow** - Opens OAuth in external browser and handles deep link redirect to survive 2FA authentication flows. ([`a96bdf7`](https://github.com/atharvdange618/Shikai/commit/a96bdf7))
- **Null-safety for file content** - Added null-safety checks for file content responses and proper API type formatting. ([`93d8754`](https://github.com/atharvdange618/Shikai/commit/93d8754))
- **Mermaid diagram loading** - Improved loading with fetch API and loading placeholders for better UX. ([`b0134c1`](https://github.com/atharvdange618/Shikai/commit/b0134c1))
- **TypeScript annotations** - Replaced `any` types with proper TypeScript annotations across codebase. ([`1589ad0`](https://github.com/atharvdange618/Shikai/commit/1589ad0))
- **OTA TypeScript errors** - Resolved expo-updates API type errors for OTA builds. ([`c2db409`](https://github.com/atharvdange618/Shikai/commit/c2db409))
- **App icon assets** - Replaced logo-simple assets with finalized logo-lens design. ([`875c65b`](https://github.com/atharvdange618/Shikai/commit/875c65b))

### Refactoring

- **Repo detail decomposition** - Decomposed repo detail screen into focused sub-components for better maintainability. ([`6643856`](https://github.com/atharvdange618/Shikai/commit/6643856))
- **Utility extraction** - Extracted duplicated utility functions into shared modules. ([`fb0fe52`](https://github.com/atharvdange618/Shikai/commit/fb0fe52))

### UI/UX

- **Responsive Overview screen** - Overview screen now adapts across mobile sizes. ([`11d55a9`](https://github.com/atharvdange618/Shikai/commit/11d55a9))
- **Layout responsiveness** - Enhanced layout proportions and logo sizing. ([`0ead377`](https://github.com/atharvdange618/Shikai/commit/0ead377))

### Chores

- **Language mappings** - Added `.ino` and `.svg` file language mappings for syntax highlighting. ([`c474979`](https://github.com/atharvdange618/Shikai/commit/c474979))
- **Dependency cleanup** - Removed unused syntax highlighter dependency and dead code. ([`afeec04`](https://github.com/atharvdange618/Shikai/commit/afeec04))

### Removed

- **GitHub releases update check** - Removed `useLatestRelease` hook, `VersionCheckBanner` component, and `fetchLatestRelease` API function. Replaced by Play Store in-app updates.

---

## v1.2.0

### Features

- **Personal Access Token Support** - Optional PAT fallback for GitHub App token limitations. Settings screen with token input, validation against GitHub API, and secure storage via `expo-secure-store`. PAT is restored automatically on app restart.
- **Notifications via PAT** - Notifications tab now works with a Personal Access Token that has the `notifications` scope. Notifications bell icon and tab are hidden when no PAT is configured. Mark-as-read operations also use the PAT.
- **Following Activity Feed** - Dedicated feed showing recent activity from users you follow on GitHub. Uses `/users/{username}/received_events` endpoint via PAT. Compact inline preview on Overview dashboard with "See all" navigation. Your own events are filtered out. Requires PAT with `notifications` and `repo` scopes.
- **Following Preview on Overview** - Compact banner above the Activity section showing 1-2 recent events from followed users with actor avatars. Tappable to navigate to the full Following feed. Hidden when no PAT is configured.
- **PAT-gated Features** - Notifications tab, Following feed link, and Following preview are conditionally rendered based on PAT availability. Clean error states on notifications and following feed screens.
- **Custom Theme Engine** - User-selectable themes with 5 palettes: Light, Dark, Tokyo Night, Dracula, and Atom One Dark. Theme picker in profile settings, persistent selection via MMKV. Theme-specific contribution graph colors. Migrated all components from useColorScheme to context-based useTheme hook.
- **Global Search** - New search tab with GitHub Search API integration. Tab switching between repos/users/issues. Fuzzy search, debounced input, eager-load pagination. Result cards with user avatars, navigate in-app to repo or user profile.
- **Notifications-Lite** - GitHub notifications API integration with attention-worthy filtering. Review requests, mentions, and assignments highlighted. All/Unread/Attention filters with mark-all-read. FlashList virtualization with pull-to-refresh. Tap to navigate to issues and PRs.
- **Tab Reorganization** - Consolidated 7 tabs to 4 (Overview, Repos, Search, Profile). Cleaner navigation with focused tab bar.
- **Saved Repos Screen** - Stars and Watchlist merged into a single screen under Profile with tab switcher. Search and filter for both sources.
- **Settings Screen** - Theme, About, and Sign out consolidated into dedicated Settings screen accessed via gear icon in Profile header.
- **Profile Declutter** - Profile now shows: user info, stats, social links, GitHub link, Saved Repos. Notifications bell and Settings gear in header. Compact horizontal hero layout.
- **User Profile Screen** - View any GitHub user's profile - avatar, bio, stats, social links, top repositories. Tappable from search results and contributor lists. Skeleton states and pull-to-refresh.
- **Overview Tab** - Dedicated overview screen with pinned repos, contribution graph with streaks, and activity feed. Separate from the old index route.
- **Keyboard Shortcuts** - `useKeyboardShortcuts` hook with Cmd+1-4 tab switching, Cmd+F search focus, arrow key list navigation, Escape to dismiss. Haptic feedback on all actions.
- **Offline Support** - Network state manager via `@react-native-community/netinfo`. MMKV-backed React Query disk persistence with 24h max age. Offline banner with safe area support. Ephemeral queries excluded from disk cache.
- **Custom Alert System** - Themed `Alert` component replacing native `Alert.alert()`. Consistent styling with the app's design system.
- **Error Boundaries** - `ErrorBoundary` class component wrapping root and tabs layouts. Catches render errors and displays fallback UI with "Go to Home" recovery button.
- **404 Screen** - Custom `+not-found.tsx` with themed design matching the app. Shows "Go to Home" button instead of default Expo Router 404.
- **Flash-Free Navigation** - Delayed native splash hide until app is fully ready (auth + security checks). Added `contentStyle` background to all Stack navigators. Root Stack uses fade animation.
- **Safe Repo ID Encoding** - Replaced fragile `__` repoId encoding with safe `~~` separator across 19 files. Added `encodeRepoId`/`decodeRepoId` utility functions.
- **Sign-Out with Cache Clear** - Sign-out button with confirmation dialog. MMKV cache cleared on both sign-in and sign-out.
- **In-app version check banner** - Dashboard shows a dismissible update banner when a new GitHub release is available. Dismiss state persisted via MMKV.
- **In-app README preview** - MarkdownRenderer component renders README files inline on repo detail screen using GitHub's `/markdown` API with themed CSS. Fixed UTF-8 decoding for Japanese/emoji support.
- **Markdown file viewer** - MarkdownRenderer now renders `.md` files in the file viewer with syntax-highlighted code blocks and copy buttons.
- **Issue and PR detail screens** - In-app detail screens for issues and pull requests with markdown body and comments rendering. Navigates from list screens instead of opening external browser.
- **About page version check** - Interactive update status below version badge on about page. Shows loading spinner, available version pill, or up-to-date checkmark.
- **Markdown image support** - MarkdownRenderer resolves relative image paths to absolute GitHub raw URLs. README images now render correctly in-app.
- **Developer mode override** - Developers with Android dev options enabled can bypass the security block by accepting a risk warning. Root and debugger detection remain hard-blocked. Override persisted via SharedPreferences.
- **Post-build automation** - `npm run prebuild:clean` script auto-restores Android build customizations (ABI splits, R8 minification, resource shrinking) that are wiped by `expo prebuild --clean`.
- **Watchlist for any repo** - Bookmark any repo from anywhere in the app, not just your own. Stars (from GitHub) and Watchlist (local bookmarks) combined in one screen with search and filter.
- **File tree search** - Search within a repo's file tree by filename to quickly locate files.
- **Contribution stats summary** - Streaks and most active day stats displayed alongside the contribution graph.
- **Health badge tooltips** - Tooltips explaining repo health badges (missing license, no topics, etc.) with mutual exclusivity.
- **File viewer virtualization** - Large files rendered via chunk-based FlashList for smooth scrolling.
- **Profile page caching** - Profile data heavily cached with 30 min staleTime for faster tab switches.
- **Beta program links** - README section with Google Form links for beta sign-up and feedback.
- **Activity feed infinite scroll** - Activity feed supports paginated loading as you scroll.
- **Repo details scroll indicator** - Bouncing chevron at the bottom of repo details screen hints that README content is available below. Fades out after scrolling, reappears when scrolling back to top.

### Bug Fixes

- **App icon assets** - Regenerated `icon.png`, `adaptive-icon.png`, and `splash-icon.png` from finalized `logo-lens.svg` instead of the simplified `logo-simple.svg`. Added dark mode splash variant from `logo-lens-dark.svg`. Updated all 25 native Android resources in-place without requiring `expo prebuild`.
- **Splash icon dark mode** - App, sign-in, and about screens now use the dark splash variant in dark mode. `AnimatedSplashScreen`, sign-in, and about components updated to select the correct asset based on color scheme.
- **Responsive Overview screen** - `PinnedRepoCard` width now adapts to screen size (70% of width, clamped 180-260px). `ActivityFeed` height scales with screen (45% instead of fixed 400px). Replaced hardcoded font sizes with theme tokens.
- **Notification navigation routes** - Fixed incorrect `(repo)` route group in notification press handlers. Routes now correctly use `/(app)/repo/` matching the actual file structure.
- **Following feed endpoint** - Fixed 404 error by correcting the API endpoint from non-existent `/user/received_events` to `/users/{username}/received_events`.
- **PAT persistence on boot** - PAT is now loaded from SecureStore independently from the main OAuth token, preventing loss during auth reset cycles.
- **Navigation Overhaul** - Fixed broken file navigation path, eliminated double auth guard race condition, fixed `router.navigate` vs `push` inconsistency for cross-tab navigation.
- **FlashList rendering** - Fixed blank screen when switching between Stars/Watchlist tabs and when clearing search by adding key prop for remount.
- **Splash Screen** - Delayed native splash hide until app is fully ready to prevent flash of white.
- **File Explorer** - Use absolute route path for file viewer navigation instead of relative paths.
- **Repo Detail Back Button** - Always show fallback back button when `canGoBack` is false.
- **Pull-to-Refresh** - Watchlist tab now invalidates repos query on pull-to-refresh.
- **Activity Feed** - Skip initial `onEndReached` to prevent unwanted prefetch on mount.
- **Stars Prefetch** - Limit prefetch to first 3 repos for faster tab load.
- **Tooltip** - Remove undefined `onLayout` prop that caused warnings.
- **List performance** - Pre-built styles, hoisted `isDark`, `overrideItemLayout`/`getItemType` for FlashList virtualization, `drawDistance: 400`, nested ScrollView removal for topics.
- **Shadows useMemo** - Wrapped shadows conditional in useMemo to resolve lint warnings.
- **Contribution graph coloring** - Use GitHub's `contributionLevel` for heatmap coloring instead of count-based thresholds.
- **Sign-in race condition** - Resolve initial data loading race condition on sign-in.
- **Search API** - Use GitHub search API for repos and stars search to find all results instead of local-only filtering.
- **Contribution streak calculation** - Use local date instead of UTC for streak calculations to avoid off-by-one errors.
- **fetchRepoCount errors** - Propagate fetchRepoCount errors instead of silently returning 0.
- **Invalid dates** - Handle invalid dates gracefully, centralize query keys, remove invalid easing values.
- **Commits stale cache** - Include branch in commits query key to prevent stale cached data across branch switches.
- **Back button navigation** - Prevent back button from navigating to sign-in screen.
- **Accessibility** - Address remaining LOW-priority issues and accessibility improvements across components.
- **Palette naming** - Rename `Palette.white` to `Palette.offWhite` to match actual color value.
- **MMKV cache clear** - Clear MMKV cache on both sign-in and sign-out to prevent stale data.
- **Share button** - Repo share button now copies the GitHub URL on Android. Previously used the `url` field which Android ignores.
- **LoadingProgress crash** - Move hooks before early return in LoadingProgress component to prevent render crash.
- **Sign-in screen imports** - Add missing `useMemo` import in sign-in screen.
- **OAuth header** - Remove dual authorization header paths in API functions.
- **Duplicate imports** - Merge duplicate expo-router imports in pull-requests screen.

### Refactoring

- **Repo/User Detail Screens** - Moved out of tabs into dedicated `(app)/repo/` and `(app)/user/` route groups for cleaner navigation stack.
- **Layout Icon Renderers** - Hoisted icon render functions outside component to prevent re-creation on every render.
- **Import Ordering** - Fixed import ordering and formatting across all components for consistency.
- **GitHub-native syntax highlighting** - Replaced highlight.js with GitHub's `pl-*` CSS classes for syntax-colored code blocks. Zero JS dependency.
- **TypeScript strictness** - Enabled `noUnusedLocals` and `noUnusedParameters` in tsconfig.
- **Profile drawer replaced** - Replaced profile drawer with stack navigation for About screen.
- **Activity feed virtualization** - Migrated activity feed from FlatList to FlashList for better performance.
- **Sign-in console cleanup** - Removed all `console.log`/`console.error` debug statements from sign-in flow and API interceptors.

### UI/UX

- **Repo detail cleanup** - Removed card aesthetic, stripped header from README section for seamless reading, moved action bar above README for better navigation.
- **README and ROADMAP professionalized** - Updated docs with structured formatting, star CTA on about page.

### Security

- **Developer options detection** - Narrowed OAuth scopes to read-only access, corrected Android setting key for developer options detection.
- **URL validation** - Validate URLs before opening in browser to prevent open redirect attacks.
- **Path parameter encoding** - Encode all path parameters in REST API URLs to prevent injection.
- **Pending token TTL** - Add TTL to pendingToken to prevent indefinite token retention if install flow is abandoned.
- **OAuth proxy hardening** - Validate client_id and sanitize OAuth proxy response.

### Build

- **ABI splits** - Release builds produce 3 APKs: arm64-v8a (~37MB), x86_64 (~39MB), universal (~82MB).
- **ABI splits for AAB** - Disabled ABI splits for AAB builds to prevent `bundleRelease` conflict.
- **R8 minification and resource shrinking** - Enabled for release builds.
- **Animated WebP disabled** - Saves ~3.4MB per APK.
- **Android build scripts** - Added scripts for assembly and bundling (`assembleRelease`, `bundleRelease`).

### Removed

- **Dead code cleanup** - Removed unused `usePrefetchOnPress` and `useRecentActivity` hooks.
- **Dependency cleanup** - Removed `minisearch` package, replaced with GitHub Search API for accurate results.
