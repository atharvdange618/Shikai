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
**Platform:** iOS + Android (Expo SDK 55, Expo Router)
**Nature:** Read-only. The app only fetches and displays data. No GitHub write operations.
**Auth model:** Single logged-in user via GitHub Personal Access Token (PAT). Not multi-user.
**Offline support:** None in v1.

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
├── /token-setup                  ← First launch, no token stored
│
└── /(app)/
    ├── Guard: checks expo-secure-store for token
    │   └── If missing → <Redirect href="/token-setup" />
    │
    └── /(tabs)/                  ← Native bottom tabs
        ├── / (index)             ← Overview / Home tab
        │
        ├── /repos/               ← Repos tab (Stack)
        │   ├── index             ← Repos list
        │   └── [repoId]/
        │       └── index         ← Repo details screen
        │
        ├── /stars/               ← Stars tab (Stack)
        │   └── index             ← Starred repos list
        │
        └── /profile/             ← Profile tab (Drawer)
            ├── index             ← Profile screen
            └── settings          ← Settings screen (drawer item)

/commits/[repoId]                 ← Full commits screen (pushed from Repo Details)
```

### Navigator Breakdown

| Navigator               | Location         | Why                                                |
| ----------------------- | ---------------- | -------------------------------------------------- |
| Stack                   | Root             | Handles token-setup → app transition               |
| Native Bottom Tabs      | `(tabs)`         | Main 4-tab navigation                              |
| Stack                   | Inside repos tab | Repos list → Repo details navigation               |
| Drawer                  | Profile tab      | Profile → Settings                                 |
| Custom Reanimated Panel | Repo Details     | File explorer (NOT a drawer navigator - see below) |

### Why Not a Drawer Navigator in Repo Details

A Drawer Navigator is a navigation primitive that manages routes and history. The file explorer in Repo Details doesn't need any of that. It's just a slide-in panel that shows a tree view. Using a custom Reanimated animated panel (bottom sheet or side panel) gives full control over animation, layout, and behavior with zero navigation state overhead. The Drawer Navigator stays only in the Profile tab where actual route-based navigation is needed.

---

## 4. Folder Structure

```
shikai/
├── app/
│   ├── _layout.tsx                     ← Root stack layout
│   ├── token-setup.tsx                 ← Token entry screen
│   │
│   └── (app)/
│       ├── _layout.tsx                 ← Auth guard (checks token)
│       │
│       ├── (tabs)/
│       │   ├── _layout.tsx             ← Bottom tabs config
│       │   ├── index.tsx               ← Overview screen
│       │   │
│       │   ├── repos/
│       │   │   ├── _layout.tsx         ← Repos stack
│       │   │   ├── index.tsx           ← Repos list
│       │   │   └── [repoId]/
│       │   │       ├── _layout.tsx
│       │   │       └── index.tsx       ← Repo details
│       │   │
│       │   ├── stars/
│       │   │   ├── _layout.tsx
│       │   │   └── index.tsx           ← Stars list
│       │   │
│       │   └── profile/
│       │       ├── _layout.tsx         ← Drawer layout
│       │       ├── index.tsx           ← Profile screen
│       │       └── settings.tsx        ← Settings screen
│       │
│       └── commits/
│           └── [repoId].tsx            ← Full commits history
│
├── components/
│   ├── ui/                             ← Base design system components
│   │   ├── Text.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Divider.tsx
│   │   ├── Avatar.tsx
│   │   └── ProgressBar.tsx
│   │
│   ├── repo/
│   │   ├── RepoCard.tsx
│   │   ├── RepoFilters.tsx
│   │   ├── LanguageBar.tsx
│   │   ├── ContributorRow.tsx
│   │   └── FileExplorerPanel.tsx       ← Reanimated slide panel
│   │
│   ├── overview/
│   │   ├── ContributionGraph.tsx       ← Built with react-native-svg
│   │   ├── PinnedRepoCard.tsx
│   │   └── ActivityFeed.tsx
│   │
│   └── shared/
│       ├── SearchBar.tsx
│       ├── InfiniteList.tsx            ← Wraps FlashList + useInfiniteQuery
│       ├── LoadingState.tsx
│       └── ErrorState.tsx
│
├── lib/
│   ├── axios.ts                        ← Axios instance with token header
│   ├── github-rest.ts                  ← REST API functions
│   ├── github-graphql.ts               ← GraphQL queries + fetcher
│   └── secure-storage.ts               ← expo-secure-store wrapper
│
├── hooks/
│   ├── useUser.ts
│   ├── useRepos.ts
│   ├── useRepoDetails.ts
│   ├── useStarred.ts
│   ├── useCommits.ts
│   ├── useContributions.ts             ← GraphQL
│   └── usePinnedRepos.ts               ← GraphQL
│
├── stores/
│   └── auth.store.ts                   ← Zustand: token + user state
│
├── constants/
│   ├── theme.ts                        ← All tokens: colors, spacing, typography
│   └── language-colors.json            ← GitHub Linguist color map
│
└── types/
    ├── github.types.ts                 ← REST API response types
    └── github-graphql.types.ts         ← GraphQL response types
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
react-native-markdown-display ← For rendering repo READMEs
```

### Fonts

```
@expo-google-fonts/inter
@expo-google-fonts/jetbrains-mono
expo-font
```

### Storage & Utilities

```
expo-secure-store             ← For GitHub PAT - never AsyncStorage for secrets
expo-linking                  ← Opening external URLs
expo-clipboard                ← Copy commit hashes, clone URLs
```

---

## 6. Data Fetching Strategy

### Auth Model

User enters a GitHub Personal Access Token (PAT) on first launch. Stored in `expo-secure-store`. All API requests attach it as:

```
Authorization: Bearer <token>
```

Rate limits with a PAT:

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

Wrap the app with `QueryClientProvider`. Config:

```ts
{
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    }
  }
}
```

### Infinite Scroll Pattern

Repos list and Stars list use `useInfiniteQuery` with `per_page=10`. FlashList's `onEndReached` triggers `fetchNextPage()`. No manual pagination state needed.

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
| File tree          | GET    | `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1`  |
| File content       | GET    | `/repos/{owner}/{repo}/contents/{path}`              |
| README             | GET    | `/repos/{owner}/{repo}/readme`                       |
| Starred repos      | GET    | `/user/starred?per_page=10&page={n}`                 |
| Activity events    | GET    | `/users/{username}/events?per_page=20`               |

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

### Overview Screen (`/`)

**Data sources:** `/user` (REST) + GraphQL for pinned repos and contribution graph + `/users/{username}/events` (REST)

**Layout (ScrollView, top to bottom):**

1. Profile header: avatar (`expo-image`), display name, username (`@handle`), bio, location, website, follower/following count
2. Pinned Repositories: horizontal scroll of up to 6 `PinnedRepoCard` components
3. Contribution Graph: custom SVG heatmap built with `react-native-svg`, last 52 weeks, GitHub's own color values from the API response
4. Recent Activity: last 20 events from events API - push events, star events, fork events

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

---

### Repo Details Screen (`/repos/[repoId]`)

**Data sources:** `/repos/{owner}/{repo}`, `/languages`, `/contributors`, `/readme`, GraphQL for commit count, first item from `/commits` for last commit message

**Layout (ScrollView):**

1. Header: repo name, visibility badge, description, website URL (tappable with `expo-linking`)
2. Topics row (pill badges)
3. Stats row: stars, forks, watchers, commit count (from GraphQL)
4. Last commit: message + relative time + commit hash (JetBrains Mono, tappable to copy)
5. Language progress bar: proportional colored segments from `/languages` data
6. Contributors row: up to 8 avatars with fallback "+N more" label
7. Action buttons row:
   - **Code** → opens Reanimated file explorer panel from bottom
   - **Commits** → `router.push('/commits/[repoId]')`
8. README: rendered with `react-native-markdown-display`, styled to match app theme

**File Explorer Panel (Reanimated):**

- Slides up from bottom (bottom sheet pattern)
- Shows full recursive file tree from `/git/trees/{sha}?recursive=1`
- Folders expand/collapse on tap
- File tap opens a modal with file content (fetched lazily on tap)

---

### Stars Screen (`/stars`)

**Data source:** `useInfiniteQuery` on `/user/starred?per_page=10`

**Layout:** Identical structure to Repos screen (search + filters + FlashList of RepoCard). Reuse the same `RepoCard` component and `InfiniteList` wrapper.

---

### Profile Screen (`/profile`)

**Data source:** `/user` (same data as Overview header, use cached query)

**Layout:**

1. Large avatar
2. Display name, username, bio
3. Stats row: repos count, followers, following, stars given
4. Location, company, website, Twitter handle (if set)
5. "Settings" button → navigates to `/profile/settings` via drawer

---

### Settings Screen (`/profile/settings`)

**Layout:**

1. GitHub Token section: masked input showing last 4 chars of stored token, with "Update Token" button
2. On update: validate token by calling `/user`, if 200 save to `expo-secure-store` and update Zustand store, if 401 show error
3. "Sign Out" button: clears `expo-secure-store` and Zustand, redirects to `/token-setup`
4. App version footer

---

### Commits Screen (`/commits/[repoId]`)

**Data source:** `useInfiniteQuery` on `/repos/{owner}/{repo}/commits?per_page=10`

**Layout:**

1. Header with repo name
2. FlashList of commit items: commit message, author avatar + name, relative timestamp, SHA (JetBrains Mono, tappable to copy)
3. Infinite scroll loads next 10 commits on end reached

---

### Token Setup Screen (`/token-setup`)

**Layout:**

1. Shikai logo
2. Short explanation of why a token is needed and what permissions to grant (`read:user`, `repo`)
3. Link to GitHub token creation page (`expo-linking`)
4. Token input field (secureTextEntry)
5. "Connect" button: calls `/user` to validate, on success saves to `expo-secure-store` + Zustand, navigates to `/(app)/(tabs)`

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

---

## 10. Key Technical Decisions

| Decision           | Choice                         | Reason                                                               |
| ------------------ | ------------------------------ | -------------------------------------------------------------------- |
| Routing            | Expo Router                    | File-based routing, native tabs built-in, automatic deep linking     |
| List rendering     | FlashList (Shopify)            | Better perf than FlatList - native item recycling                    |
| Image rendering    | expo-image                     | Better caching, progressive loading, blurhash support                |
| Token storage      | expo-secure-store              | Never AsyncStorage for secrets                                       |
| REST client        | Axios                          | Familiar, interceptor support for auth header injection              |
| GraphQL client     | Raw Axios POST                 | Only 3 queries - Apollo/URQL would be overkill                       |
| Contribution graph | Custom SVG (react-native-svg)  | Not available in REST API, GraphQL returns color values directly     |
| Pinned repos       | GraphQL                        | Not available in REST API at all                                     |
| Commit count       | GraphQL (`history.totalCount`) | Cleaner than paginating REST to count                                |
| File explorer      | Reanimated panel               | Drawer Navigator is the wrong tool - no navigation state needed here |
| Fonts              | Inter + JetBrains Mono         | Inter for readability, JetBrains Mono for technical content          |
| Styling            | `StyleSheet.create()`          | No CSS framework - raw RN stylesheets as agreed                      |

---

_Abhi ke liye toh ye decisions and plan final hai guys, if i make any changes to the plan, commit messages mein dikh jayega vo_
