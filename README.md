# Shikai

> A read-only GitHub companion for Android.

**Shikai** shows you your GitHub data the way it deserves to be seen. Your repos, your contributions, your activity - presented clearly, without the noise of the full GitHub mobile experience.

GitHub's mobile app is built for _work_ - reviewing PRs, responding to issues, managing projects. Shikai is built for _you_. No notifications. No write operations. No anxiety about accidentally merging something on a tiny screen. Just your work, at a glance.

---

## Features

**Dashboard** - Pinned repos, contribution graph, and a live activity feed. Pushes, stars, forks, releases, PRs, and issues - all in one place. Tap any item to jump to the repo.

**Repositories** - Browse all your repos with smart filters by language, type, or sort order. Explore file trees, view files with syntax highlighting, browse commit history per branch, and track issues and pull requests. Health badges flag missing licenses, no topics, and stale repos.

**Stars** - Search and sort your starred repos by recent activity or name. Quick access to the projects that inspire you.

**Profile** - Your GitHub card, always ready to share. Stats, social links, location, and hireable status - perfect for meetups, interviews, or just admiring your streak.

**Version Check** - Shikai checks for updates on launch and shows a dismissible banner when a new version is available.

---

## Design Principles

- **Read-only by design.** No write operations means no accidental mistakes. This is your safe viewing space.
- **Mobile-first, native feel.** Smooth animations, haptic feedback, and a UI that feels at home on your phone.
- **Information at the right density.** Not too sparse, not overwhelming. Just enough detail to be useful, with deeper views when you need them.

Light and dark themes are supported - a warm, paper-like aesthetic in light mode and a GitHub-inspired dark palette in dark mode. Typography uses Inter for body text and JetBrains Mono for code.

---

## Security

Your token is handled via a secure Cloudflare Worker proxy and never leaves your device after the initial exchange. All subsequent API requests go directly from your phone to GitHub. The app detects rooted devices and debuggers to prevent usage on compromised environments. Tokens are encrypted on-device using `expo-secure-store`.

Shikai requests only read-only access to your GitHub data. It cannot modify, create, or delete anything.

**Developer mode** is blocked by default on release builds. Developers who need to use Shikai with dev options enabled can override this restriction after accepting a warning about potential data access via ADB.

---

## Getting Started

1. Open Shikai and tap **Sign in with GitHub**
2. Authorize the app - it only requests read permissions
3. You're in. Your dashboard loads instantly.

---

## Built With

React Native · Expo · TypeScript · React Query · Zustand · Reanimated · FlashList · GitHub REST & GraphQL APIs · GitHub OAuth (PKCE) · Cloudflare Workers

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT

---

Built by [Atharv Dange](https://x.com/atharvdangedev).
