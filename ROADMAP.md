# Shikai Roadmap & Feature Backlog

This document outlines the planned and proposed features for Shikai, categorized by impact and priority.

## Completed

- [x] **Prefetch Implementation** - Custom prefetch system in `lib/prefetch.ts` with `usePrefetchOnPress` hook, used across 8+ screens for speculative data loading.
- [x] **File Tree Search** - `SearchBar` in `app/(app)/(tabs)/repos/[repoId]/files.tsx` filters the flattened file tree by name/path.
- [x] **Contribution Stats Summary** - `useContributions` hook computes streaks and most active day; displayed via `ContributionStatsRow` on the Overview tab.
- [x] **Repo Health Badges** - `getHealthBadges()` in repo detail screen flags missing License, Topics, README, and stale repos (>90 days). Warning/danger pill badges in title row.
- [x] **Branch Selector** - Horizontal pill-based branch picker in file tree and commits views. Fetches branches via `fetchBranches()`, resets tree on switch.

## Partially Done

- [ ] **Native Issue/PR Details** - Full list screens exist (`issues.tsx`, `pull-requests.tsx`) but tapping still opens external browser. Needs dedicated detail screens with comments/body.
- [ ] **Share as Image/Link** - Share as text+link works on repo detail. No image generation, no profile sharing.

---

## Prioritized Backlog

### Tier 1 - Quick Wins (< 1 hour each)

_(All complete!)_

### Tier 2 - Medium Features (1-3 hours each)

1. **Native Issue Detail Screen** - Detail view with markdown body + comments for individual issues. ~200 LOC.
2. **Native PR Detail Screen** - Same pattern as issues, can reuse comment components. ~200 LOC.
3. **Saved/Watchlist Repos** - Local save via AsyncStorage + save button on repo cards + dedicated list screen. ~150 LOC.

### Tier 3 - Large Features (3+ hours each)

4. **Global Search** - New search tab, GitHub search API integration, result cards for repos/users/issues/PRs. ~400 LOC.
5. **Notifications-Lite / Attention Feed** - GitHub notifications API, attention-worthy items logic, new screen. ~300 LOC.
6. **In-App README Preview** - Needs markdown rendering library, README fetch + render component. ~200 LOC.
7. **Share as Image** - `react-native-view-shot` card capture, image generation for repos/profiles. ~150 LOC.

---

## Not Started

- Global Search (#4)
- In-App README Preview (#6)
- Saved / Watchlist Repositories (#3)
- Notifications-Lite / Attention Feed (#5)
