# Shikai

**Your GitHub profile, refined and always in your pocket.**

> **視界** - "field of vision" in Japanese. See what matters - your work, your progress, your impact - without distractions.

---

GitHub is where you build your career. But the mobile experience is built for _work_ - reviewing PRs, responding to issues, managing projects. What about when you just want to _check in_?

Shikai is a read-only GitHub companion that shows you your GitHub data the way it deserves to be seen. No notifications. No write operations. No anxiety about accidentally merging something on a tiny screen. Just your repos, your contributions, and your activity - presented clearly and beautifully.

---

## Overview

Your dashboard at a glance. See pinned repos, browse your contribution graph, and catch up on recent activity - pushes, stars, forks, releases, PRs, and issues - all in one place. Tap any activity item to jump straight to the relevant repo.

## Repositories

Browse all your repos with smart filters - by language, type, or sort order. Dive into any repo to explore its file tree, view files with syntax highlighting, browse commit history per branch, and track issues and pull requests with state filtering. Every detail, from contributor avatars to repo health badges (missing license, no topics, stale repos), is right where you need it.

## Stars

Keep tabs on the projects you've starred. Search, sort by recent activity or name, and quickly access the repos that inspire you. Same powerful filtering as your own repos.

## Profile

Your GitHub card, always ready to share. See your stats - repos, followers, following - along with your social links, location, and hireable status. Perfect for meetups, interviews, or just admiring your streak.

---

## Design

Shikai is built around three principles:

- **Read-only by design.** No write operations means no accidental mistakes. This is your safe viewing space.
- **Mobile-first, native feel.** Smooth animations, haptic feedback, frosted glass tab bar on iOS, and a UI that feels at home on your phone.
- **Information at the right density.** Not too sparse, not overwhelming. Just enough detail to be useful, with deeper views when you need them.

The app supports light and dark themes - a warm, paper-like aesthetic in light mode and a GitHub-inspired dark palette in dark mode. Typography uses Inter for body text and JetBrains Mono for code.

---

## Security

Your token is handled via a secure Cloudflare Worker proxy and never leaves your device after the initial exchange. All subsequent API requests go directly from your phone to GitHub. The app detects rooted devices and debuggers to prevent usage on compromised environments. Tokens are encrypted on-device using `expo-secure-store`.

Shikai requests only read-only access to your GitHub data. It cannot modify, create, or delete anything.

---

## Built with

React Native · Expo · TypeScript · React Query · Zustand · Reanimated · FlashList

GitHub REST & GraphQL APIs · GitHub OAuth (PKCE) · Cloudflare Workers

---

## Getting started

1. Open Shikai and tap **Sign in with GitHub**
2. Authorize the app - it only requests read permissions
3. You're in. Your dashboard loads instantly.

---

Built with care by [Atharv Dange](https://x.com/atharvdangedev).
