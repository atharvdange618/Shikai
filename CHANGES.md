# Changelog

## v1.2.0 (Upcoming)

### Features

- **In-app version check banner** - Dashboard shows a dismissible update banner when a new GitHub release is available. Dismiss state persisted via SecureStore.
- **In-app README preview** - MarkdownRenderer component renders README files inline on repo detail screen using GitHub's `/markdown` API with themed CSS. Fixed UTF-8 decoding for Japanese/emoji support.
- **Markdown file viewer** - MarkdownRenderer now renders `.md` files in the file viewer with syntax-highlighted code blocks and copy buttons.
- **Issue and PR detail screens** - In-app detail screens for issues and pull requests with markdown body and comments rendering. Navigates from list screens instead of opening external browser.
- **About page version check** - Interactive update status below version badge on about page. Shows loading spinner, available version pill, or up-to-date checkmark.
- **Markdown image support** - MarkdownRenderer resolves relative image paths to absolute GitHub raw URLs. README images now render correctly in-app.
- **Developer mode override** - Developers with Android dev options enabled can bypass the security block by accepting a risk warning. Root and debugger detection remain hard-blocked. Override persisted via SharedPreferences.
- **Post-build automation** - `npm run prebuild:clean` script auto-restores Android build customizations (ABI splits, R8 minification, resource shrinking) that are wiped by `expo prebuild --clean`.

### Bug Fixes

- **Share button** - Repo share button now copies the GitHub URL on Android. Previously used the `url` field which Android ignores.
- **List performance** - Pre-built styles, hoisted `isDark`, `overrideItemLayout`/`getItemType` for FlashList virtualization, `drawDistance: 400`, nested ScrollView removal for topics.
- **Shadows useMemo** - Wrapped shadows conditional in useMemo to resolve lint warnings.

### Refactoring

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
