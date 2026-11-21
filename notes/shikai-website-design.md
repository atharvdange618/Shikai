# Shikai website design system

Shikai’s website gives Android developers a short, screenshot-led tour of the app and a direct route to Google Play. Privacy and Delete Data share the site's brand and navigation.

## Page structure

| Page            | What visitors should find                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`             | Overview and contributions in the hero, followed by the PR, Diff, and Actions showcase. Then show what visitors can do in Repos and Search, and how the widget looks on an Android home screen. End with install options and policy links. |
| `/privacy/`     | The existing Privacy Policy with its update date, section headings, lists, and contact links. Use a reading layout with anchor links to each section.                                                                                      |
| `/delete-data/` | The existing deletion instructions in the order they are published today. Sign Out and Uninstall should be easy to find, with retention, crash reports, help, and the privacy cross-link below.                                            |

Use [the published Privacy Policy](../docs/index.html), [the published deletion instructions](../docs/delete-data.html), and [the Terms of Service](../store/terms-of-service.md) as the content sources. Preserve wording and dates. The footer links to the site's own `/privacy/`, `/delete-data/`, and `/terms/` pages. Terms uses the same reading layout and section links as the other policy pages.

## Visual foundations

| Role                | Starting value                      | Use                                                                          |
| ------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| Canvas              | `#f1f4ff`                           | Base surface across the site                                                 |
| Text                | `#1a1b2a`                           | Headlines and primary copy                                                   |
| Secondary text      | `#505366`                           | Descriptions and captions                                                    |
| Divider             | `#ced5ea`                           | Section rules and quiet borders                                              |
| Action              | `#35319a`                           | Primary button, focus ring on light surfaces, and text links                 |
| Image stage         | `#bdbbff`                           | Light product scenes                                                         |
| Code stage          | `#0d1117`                           | Diff and Actions scenes, drawn from the app's dark theme                     |
| Contribution greens | Sample the app's dark graph palette | Decorative contribution blocks. Use the screenshot itself to show real data. |

- Use self-hosted Manrope throughout. Start with 36 px mobile and 60 px desktop for the hero, 28–40 px for section headings, 16–18 px for body copy, and 14 px for captions. Reserve JetBrains Mono for actual paths and Git refs if they appear outside a screenshot.
- Use an 8 px spacing base, a content width around 1152 px, and a policy reading column around 68 characters. Start with radii of 8 px on buttons, 16 px on image frames, and 24 px on the hero stage.
- Use the Shikai app icon as the brand mark. Use one outlined icon set for interface actions and official marks on store and repo links. Choose the icon set before adding a package.
- Use a shared header, footer, buttons, focus states, and type across all routes. Policies use a quiet reading layout with a visible last-updated date.
- Keep interactive targets at least 44 px tall, with text labels for the showcase tabs and visible focus. Check contrast on every surface. Keep the selected screenshot and caption visible at narrow widths.

## Product imagery and depth

Give the first viewport one main screenshot. Try a shallow tilt with a small isometric cluster based on the contribution graph. The screenshot must remain readable, and the cluster stays decorative so people can distinguish it from their own data. Below the hero, use flat screenshots and close crops to explain the app. Keep any change between PR, Diff, and Actions brief and respect reduced motion.

Start with CSS transforms and real screenshots. If an independently rotating or lit object turns out to improve the tour, compare a still render with a small opt-in Three.js scene. Three.js can render this with an orthographic camera. Its WebGL renderer requires WebGL 2, so a live canvas would need a working static fallback. The primary copy, screenshots, and install links must stay usable without the effect. [CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Transforms) · [Three.js orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html) · [Three.js renderer](https://threejs.org/docs/pages/WebGLRenderer)

Use full screenshots when the surrounding navigation matters and tight crops when a state or code line is the point. Give each image dimensions and useful alt text. Keep capture originals separate from optimized exports. Use screenshots that show public repositories and avoid account details, notifications, or private activity unless Atharv has cleared them for publication.
