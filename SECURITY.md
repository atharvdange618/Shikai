# Security Policy

## Supported versions

Only the latest release gets security fixes, whether you installed it from the Play Store or GitHub releases.

## Reporting a vulnerability

Don't open a public issue. Send a direct message to [@atharvdangedev](https://x.com/atharvdangedev) on X with:

- What the problem is and what an attacker could do with it
- Steps to reproduce, or a proof of concept
- The Shikai version and Android version you tested on

You'll get a reply within 3 days. Once a fix ships, you'll be credited in the changelog unless you'd rather not be.

## In scope

- Token handling: OAuth tokens and PATs in `expo-secure-store`, and anything that could leak them through logs, crash reports, the cache, or the network
- The OAuth proxy in `oauth-proxy/`
- Ways around the root and debugger checks in release builds
- Deep links or shared URLs that make the app do something it shouldn't

## Out of scope

- Problems that need a rooted device, a debug build, or physical access to an unlocked phone
- Bugs in GitHub's own API or in third-party libraries, unless Shikai uses them unsafely
