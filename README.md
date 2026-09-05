<p align="center">
  <img src="https://github.com/atharvdange618/Shikai/blob/main/assets/images/splash-icon.png?raw=true" width="120" alt="Shikai logo">
</p>

<h1 align="center">Shikai</h1>

<p align="center">
  <strong>A read-only GitHub companion for Android.</strong>
</p>

<p align="center">
  <a href="https://github.com/atharvdange618/Shikai/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/atharvdange618/Shikai/releases"><img src="https://img.shields.io/github/v/release/atharvdange618/Shikai?label=version" alt="Version"></a>
  <a href="https://github.com/atharvdange618/Shikai/releases"><img src="https://img.shields.io/badge/platform-Android-brightgreen.svg" alt="Platform"></a>
</p>

<p align="center">
  Your repos, your contributions, your activity, presented clearly without the noise of the full GitHub mobile experience.
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.atharvdange618.Shikai"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" width="250" alt="Get it on Google Play"></a>
</p>

<p align="center">
  GitHub's mobile app is built for <em>work</em>. Shikai is built for <em>you</em>.
</p>

---

## Overview

Shikai gives you a clean, read-only view of your GitHub world. No write operations. No accidental merges on a tiny screen. Just your work, at a glance.

<table>
  <tr>
    <td><img src="https://img.shields.io/badge/-Dashboard-blueviolet?style=flat-square" alt="Dashboard"> Pinned repos, contribution graph with streaks, and a live activity feed</td>
    <td><img src="https://img.shields.io/badge/-Repositories-blue?style=flat-square" alt="Repos"> Browse repos with filters, file trees, syntax highlighting, and health badges</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-Search-green?style=flat-square" alt="Search"> Global search across repos, users, and issues with fuzzy matching</td>
    <td><img src="https://img.shields.io/badge/-Profile-orange?style=flat-square" alt="Profile"> Your GitHub card with stats, social links, notifications, and saved repos</td>
  </tr>
</table>

---

## Screenshots

Take a look at Shikai before you install: **[View Screenshots on Google Drive](https://drive.google.com/drive/folders/1dKMHCwih0Yz0xiURWmrEhmi5Uzm-9iNS?usp=sharing)**

---

## Features

### Core

| Feature                | Description                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Overview Dashboard** | Pinned repos, contribution graph with streaks, live activity feed, and following preview                                             |
| **Repository Browser** | File trees with blame and per-file history, syntax highlighting, releases, discussions, compare-two-refs, PR detail with diffs, checks, reviewers, commits, and review comments with diff context, issue/PR timelines and reactions, and a branch selector |
| **Global Search**      | Fuzzy search across repos, users, issues, and topics with debounced input, recent searches, and eager pagination                     |
| **User Profiles**      | View any GitHub user's profile with avatar, bio, stats, and top repositories                                                         |
| **Android Widget**     | Home screen widget showing contribution streak with longest streak and recent activity                                               |

### Personal Access Token

Optional PAT support unlocks features beyond the GitHub App token:

| Feature            | Required Scopes         |
| ------------------ | ----------------------- |
| **Notifications**  | `notifications`         |
| **Following Feed** | `notifications`, `repo` |

With a token set, Notifications becomes a top-level tab with an unread count badge. Swipe a notification left to mark it read; review requests, mentions, and assignments sort to the top.

Tokens are validated, stored securely in `expo-secure-store`, and used only for direct GitHub API calls.

### Themes

Choose from 5 palettes, each with unique contribution graph colours:

|      Light       |       Dark       |  Tokyo Night  |   Dracula    | Atom One Dark  |
| :--------------: | :--------------: | :-----------: | :----------: | :------------: |
| Clean and bright | Easy on the eyes | Neon-inspired | Rich purples | Warm and muted |

Pick your favourite from Profile > Settings > Theme. Selection persists across app restarts.

### Offline Support

Network state detection with MMKV-backed disk persistence. The app works offline with cached data and shows a banner when you're disconnected. Ephemeral queries are excluded from disk cache.

### Additional Features

- **OTA Updates** - Over-the-air updates via expo-updates. The app checks on launch and asks before restarting to apply an update.
- **File Viewer** - SVG, PDF, and video rendering alongside markdown files. Syntax-highlighted code blocks with copy buttons.
- **Keyboard Shortcuts** - Cmd/Ctrl + 1-4 for tabs, Cmd/Ctrl + F for search, arrow keys for navigation
- **Play Store Updates** - Native in-app update prompt when a new release is on the Play Store
- **Haptics** - Feedback on pull-to-refresh, tab switch, and bookmark. Respects the system reduced-motion setting.
- **Error Recovery** - Error boundaries around the root, tabs, file viewer, and PR/issue screens, with a custom 404 screen
- **Saved Repos** - Bookmark any repo. Stars and Watchlist combined in one screen with search and filter
- **Markdown Preview** - README and markdown files rendered inline with syntax-highlighted code blocks
- **GitHub URL Deep Links** - Opening or sharing a github.com link routes straight into the matching in-app screen, including a shared folder link (drills into and expands that folder) or a file link with a `#L10` line number (scrolls to it)

---

## Getting Started

1. Open Shikai and tap **Sign in with GitHub**
2. Authorize the app (read-only permissions only)
3. Your dashboard loads instantly
4. Optionally, add a PAT in Profile > Settings > Notifications & Following for notifications and activity feed

---

## Keyboard Shortcuts

| Shortcut       | Action              |
| -------------- | ------------------- |
| Cmd/Ctrl + 1-4 | Switch between tabs |
| Cmd/Ctrl + F   | Focus search bar    |
| Arrow Up/Down  | Navigate lists      |
| Escape         | Dismiss search      |

---

## Security

Shikai takes security seriously:

- **Read-only access** - Cannot modify, create, or delete anything on your GitHub account
- **Secure token exchange** - OAuth tokens are exchanged via a Cloudflare Worker proxy and never leave your device
- **On-device encryption** - Tokens stored with `expo-secure-store` (Keychain/Keystore)
- **Root/debugger detection** - Blocks usage on compromised environments
- **Token safety** - PATs and OAuth tokens are used only for direct GitHub API calls, and are stripped from crash reports before they are sent
- **Crash reporting** - Released builds send anonymous crash and performance diagnostics to Sentry (EU). No PII, no repository contents, no session recording. Off in development. See the [privacy policy](privacy-policy.md).
- **Cache hygiene** - MMKV cache cleared on sign-in and sign-out

Developer mode is blocked by default on release builds. Developers can override this after accepting a risk warning.

---

## Beta Program

Want early access to new features?

- **Join the Beta** - [Sign up for early access](https://forms.gle/qdw2xTKfH9kGsmwt9)
- **Share Feedback** - [Lemme know what you think](https://forms.gle/dDrchwJTrqDJyjQm9)

---

## Built With

| Layer          | Technologies                               |
| -------------- | ------------------------------------------ |
| **Framework**  | React Native, Expo, TypeScript             |
| **State**      | React Query, Zustand, MMKV                 |
| **UI**         | Reanimated, FlashList                      |
| **APIs**       | GitHub REST & GraphQL, GitHub OAuth (PKCE) |
| **Updates**    | expo-updates (OTA), EAS Build              |
| **Infra**      | Cloudflare Workers                         |
| **Monitoring** | Sentry (crash and performance reporting)   |

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT

---

<p align="center">
  Built by <a href="https://x.com/atharvdangedev">Atharv Dange</a>
</p>
