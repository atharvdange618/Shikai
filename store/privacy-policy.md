# Privacy Policy - Shikai

**Last updated:** September 1, 2026

## Overview

Shikai is a read-only GitHub companion app. This privacy policy explains how we handle your data.

## Data Collection

Shikai collects minimal data necessary to provide its services:

### Authentication Data

- **OAuth Token:** Stored locally on your device using secure encrypted storage (expo-secure-store). This token is used to authenticate with GitHub's API.
- **Personal Access Token (Optional):** If you choose to enable notifications, you may provide a GitHub Personal Access Token. This is stored locally on your device only.

### Cached Data

- **Repository Data:** Repos, contributions, and activity are cached locally using MMKV for offline access.
- **User Profiles:** Basic profile information (avatar, bio, stats) may be cached.

### Crash and Performance Data

- **What:** When the app crashes or hits an error, Shikai sends a diagnostic report to Sentry. The report contains the error and stack trace, the device model, the OS version, the app version, and a short trail of the in-app actions that led up to it. It also samples a fraction of sessions for screen-load and network timing.
- **What it does not contain:** No name, email, GitHub username, or account id. Your GitHub OAuth token and Personal Access Token are stripped from every report before it leaves the device. No repository contents. No session recording.
- **Why:** Play Console's built-in crash reporting is aggregated, partial, and cannot tell which over-the-air update a device is running. Sentry provides the per-crash detail, the trail of actions, and the update version needed to actually fix issues.
- **Where:** Sentry (Functional Software, Inc.), on servers in the European Union.
- **Turning it off:** There is no in-app toggle. Reporting is disabled entirely in development builds and is only active in released builds.

## Data Usage

- **API Communication:** Your OAuth token is sent directly from your device to GitHub's API. It passes through a secure Cloudflare Worker proxy only during the initial authentication exchange.
- **No Server Storage:** Shikai does not store your tokens or personal data on any external servers.
- **Crash Reporting:** Anonymous crash and performance data is sent to Sentry as described above. It is not used for advertising or profiling.

## Data Sharing

- **GitHub API:** Your data is shared with GitHub only as part of normal API requests you initiate.
- **Sentry:** Anonymous crash and performance diagnostics only, as described under Crash and Performance Data.
- **No One Else:** We do not share your data with any other third parties, and we do not sell it.

## Data Security

- **Encryption:** Tokens are encrypted on-device using expo-secure-store's encryption.
- **Secure Transmission:** All API requests use HTTPS.
- **Root Detection:** The app detects rooted devices and blocks usage on compromised environments to protect your data.

## Data Deletion

- **Sign Out:** Signing out clears all locally cached data and tokens.
- **Uninstall:** Uninstalling the app removes all local data.
- **PAT Removal:** You can remove your Personal Access Token from Settings at any time.

## Children's Privacy

Shikai is not directed at children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy. Changes will be reflected in the app's About page.

## Contact

For questions about this privacy policy, contact:

- Twitter: [@atharvdangedev](https://x.com/atharvdangedev)
- GitHub: [atharvdange618](https://github.com/atharvdange618)
