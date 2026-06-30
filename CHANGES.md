# Changelog

## v1.2.0

### Features

- **Custom Theme Engine** - User-selectable themes with 5 palettes: Light, Dark, Tokyo Night, Dracula, and Atom One Dark. Theme picker in profile settings, persistent selection via MMKV. Theme-specific contribution graph colors. Migrated all components from useColorScheme to context-based useTheme hook.
- **Global Search** - New search tab with GitHub Search API integration. Tab switching between repos/users/issues. MiniSearch fuzzy index, debounced input, eager-load pagination. Result cards with user avatars, navigate in-app to repo or user profile.
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
- **In-app version check banner** - Dashboard shows a dismissible update banner when a new GitHub release is available. Dismiss state persisted via SecureStore.
- **In-app README preview** - MarkdownRenderer component renders README files inline on repo detail screen using GitHub's `/markdown` API with themed CSS. Fixed UTF-8 decoding for Japanese/emoji support.
- **Markdown file viewer** - MarkdownRenderer now renders `.md` files in the file viewer with syntax-highlighted code blocks and copy buttons.
- **Issue and PR detail screens** - In-app detail screens for issues and pull requests with markdown body and comments rendering. Navigates from list screens instead of opening external browser.
- **About page version check** - Interactive update status below version badge on about page. Shows loading spinner, available version pill, or up-to-date checkmark.
- **Markdown image support** - MarkdownRenderer resolves relative image paths to absolute GitHub raw URLs. README images now render correctly in-app.
- **Developer mode override** - Developers with Android dev options enabled can bypass the security block by accepting a risk warning. Root and debugger detection remain hard-blocked. Override persisted via SharedPreferences.
- **Post-build automation** - `npm run prebuild:clean` script auto-restores Android build customizations (ABI splits, R8 minification, resource shrinking) that are wiped by `expo prebuild --clean`.

### Bug Fixes

- **Navigation Overhaul** - Fixed broken file navigation path, eliminated double auth guard race condition, fixed `router.navigate` vs `push` inconsistency for cross-tab navigation.
- **FlashList rendering** - Fixed blank screen when switching between Stars/Watchlist tabs and when clearing search by adding key prop for remount.
- **Splash Screen** - Delayed native splash hide until app is fully ready to prevent flash of white.
- **File Explorer** - Use absolute route path for file viewer navigation instead of relative paths.
- **Repo Detail Back Button** - Always show fallback back button when `canGoBack` is false.
- **Pull-to-Refresh** - Watchlist tab now invalidates repos query on pull-to-refresh.
- **Activity Feed** - Skip initial `onEndReached` to prevent unwanted prefetch on mount.
- **Stars Prefetch** - Limit prefetch to first 3 repos for faster tab load.
- **Tooltip** - Remove undefined `onLayout` prop that caused warnings.
- **Share button** - Repo share button now copies the GitHub URL on Android. Previously used the `url` field which Android ignores.
- **List performance** - Pre-built styles, hoisted `isDark`, `overrideItemLayout`/`getItemType` for FlashList virtualization, `drawDistance: 400`, nested ScrollView removal for topics.
- **Shadows useMemo** - Wrapped shadows conditional in useMemo to resolve lint warnings.

### Refactoring

- **Repo/User Detail Screens** - Moved out of tabs into dedicated `(app)/repo/` and `(app)/user/` route groups for cleaner navigation stack.
- **Layout Icon Renderers** - Hoisted icon render functions outside component to prevent re-creation on every render.
- **Import Ordering** - Fixed import ordering and formatting across all components for consistency.
- **GitHub-native syntax highlighting** - Replaced highlight.js with GitHub's `pl-*` CSS classes for syntax-colored code blocks. Zero JS dependency.
- **TypeScript strictness** - Enabled `noUnusedLocals` and `noUnusedParameters` in tsconfig.

### UI/UX

- **Repo detail cleanup** - Removed card aesthetic, stripped header from README section for seamless reading, moved action bar above README for better navigation.
- **README and ROADMAP professionalized** - Updated docs with structured formatting, star CTA on about page.

### Security

- **Developer options detection** - Narrowed OAuth scopes to read-only access, corrected Android setting key for developer options detection.

### Build

- **ABI splits** - Release builds produce 3 APKs: arm64-v8a (~42MB), x86_64 (~43MB), universal (~84MB).
- **R8 minification and resource shrinking** - Enabled for release builds.
- **Animated WebP disabled** - Saves ~3.4MB per APK.
