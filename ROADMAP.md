# Shikai Roadmap

> **Version:** 1.2.0 · **Last Updated:** June 30, 2026 · **Status:** Active Development

This document tracks the feature backlog and development progress for Shikai.

---

## Completed

| Feature | Description | Status |
|---------|-------------|--------|
| Prefetch Implementation | Custom prefetch system in `lib/prefetch.ts` with `usePrefetchOnPress` hook, used across 8+ screens for speculative data loading. | Done |
| File Tree Search | `SearchBar` in `app/(app)/(tabs)/repos/[repoId]/files.tsx` filters the flattened file tree by name/path. | Done |
| Contribution Stats Summary | `useContributions` hook computes streaks and most active day; displayed via `ContributionStatsRow` on the Overview tab. | Done |
| Repo Health Badges | `getHealthBadges()` in repo detail screen flags missing License, Topics, README, and stale repos (>90 days). Warning/danger pill badges in title row. | Done |
| Branch Selector | Horizontal pill-based branch picker in file tree and commits views. Fetches branches via `fetchBranches()`, resets tree on switch. | Done |
| Virtualized File Viewer | Replaced 500-line truncation with chunk-based FlashList. Files of any length now render smoothly via `VirtualizedCodeViewer` component. | Done |
| Profile Page Caching | Heavy caching (30 min staleTime) for user profile, social accounts, and repo count. Pull-to-refresh invalidates all profile queries. | Done |
| About Screen Redesign | Hero-focused layout with features list, developer card, open source section, and credits/acknowledgments. | Done |
| Brand Compliance | Replaced GitHub octocat with Shikai's own logo on sign-in screen. Octocat only used where it links to or indicates GitHub as a service. | Done |
| React Hooks Bug Fixes | Fixed hooks-before-early-return in LoadingProgress, missing useMemo import in sign-in screen. | Done |
| In-App Version Check | Fetches latest GitHub release on mount, compares semver against installed version, shows dismissible update banner. Dismiss state persisted via expo-secure-store. | Done |
| In-App README Preview | WebView-based markdown renderer (`MarkdownRenderer` component) using GitHub's `/markdown` API for 100% GFM fidelity. Renders inline on repo detail screen with themed CSS. Fixed UTF-8 decoding for Japanese/emoji support. | Done |
| Native Issue/PR Detail Screens | In-app detail screens for issues and PRs with markdown body + comments rendering via MarkdownRenderer. Navigates from list screens instead of opening external browser. | Done |
| Markdown Syntax Highlighting | GitHub-native `pl-*` CSS classes for syntax-colored code blocks in MarkdownRenderer. Per-block copy buttons, language labels, Mermaid diagram support. Zero JS dependency. | Done |
| About Page Version Check | Interactive update status below version badge on about page. Shows loading spinner, "vX.Y.Z available" tappable pill, or green "up to date" checkmark. Shares React Query cache with home tab banner. | Done |
| List Performance Optimization | Pre-built styles + hoisted `isDark` in RepoCard, `overrideItemLayout`/`getItemType` for FlashList virtualization, `drawDistance: 400`, nested ScrollView removal for topics. | Done |
| Developer Mode Override | Developers with Android dev options enabled can now bypass the security block by accepting a risk warning. Root and debugger detection remain hard-blocked. Override persisted via SharedPreferences. | Done |
| Post-Build Automation | `npm run prebuild:clean` script auto-restores Android build customizations (ABI splits, R8 minification, resource shrinking) that are wiped by `expo prebuild --clean`. | Done |
| Global Search | New search tab with GitHub Search API integration. Tab switching between repos/users/issues. MiniSearch fuzzy index, debounced input, eager-load pagination. Result cards with user avatars, navigate in-app to repo or user profile. | Done |
| Saved/Watchlist Repos | Bookmark toggle on every RepoCard. Local persistence via MMKV. Dedicated Watchlist tab with search/filter. Empty state with onboarding copy. | Done |
| User Profile Screen | View any GitHub user's profile - avatar, bio, stats, social links, top repositories. Tappable from search results and contributor lists. Reuses profile layout patterns with skeleton states and pull-to-refresh. | Done |
| Keyboard Shortcuts | `useKeyboardShortcuts` hook with Cmd+1-6 tab switching, Cmd+F search focus, arrow key list navigation, Escape to dismiss. Haptic feedback on all actions. | Done |
| Offline Support | Network state manager via `@react-native-community/netinfo`. MMKV-backed React Query disk persistence with 24h max age. Offline banner with safe area support. Ephemeral queries excluded from disk cache. | Done |
| Tooltip/InfoDot Components | Shared `Tooltip` and `InfoDot` components with mutual exclusivity. Used for repo health badges and info hints across the app. | Done |
| Activity Feed Infinite Scroll | FlashList-based activity feed with `onEndReached` pagination, `isFetchingNextPage` loading indicator, and grouped consecutive events. | Done |
| Navigation Overhaul | Fixed broken file navigation path, eliminated double auth guard race condition, replaced fragile `__` repoId encoding with safe `~~` separator (updated 19 files), added keyboard shortcuts for all 6 tabs, fixed `router.navigate` vs `push` inconsistency. | Done |
| Error Boundaries | `ErrorBoundary` class component wrapping root and tabs layouts. Catches render errors and displays fallback UI with "Go to Home" recovery button. | Done |
| 404 Screen | Custom `+not-found.tsx` with themed design matching the app. Shows "Go to Home" button instead of default Expo Router 404. | Done |
| Flash-Free Navigation | Delayed native splash hide until app is fully ready (auth + security checks). Added `contentStyle` background to all Stack navigators. Wrapped Tabs in background View. Root Stack uses fade animation. | Done |
| Custom Alert System | Themed `Alert` component replacing native `Alert.alert()`. Consistent styling with the app's design system. | Done |
| Safe Repo ID Encoding | `encodeRepoId`/`decodeRepoId` utility functions with `~~` separator. Replaces fragile `__` encoding across 19 files. | Done |
| MMKV Cache Clearing | Clear MMKV cache on sign-in and sign-out to prevent stale data. | Done |
| Custom Theme Engine | User-selectable themes with 5 palettes (Light, Dark, Tokyo Night, Dracula, Atom One Dark). Theme picker in profile settings, MMKV persistence, theme-specific contribution graph colors. | Done |

---

## In Progress

| Feature | Description | Blocker |
|---------|-------------|---------|
| Share as Image/Link | Share as text+link works on repo detail. No image generation, no profile sharing. | Image generation pending |

---

## Backlog

### Tier 3 - Large Features (3+ hours each)

| # | Feature | Description | Est. LOC |
|---|---------|-------------|----------|
| 6 | Notifications-Lite / Attention Feed | GitHub notifications API, attention-worthy items logic, new screen. | ~300 |
| 8 | Share as Image | `react-native-view-shot` card capture, image generation for repos/profiles. | ~150 |
| 10 | Following Activity Feed | Dashboard-style feed showing recent activity from users you follow on GitHub. | ~300 |
| 12 | 3D GitHub Profile Card | Shareable 3D-styled GitHub profile cards for social proof and FOMO. Generate a visual card with avatar, stats, top repos, contribution graph. Share as image to social media. Inspired by Threads' card sharing mechanic. | ~350 |
