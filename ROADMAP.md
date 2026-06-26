# Shikai Roadmap

> **Version:** 1.1.0 · **Last Updated:** June 2026 · **Status:** Active Development

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

---

## In Progress

| Feature | Description | Blocker |
|---------|-------------|---------|
| Native Issue/PR Details | Full list screens exist (`issues.tsx`, `pull-requests.tsx`) but tapping opens external browser. Needs dedicated detail screens with comments/body. | Detail screens not yet built |
| Share as Image/Link | Share as text+link works on repo detail. No image generation, no profile sharing. | Image generation pending |

---

## Backlog

### Tier 2 - Medium Features (1-3 hours each)

| # | Feature | Description | Est. LOC |
|---|---------|-------------|----------|
| 1 | Native Issue Detail Screen | Detail view with markdown body + comments for individual issues. | ~200 |
| 2 | Native PR Detail Screen | Same pattern as issues, can reuse comment components. | ~200 |
| 3 | Saved/Watchlist Repos | Local save via AsyncStorage + save button on repo cards + dedicated list screen. | ~150 |
| 4 | User Profile Screen | View any GitHub user's profile (repos, contributions, bio). Tappable from starred repo headers, contributor lists. Reuses existing profile layout patterns. | ~250 |

### Tier 3 - Large Features (3+ hours each)

| # | Feature | Description | Est. LOC |
|---|---------|-------------|----------|
| 5 | Global Search | New search tab, GitHub search API integration, result cards for repos/users/issues/PRs. | ~400 |
| 6 | Notifications-Lite / Attention Feed | GitHub notifications API, attention-worthy items logic, new screen. | ~300 |
| 7 | In-App README Preview | Needs markdown rendering library, README fetch + render component. | ~200 |
| 8 | Share as Image | `react-native-view-shot` card capture, image generation for repos/profiles. | ~150 |
| 9 | Explore Tab / User Discovery | New tab for searching and discovering GitHub users. User cards with repo count, followers, bio. | ~350 |
| 10 | Following Activity Feed | Dashboard-style feed showing recent activity from users you follow on GitHub. | ~300 |
| 11 | Custom Theme Engine | User-selectable themes: Tokyo Night, Dracula, Atom One Dark. Theme picker in settings, persistent preference via AsyncStorage. Separate experimental branch (`feat/themes`). | ~400 |

---

## Not Started

| # | Feature | Notes |
|---|---------|-------|
| 3 | Saved / Watchlist Repositories | - |
| 4 | User Profile Screen | - |
| 5 | Global Search | - |
| 6 | Notifications-Lite / Attention Feed | - |
| 7 | In-App README Preview | - |
| 9 | Explore Tab / User Discovery | - |
| 10 | Following Activity Feed | - |
| 11 | Custom Theme Engine | Experimental - separate `feat/themes` branch |
