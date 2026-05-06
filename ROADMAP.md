# Shikai Roadmap & Feature Backlog

This document outlines the planned and proposed features for Shikai, categorized by impact and priority.

## High-Impact Additions

### 1. Global Search

- **Description:** A dedicated search tab or command palette.
- **Scope:** Search across repositories, lookup other users, starred repos, issues, and PRs from a single entry point.

### 2. In-App Repo README Preview (currently dropped because of complexity)

- **Description:** Render README markdown directly inside the app.
- **Scope:** Currently, repo details link to README on GitHub. Moving this in-app makes the experience feel complete.

### 3. Saved / Watchlist Repositories

- **Description:** Locally pinned repositories independent of GitHub's pinned repos.
- **Scope:** Allow users to "save" repos they care about. This stays local (no GitHub write ops).

### 4. Notifications-Lite / Attention Feed

- **Description:** A feed for items needing immediate attention.
- **Scope:** Show open PRs, open issues, stale repos, or recent mentions.

---

## Smaller Features

- **File Tree Search:** Filter `flattenedTree` in `app/(app)/(tabs)/repos/[repoId]/files.tsx`.
- **Clone URL Support:** Add a "Copy Clone URL" button on the repo detail screen.
- **Branch Selector:** Branch selector for the file tree and commits view.
- **Native Issue/PR Details:** Dedicated detail screens for Issues/PRs instead of external links.
- **Contribution Stats Summary:** Show current streak, best day, and most active weekday.
- **Repo Health Badges:** Visual indicators for missing License, Topics, README, or Stale status.
- **Share as Image/Link:** Share profile or repo cards as generated images or deep links.

---
