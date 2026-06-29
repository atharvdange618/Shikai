# Shikai - App Plan & Reference Doc

> A read-only GitHub dashboard mobile app built with Expo Router, TanStack Query, and Zustand.
> This document is the single source of truth for all planning decisions made before development.

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Design System](#2-design-system)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Libraries & Dependencies](#5-libraries--dependencies)
6. [Data Fetching Strategy](#6-data-fetching-strategy)
7. [GitHub API Surface](#7-github-api-surface)
8. [Screen Specifications](#8-screen-specifications)
9. [State Management](#9-state-management)
10. [Key Technical Decisions](#10-key-technical-decisions)

---

## 1. App Overview

**Name:** Shikai
**Platform:** Android (Expo SDK 54, Expo Router)
**Nature:** Read-only. The app only fetches and displays data. No GitHub write operations.
**Auth model:** Single logged-in user via GitHub OAuth (Sign in with GitHub). Not multi-user.
**Offline support:** Network state detection via `@react-native-community/netinfo`. MMKV-backed React Query disk persistence with 24h max age. Offline banner with safe area support.

---

## 2. Design System

### Typography

Two fonts only:

| Font               | Usage                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Inter**          | All UI text - body, labels, descriptions, headings                 |
| **JetBrains Mono** | Technical content - commit hashes, file names, language tags, code |

Type scale (8pt grid aligned):

| Role    | Size | Weight |
| ------- | ---- | ------ |
| Display | 28   | 700    |
| Heading | 22   | 600    |
| Title   | 18   | 600    |
| Body    | 15   | 400    |
| Label   | 13   | 500    |
| Caption | 11   | 400    |

### Color Palette

**60/30/10 rule applied to both modes.**

#### Light Mode (pastel, not blinding white)

| Role            | Hex       | Usage                             |
| --------------- | --------- | --------------------------------- |
| 60% Background  | `#F0F4F8` | Screen backgrounds                |
| 30% Surface     | `#E2EAF1` | Cards, inputs, secondary surfaces |
| 10% Accent      | `#3B82F6` | CTAs, active states, badges       |
| Text Primary    | `#1A2332` | Headings, primary content         |
| Text Secondary  | `#5A6B7B` | Descriptions, timestamps, meta    |
| Border          | `#C8D6E3` | Card borders, dividers            |
| Success / Green | `#22C55E` | Contribution graph, open status   |
| Danger / Red    | `#EF4444` | Closed status, errors             |

#### Dark Mode (easy on eyes, not pitch black)

| Role            | Hex       | Usage                                  |
| --------------- | --------- | -------------------------------------- |
| 60% Background  | `#0D1117` | Screen backgrounds (GitHub's own dark) |
| 30% Surface     | `#161B22` | Cards, inputs, secondary surfaces      |
| 10% Accent      | `#58A6FF` | CTAs, active states, badges            |
| Text Primary    | `#E6EDF3` | Headings, primary content              |
| Text Secondary  | `#8B949E` | Descriptions, timestamps, meta         |
| Border          | `#30363D` | Card borders, dividers                 |
| Success / Green | `#3FB950` | Contribution graph, open status        |
| Danger / Red    | `#F85149` | Errors                                 |

#### Language Dot Colors

Following the [GitHub Linguist language color spec](https://github.com/ozh/github-colors/blob/master/colors.json). Use a local JSON map file - don't hardcode every color inline.

### Spacing

Strict 8pt grid. Only use these values:

```
4, 8, 12, 16, 24, 32, 48, 64
```

### Art Style

Clean minimal. Soft card elevation with subtle shadow. Intentional whitespace. Cards have rounded corners (`borderRadius: 12`), slight border, and a gentle shadow.

Shadow spec (light mode):

```
shadowColor: '#1A2332'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.06
shadowRadius: 4
elevation: 2
```

Shadow spec (dark mode): No shadow. Use border (`#30363D`) to define card edges instead.

### Icons

`@expo/vector-icons` - specifically the `Octicons` set where possible (GitHub-native icon feel), fall back to `Feather` or `MaterialCommunityIcons` for anything Octicons doesn't cover.

---

## 3. Navigation Architecture

### Overview

```
Root Stack (_layout.tsx)
├── /sign-in                      ← First launch, no token stored
│
└── /(app)/
    ├── Guard: checks expo-secure-store for token
    │   └── If missing → <Redirect href="/sign-in" />
    │
    ├── (tabs)/                  ← Native bottom tabs (6 tabs)
    │   ├── /overview/           ← Overview / Home tab
    │   │   ├── _layout.tsx
    │   │   └── index.tsx
    │   │
    │   ├── /repos/              ← Repos tab (Stack)
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx        ← Repos list
    │   │   └── [repoId]/
    │   │       ├── _layout.tsx
    │   │       ├── index.tsx    ← Repo details
    │   │       ├── commits.tsx  ← Commits list
    │   │       ├── files.tsx    ← File tree
    │   │       ├── file.tsx     ← Single file viewer
    │   │       ├── issues.tsx   ← Issues list
    │   │       ├── issue/[number].tsx ← Issue detail
    │   │       ├── pull-requests.tsx  ← PRs list
    │   │       └── pr/[number].tsx    ← PR detail
    │   │
    │   ├── /search/             ← Search tab (Stack)
    │   │   ├── _layout.tsx
    │   │   └── index.tsx        ← Global search with tab switching
    │   │
    │   ├── /stars/              ← Stars tab (Stack)
    │   │   ├── _layout.tsx
    │   │   └── index.tsx        ← Starred repos list
    │   │
    │   ├── /watchlist/          ← Watchlist tab (Stack)
    │   │   ├── _layout.tsx
    │   │   └── index.tsx        ← Bookmarked repos
    │   │
    │   └── /profile/            ← Profile tab (Stack)
    │       ├── _layout.tsx
    │       ├── index.tsx        ← Profile screen
    │       └── about.tsx        ← About screen
    │
    ├── /repo/[repoId]/          ← Repo detail screens (Stack, pushed from tabs)
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── commits.tsx
    │   ├── files.tsx
    │   ├── file.tsx
    │   ├── issues.tsx
    │   ├── issue/[number].tsx
    │   ├── pull-requests.tsx
    │   └── pr/[number].tsx
    │
    └── /user/[username]/        ← User profile (Stack, pushed from search/contributors)
        ├── _layout.tsx
        └── index.tsx

+not-found.tsx                   ← Custom 404 screen
```

### Navigator Breakdown

| Navigator               | Location         | Why                                                |
| ----------------------- | ---------------- | -------------------------------------------------- |
| Stack                   | Root             | Handles sign-in → app transition                   |
| Native Bottom Tabs      | `(tabs)`         | Main 6-tab navigation                              |
| Stack                   | Inside each tab  | Tab-level navigation (repos, search, stars, etc.)   |
| Stack                   | `(app)/repo/`    | Repo detail screens (pushed from tabs)             |
| Stack                   | `(app)/user/`    | User profile (pushed from search/contributors)     |

### Repo/User Detail Navigation

Repo and user detail screens live outside tabs in `(app)/repo/[repoId]/` and `(app)/user/[username]/`. They are pushed onto the root stack via `router.push()`, which overlays them on top of the tab navigator. This avoids the complexity of nested tab+stack navigation and provides a clean back button behavior.

---

## 4. Folder Structure

```
shikai/
├── app/
│   ├── _layout.tsx                     ← Root stack layout (ErrorBoundary, splash, auth redirect)
│   ├── sign-in.tsx                     ← GitHub OAuth sign-in screen
│   ├── +not-found.tsx                  ← Custom 404 screen
│   │
│   └── (app)/
│       ├── _layout.tsx                 ← Auth guard (checks token)
│       │
│       ├── (tabs)/
│       │   ├── _layout.tsx             ← Bottom tabs config (6 tabs, keyboard shortcuts, ErrorBoundary)
│       │   │
│       │   ├── overview/
│       │   │   ├── _layout.tsx
│       │   │   └── index.tsx           ← Overview: pinned repos, contribution graph, activity feed
│       │   │
│       │   ├── repos/
│       │   │   ├── _layout.tsx
│       │   │   └── index.tsx           ← Repos list
│       │   │
│       │   ├── search/
│       │   │   ├── _layout.tsx
│       │   │   └── index.tsx           ← Global search (repos/users/issues tabs)
│       │   │
│       │   ├── stars/
│       │   │   ├── _layout.tsx
│       │   │   └── index.tsx           ← Starred repos list
│       │   │
│       │   ├── watchlist/
│       │   │   ├── _layout.tsx
│       │   │   └── index.tsx           ← Bookmarked repos with MMKV persistence
│       │   │
│       │   └── profile/
│       │       ├── _layout.tsx
│       │       ├── index.tsx           ← Profile screen with sign-out
│       │       └── about.tsx           ← About screen
│       │
│       ├── repo/
│       │   ├── _layout.tsx
│       │   └── [repoId]/
│       │       ├── index.tsx           ← Repo details
│       │       ├── commits.tsx         ← Commits list
│       │       ├── files.tsx           ← File tree with search
│       │       ├── file.tsx            ← Single file viewer
│       │       ├── issues.tsx          ← Issues list
│       │       ├── issue/[number].tsx  ← Issue detail
│       │       ├── pull-requests.tsx   ← PRs list
│       │       └── pr/[number].tsx     ← PR detail
│       │
│       └── user/
│           ├── _layout.tsx
│           └── [username]/
│               └── index.tsx           ← User profile (avatar, bio, stats, top repos)
│
├── components/
│   ├── index.ts                        ← Barrel export
│   ├── AnimatedSplashScreen.tsx
│   ├── BlockingScreen.tsx              ← Root/jailbreak detection
│   ├── Card.tsx                        ← Reusable card component
│   ├── ErrorBoundary.tsx               ← Crash recovery with fallback UI
│   ├── OfflineBanner.tsx               ← Network status indicator
│   ├── VersionCheckBanner.tsx          ← Update available banner
│   │
│   ├── navigation/
│   │   └── TabBarIcon.tsx              ← Custom tab bar icon with filled variant
│   │
│   ├── overview/
│   │   ├── ActivityFeed.tsx            ← FlashList-based event feed
│   │   ├── ContributionGraph.tsx       ← SVG heatmap (react-native-svg)
│   │   ├── ContributionStatsRow.tsx    ← Streaks and most active day
│   │   └── PinnedRepoCard.tsx          ← Pinned repo card with prefetch
│   │
│   ├── repo/
│   │   ├── BranchSelector.tsx          ← Horizontal pill branch picker
│   │   ├── ContributorRow.tsx          ← Contributor avatar + name
│   │   ├── LanguageBar.tsx             ← Proportional language segments
│   │   ├── RepoCard.tsx                ← Repo card with bookmark toggle
│   │   ├── RepoFilters.tsx             ← Language/type/sort filter pills
│   │   └── VirtualizedCodeViewer.tsx   ← FlashList-based file viewer
│   │
│   └── shared/
│       ├── Alert.tsx                   ← Themed alert dialog
│       ├── ListItemSeparator.tsx       ← FlashList separator
│       ├── MarkdownRenderer.tsx        ← GitHub API markdown + syntax highlighting
│       ├── SearchBar.tsx               ← Reusable search input
│       └── Tooltip.tsx                 ← Info tooltip with mutual exclusivity
│
├── hooks/
│   ├── useContributions.ts             ← GraphQL contribution calendar
│   ├── useDebounce.ts                  ← Debounce hook
│   ├── useEvents.ts                    ← Activity events (infinite)
│   ├── useGlobalSearch.ts              ← GitHub Search API (repos/users/issues)
│   ├── useIssueDetail.ts               ← Single issue with comments
│   ├── useIssues.ts                    ← Repo issues (infinite)
│   ├── useKeyboardShortcuts.ts         ← Cmd+1-6, Cmd+F, arrows, Escape
│   ├── useLatestRelease.ts             ← GitHub releases for version check
│   ├── usePinnedRepos.ts               ← GraphQL pinned repos
│   ├── usePrefetchOnPress.ts           ← Speculative data loading
│   ├── usePullRequestDetail.ts         ← Single PR with comments
│   ├── usePullRequests.ts              ← Repo PRs (infinite)
│   ├── useRecentActivity.ts            ← Recent events for overview
│   ├── useRepoCount.ts                 ← Total repo count
│   ├── useRepoDetails.ts               ← Single repo details
│   ├── useRepos.ts                     ← User repos (infinite)
│   ├── useSearchIndex.ts               ← MiniSearch fuzzy index
│   ├── useSocialAccounts.ts            ← User social links
│   ├── useStarred.ts                   ← Starred repos (infinite)
│   ├── useUser.ts                      ← Authenticated user
│   ├── useUserProfile.ts               ← Any user's profile
│   └── useUserProfileRepos.ts          ← Any user's top repos
│
├── lib/
│   ├── axios.ts                        ← Axios instance with token header
│   ├── file-utils.ts                   ← File tree utilities
│   ├── github-graphql.ts               ← GraphQL queries + fetcher
│   ├── github-rest.ts                  ← REST API functions
│   ├── mmkv.ts                         ← MMKV instance + cache clear
│   ├── persister.ts                    ← React Query disk persistence
│   ├── prefetch.ts                     ← Prefetch functions for tabs
│   ├── query-client.ts                 ← QueryClient config
│   ├── secure-storage.ts               ← expo-secure-store wrapper
│   ├── use-online-manager.ts           ← Network state manager
│   └── utils.ts                        ← encodeRepoId/decodeRepoId + helpers
│
├── stores/
│   └── auth.store.ts                   ← Zustand: token + user state
│
├── constants/
│   ├── theme.ts                        ← All tokens: colors, spacing, typography
│   └── language-colors.json            ← GitHub Linguist color map
│
└── types/
    └── github.types.ts                 ← REST API response types
```

---

## 5. Libraries & Dependencies

### Navigation

```
expo-router
react-native-screens
react-native-safe-area-context
react-native-gesture-handler
```

### Data & State

```
@tanstack/react-query
@tanstack/react-query-persist-client
@tanstack/query-async-storage-persister
zustand
axios
```

### UI & Animation

```
react-native-reanimated
expo-image                    ← Use over React Native's Image
@shopify/flash-list           ← Use over FlatList for all lists
@expo/vector-icons
react-native-svg              ← For contribution heatmap
react-native-webview          ← For MarkdownRenderer (GitHub /markdown API)
react-native-syntax-highlighter ← For code blocks in markdown
```

### Storage & Persistence

```
react-native-mmkv             ← Fast key-value storage (watchlist, cache, offline)
expo-secure-store             ← For OAuth token storage - never AsyncStorage for secrets
```

### Fonts

```
@expo-google-fonts/inter
@expo-google-fonts/jetbrains-mono
expo-font
```

### Utilities

```
expo-linking                  ← Opening external URLs
expo-clipboard                ← Copy commit hashes, clone URLs
expo-auth-session             ← GitHub OAuth flow
expo-web-browser              ← Auth session browser
expo-haptics                  ← Keyboard shortcut feedback
minisearch                    ← Fuzzy search index for global search
@react-native-community/netinfo ← Network state detection for offline support
```

---

## 6. Data Fetching Strategy

### Auth Model

User signs in with GitHub OAuth on first launch. Access token is obtained via `expo-auth-session` and `expo-web-browser`. Token is stored in `expo-secure-store`. All API requests attach it as:

```
Authorization: Bearer <token>
```

Rate limits with OAuth token:

- REST API: 5000 requests/hour
- GraphQL API: 5000 points/hour

Both are well within what this app needs.

### Two API Clients

**1. Axios instance for REST** (`lib/axios.ts`)

- Base URL: `https://api.github.com`
- Default headers: `Authorization`, `Accept: application/vnd.github+json`
- Token loaded from Zustand store on init

**2. GraphQL fetcher** (`lib/github-graphql.ts`)

- Single `POST` to `https://api.github.com/graphql`
- Same Axios instance, just POST with `{ query, variables }`
- No Apollo, no URQL - three queries don't justify the overhead

### TanStack Query Setup

Wrap the app with `QueryClientProvider`. Config includes disk persistence via MMKV with 24h max age. Ephemeral queries (search, activity feed) excluded from disk cache.

### Infinite Scroll Pattern

Repos, Stars, Search results, Issues, PRs, and Activity Feed all use `useInfiniteQuery` with `per_page=10`. FlashList's `onEndReached` triggers `fetchNextPage()`. No manual pagination state needed.

### Prefetch Strategy

`lib/prefetch.ts` provides `prefetchOverview` and `prefetchProfile` called on tab mount. `usePrefetchOnPress` hook prefetches data speculatively when user presses on items (e.g., prefetching issues/PRs when pressing a repo card).

---

## 7. GitHub API Surface

### REST Endpoints

| Feature            | Method | Endpoint                                             |
| ------------------ | ------ | ---------------------------------------------------- |
| Authenticated user | GET    | `/user`                                              |
| User's repos       | GET    | `/user/repos?per_page=10&page={n}&sort=updated`      |
| Single repo        | GET    | `/repos/{owner}/{repo}`                              |
| Repo languages     | GET    | `/repos/{owner}/{repo}/languages`                    |
| Repo commits       | GET    | `/repos/{owner}/{repo}/commits?per_page=10&page={n}` |
| Repo contributors  | GET    | `/repos/{owner}/{repo}/contributors`                 |
| Repo branches      | GET    | `/repos/{owner}/{repo}/branches`                     |
| File tree          | GET    | `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1`  |
| File content       | GET    | `/repos/{owner}/{repo}/contents/{path}`              |
| README             | GET    | `/repos/{owner}/{repo}/readme`                       |
| Starred repos      | GET    | `/user/starred?per_page=10&page={n}`                 |
| Activity events    | GET    | `/users/{username}/events?per_page=20`               |
| User profile       | GET    | `/users/{username}`                                  |
| User repos         | GET    | `/users/{username}/repos?per_page=10&sort=updated`   |
| Repo issues        | GET    | `/repos/{owner}/{repo}/issues?per_page=10&page={n}`  |
| Issue detail       | GET    | `/repos/{owner}/{repo}/issues/{number}`              |
| Issue comments     | GET    | `/repos/{owner}/{repo}/issues/{number}/comments`     |
| Repo pull requests | GET    | `/repos/{owner}/{repo}/pulls?per_page=10&page={n}`   |
| PR detail          | GET    | `/repos/{owner}/{repo}/pulls/{number}`               |
| PR comments        | GET    | `/repos/{owner}/{repo}/pulls/{number}/comments`      |
| PR reviews         | GET    | `/repos/{owner}/{repo}/pulls/{number}/reviews`       |
| Social accounts    | GET    | `/users/{username}/social_accounts`                  |
| Latest release     | GET    | `/repos/{owner}/{repo}/releases/latest`              |
| Search repos       | GET    | `/search/repositories?q={query}&per_page=10`         |
| Search users       | GET    | `/search/users?q={query}&per_page=10`                |
| Search issues      | GET    | `/search/issues?q={query}+repo:{owner}/{repo}`       |
| Markdown render    | POST   | `/markdown` (body: `{ text, mode: "gfm" }`)         |

### GraphQL Queries (via POST to `/graphql`)

**Pinned Repositories**

```graphql
query PinnedRepos {
  viewer {
    pinnedItems(first: 6, types: [REPOSITORY]) {
      nodes {
        ... on Repository {
          name
          description
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          url
        }
      }
    }
  }
}
```

**Contribution Graph**

```graphql
query ContributionGraph {
  viewer {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
      }
    }
  }
}
```

**Commit Count** (per repo)

```graphql
query CommitCount($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history {
            totalCount
          }
        }
      }
    }
  }
}
```

---

## 8. Screen Specifications

### Overview Screen (`/overview`)

**Data sources:** `/user` (REST) + GraphQL for pinned repos and contribution graph + `/users/{username}/events` (REST)

**Layout (ScrollView, top to bottom):**

1. Profile header: avatar (`expo-image`), display name, username (`@handle`), bio, location, website, follower/following count
2. Pinned Repositories: horizontal scroll of up to 6 `PinnedRepoCard` components
3. Contribution Stats Row: current streak, longest streak, most active day
4. Contribution Graph: custom SVG heatmap built with `react-native-svg`, last 52 weeks, GitHub's own color values from the API response
5. Recent Activity: FlashList of last 20 events - push events, star events, fork events, with `onEndReached` pagination

---

### Repos Screen (`/repos`)

**Data source:** `useInfiniteQuery` on `/user/repos?per_page=10&sort=updated`

**Layout:**

1. Search bar (client-side filter on fetched data)
2. Filter pills (horizontal ScrollView): Language, Type (public/private/fork), Sort (updated/stars/name)
3. FlashList of `RepoCard` components with infinite scroll

**RepoCard contains:**

- Repo name (Inter, Title weight)
- Visibility badge: `Public` / `Private` (Badge component)
- Description (capped at 2 lines)
- Primary language dot + name
- License (if exists)
- Last updated timestamp (relative: "2 days ago")
- Star count with Octicons star icon
- Topics/tags (horizontal scroll of small pill badges, shown if they exist)
- Bookmark toggle (watchlist)

---

### Repo Details Screen (`/repo/[repoId]`)

**Data sources:** `/repos/{owner}/{repo}`, `/languages`, `/contributors`, `/readme`, GraphQL for commit count, first item from `/commits` for last commit message

**Layout (ScrollView):**

1. Header: repo name, visibility badge, description, website URL (tappable with `expo-linking`)
2. Topics row (pill badges)
3. Stats row: stars, forks, watchers, commit count (from GraphQL)
4. Last commit: message + relative time + commit hash (JetBrains Mono, tappable to copy)
5. Language progress bar: proportional colored segments from `/languages` data
6. Health badges: missing license, no topics, no README, stale repo (>90 days)
7. Contributors row: up to 8 avatars with fallback "+N more" label
8. Action buttons row:
   - **Code** → navigates to file tree
   - **Commits** → navigates to commits list
   - **Issues** → navigates to issues list
   - **Pull Requests** → navigates to PRs list
9. README: rendered with `MarkdownRenderer` using GitHub's `/markdown` API

---

### Search Screen (`/search`)

**Data sources:** GitHub Search API (`/search/repositories`, `/search/users`, `/search/issues`)

**Layout:**

1. Search bar with debounce (300ms)
2. Tab switching: Repos | Users | Issues
3. FlashList of results with infinite scroll
4. Result cards:
   - Repos: RepoCard with language, stars, description
   - Users: Avatar, username, bio snippet
   - Issues: Title, state badge, repo name, labels
5. Tap navigates in-app to repo detail, user profile, or issue detail

**Fuzzy Search:** MiniSearch index built on user's repos for offline-capable local search.

---

### Watchlist Screen (`/watchlist`)

**Data source:** MMKV local storage (`lib/mmkv.ts`)

**Layout:**

1. Search bar (filter bookmarked repos by name)
2. FlashList of RepoCard components filtered by bookmarked IDs
3. Empty state with onboarding copy when no repos are bookmarked
4. Bookmark toggle on every RepoCard throughout the app persists to MMKV

---

### Stars Screen (`/stars`)

**Data source:** `useInfiniteQuery` on `/user/starred?per_page=10`

**Layout:** Identical structure to Repos screen (search + filters + FlashList of RepoCard). Reuse the same `RepoCard` component.

---

### Profile Screen (`/profile`)

**Data source:** `/user` (same data as Overview header, use cached query)

**Layout:**

1. Large avatar
2. Display name, username, bio
3. Stats row: repos count, followers, following, stars given
4. Location, company, website, Twitter handle (if set)
5. Social accounts (LinkedIn, Twitter, etc.)
6. "About" button → navigates to about screen
7. "Sign Out" button with confirmation dialog → clears MMKV cache and token

---

### About Screen (`/profile/about`)

**Layout:**

1. Shikai logo and app description
2. Section: About the App - description of Shikai's purpose and features
3. Section: About the Developer - Atharv Dange info with links to GitHub and X
4. Interactive version check (loading spinner, available pill, or up-to-date checkmark)
5. Open source section with credits/acknowledgments

---

### User Profile Screen (`/user/[username]`)

**Data sources:** `/users/{username}`, `/users/{username}/repos?sort=updated&per_page=6`

**Layout (ScrollView):**

1. Large avatar
2. Display name, username, bio
3. Stats row: repos count, followers, following
4. Location, company, website, Twitter handle (if set)
5. Social accounts
6. Top Repositories: up to 6 repos sorted by recent update
7. Skeleton states during loading
8. Pull-to-refresh

---

### Commits Screen (`/repo/[repoId]/commits`)

**Data source:** `useInfiniteQuery` on `/repos/{owner}/{repo}/commits?per_page=10`

**Layout:**

1. Header with repo name
2. FlashList of commit items: commit message, author avatar + name, relative timestamp, SHA (JetBrains Mono, tappable to copy)
3. Infinite scroll loads next 10 commits on end reached

---

### Issues Screen (`/repo/[repoId]/issues`)

**Data source:** `useInfiniteQuery` on `/repos/{owner}/{repo}/issues?per_page=10`

**Layout:**

1. FlashList of issue items: title, state badge (open/closed), labels, author, comment count, created date
2. Tap navigates to issue detail screen
3. Infinite scroll

---

### Pull Requests Screen (`/repo/[repoId]/pull-requests`)

**Data source:** `useInfiniteQuery` on `/repos/{owner}/{repo}/pulls?per_page=10`

**Layout:**

1. FlashList of PR items: title, state badge, draft indicator, author, review comments, created date
2. Tap navigates to PR detail screen
3. Infinite scroll

---

### Issue/PR Detail Screen

**Data sources:** `/repos/{owner}/{repo}/issues/{number}` or `/repos/{owner}/{repo}/pulls/{number}`, plus comments endpoint

**Layout (ScrollView):**

1. Title, state badge, labels
2. Author + created date
3. Markdown body rendered via `MarkdownRenderer`
4. Comments section with markdown rendering

---

### Sign In Screen (`/sign-in`)

**Layout:**

1. Shikai logo
2. Short explanation of why GitHub authorization is needed and what permissions are requested (`read:user`, `repo`)
3. "Sign in with GitHub" button: opens GitHub OAuth flow via `expo-web-browser`
4. On success: receives authorization code, exchanges for access token, saves to `expo-secure-store` + Zustand, clears MMKV cache, navigates to `/(app)/(tabs)`

---

## 9. State Management

### Zustand Store (`stores/auth.store.ts`)

```ts
interface AuthStore {
  token: string | null;
  user: GitHubUser | null;
  setToken: (token: string) => void;
  setUser: (user: GitHubUser) => void;
  clearAuth: () => void;
}
```

That's the only Zustand store needed. Everything else (repos, stars, commits, etc.) is server state owned by TanStack Query. Don't put server state in Zustand.

Note: Token is obtained via OAuth flow, not manual entry.

### MMKV Storage (`lib/mmkv.ts`)

Used for:
- Watchlist (bookmarked repo IDs)
- React Query disk persistence
- Offline query cache
- Developer mode override flag

Cache is cleared on sign-in and sign-out.

### TanStack Query Owns All Server State

- `useUser` - `/user`
- `useRepos` - infinite query, `/user/repos`
- `useRepoDetails` - `/repos/{owner}/{repo}`
- `useRepoLanguages` - `/repos/{owner}/{repo}/languages`
- `useCommits` - infinite query, `/repos/{owner}/{repo}/commits`
- `useContributors` - `/repos/{owner}/{repo}/contributors`
- `useReadme` - `/repos/{owner}/{repo}/readme`
- `useStarred` - infinite query, `/user/starred`
- `useContributions` - GraphQL
- `usePinnedRepos` - GraphQL
- `useCommitCount` - GraphQL
- `useUserProfile` - `/users/{username}`
- `useUserProfileRepos` - `/users/{username}/repos`
- `useGlobalSearch` - `/search/repositories`, `/search/users`, `/search/issues`
- `useIssues` - infinite query, `/repos/{owner}/{repo}/issues`
- `useIssueDetail` - `/repos/{owner}/{repo}/issues/{number}`
- `usePullRequests` - infinite query, `/repos/{owner}/{repo}/pulls`
- `usePullRequestDetail` - `/repos/{owner}/{repo}/pulls/{number}`
- `useEvents` - `/users/{username}/events`
- `useRecentActivity` - `/users/{username}/events` (overview feed)
- `useLatestRelease` - `/repos/{owner}/{repo}/releases/latest`
- `useRepoCount` - `/user` (extracted `public_repos`)
- `useSocialAccounts` - `/users/{username}/social_accounts`

---

## 10. Key Technical Decisions

| Decision           | Choice                         | Reason                                                               |
| ------------------ | ------------------------------ | -------------------------------------------------------------------- |
| Routing            | Expo Router                    | File-based routing, native tabs built-in, automatic deep linking     |
| List rendering     | FlashList (Shopify)            | Better perf than FlatList - native item recycling                    |
| Image rendering    | expo-image                     | Better caching, progressive loading, blurhash support                |
| Auth flow          | expo-auth-session              | GitHub OAuth with code exchange                                      |
| Token storage      | expo-secure-store              | Never AsyncStorage for secrets                                       |
| REST client        | Axios                          | Familiar, interceptor support for auth header injection              |
| GraphQL client     | Raw Axios POST                 | Only 3 queries - Apollo/URQL would be overkill                       |
| Contribution graph | Custom SVG (react-native-svg)  | Not available in REST API, GraphQL returns color values directly     |
| Pinned repos       | GraphQL                        | Not available in REST API at all                                     |
| Commit count       | GraphQL (`history.totalCount`) | Cleaner than paginating REST to count                                |
| File viewer        | FlashList-based                | Handles files of any length without truncation                       |
| Markdown rendering | GitHub `/markdown` API         | 100% GFM fidelity, themed CSS, syntax highlighting via `pl-*` classes |
| Local storage      | MMKV                           | 30x faster than AsyncStorage, used for watchlist, cache, persistence |
| Offline support    | NetInfo + MMKV persistence     | Network detection + disk-persisted React Query cache with 24h max age |
| Search             | MiniSearch                     | Fuzzy search index for repos, fast client-side filtering             |
| Fonts              | Inter + JetBrains Mono         | Inter for readability, JetBrains Mono for technical content          |
| Styling            | `StyleSheet.create()`          | No CSS framework - raw RN stylesheets as agreed                      |
| Repo ID encoding   | `~~` separator                 | Safe encoding that won't clash with route params or file paths       |
