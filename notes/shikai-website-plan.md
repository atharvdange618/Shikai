# Shikai website implementation plan

**Goal.** Build a screenshot-led React product tour with matching Privacy and Delete Data pages at `shikaihq.atharvdange.com`.

**Design.** Follow the [Shikai website design system](shikai-website-design.md). Extend the current static design under `site/`.

**Architecture.** Give `site/` its own Vite package and build output. Use React and TypeScript for the homepage and showcase. Use Vite's multi-page build for independently served policy HTML with the same styling and navigation. The policy pages should render in the initial response and work with JavaScript disabled. [Vite multi-page builds](https://vite.dev/guide/build.html#multi-page-app)

## 1. Capture and choose the screenshots · 30–45 minutes

- [x] Capture Overview, a public repo, a PR overview, a diff, an Actions run, Search, and the home screen widget. Argent drove the Pixel 10 Pro emulator. Android's native screenshot command supplied fresh frames when Argent's saved images became stale.
- [x] Use the public Shikai repo, PR #60, its Oxlint diff, and CI #155 for the repo and workflow screens. The PR shows checks and an empty review count. Search uses public React Native results.
- [x] Review the captures and export seven WebP files under `site/assets/tour/`. Crop Overview to the contribution chart and streaks. Crop the widget to its launcher panel. The repo and workflow captures keep their headers and relevant content, and Search keeps its query and results.
- [x] **Verify** the hero graph and the diff or check detail are legible at the size they will appear on a 390 px viewport.

## 2. Build the homepage and tour · 2–3 hours

- [x] Add `site/package.json`, a lockfile, and Vite and TypeScript configuration scoped to the site. Create a React entry point in `site/src/` and use the existing `site/styles.css` as the starting point for shared tokens. Keep Expo build commands separate.
- [x] Build the hero with CSS isometric contribution tiles on desktop and a flat crop on mobile.
- [x] Build one showcase with PR, Diff, and Actions views. Each view has a real screenshot, alt text, and a short caption. Add the Repos, Search, and widget sections below it, followed by Google Play and GitHub release links.
- [x] **Verify** tab selection by pointer and keyboard, focus visibility, a readable screenshot swap at reduced motion, and a layout without horizontal scroll at 320, 390, 768, and 1440 px. Check that the hero and install link work without the decorative effect.

## 3. Recreate both policy pages · 45–75 minutes

- [x] Add `site/privacy/index.html` and `site/delete-data/index.html` as HTML build entries. Apply the shared fonts, navigation, link and focus styles, and a text layout with readable line lengths. Put the deletion options near the top using the existing text and order.
- [x] Use the published body text, headings, lists, links, and dates directly from the GitHub Pages source files at build time. Point the deletion page to the new Privacy Policy route and keep the existing external support links.
- [x] **Verify** normalized policy body text and update dates against `docs/index.html` and `docs/delete-data.html`. Check links and section anchors. Load both routes directly with JavaScript off.

## 4. Verify the production build and publish · 45–60 minutes plus hosting access

- [x] Verify the Vite production output locally. Run site type checks and the build. Run root lint, typecheck, and tests in Git Bash. Check asset loading, keyboard navigation, route metadata, and Google Play, GitHub, and policy links.
- [x] Verify that the two existing GitHub Pages policy URLs still respond over HTTPS.
- [ ] Check Play Console policy destinations before launch and test all three new URLs over HTTPS after deployment.
- [ ] Publish the site build output through the verified hosting account for `shikaihq.atharvdange.com`. Hosting access is a separate dependency. The earlier SSH attempt to the VPS was rejected.
