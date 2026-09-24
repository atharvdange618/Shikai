# Maintenance

Shikai rarely breaks on its own. It breaks when a platform under it moves: Google Play's target API rule, Expo SDK support windows, or the GitHub API. This runbook keeps up with those on a fixed schedule so no upgrade has to be a big one.

## Monthly (30 minutes)

1. **Sentry:** look for new issues and for any endpoint with a jump in 4xx errors. A new 4xx on one GitHub endpoint usually means a deprecation.
2. **Play Console:** check Android vitals (crash rate, ANR rate) and read new reviews.
3. **Dependencies:** run `npx expo install --check`. It lists packages that have drifted from the versions this Expo SDK supports. Fix them with `npx expo install --fix`. Don't use `npm update` or Dependabot for Expo packages: they bump past the SDK's supported range.
4. **Security:** run `npm audit --omit=dev` and patch anything that reaches the shipped app.
5. **GitHub issues:** triage anything new.

## Each Expo SDK release (half a day)

Expo ships about three SDKs a year. Upgrade one SDK at a time, never two at once.

1. Read the SDK's release notes and its breaking changes.
2. Remove the `react-native` pin under `overrides` in `package.json`. The new SDK picks its own React Native version, and the pin will fight it.
3. `npx expo install expo@^<new version> --fix`
4. `npx expo prebuild --clean`. The config plugins in `plugins/` throw if Expo's `build.gradle` template has changed. If one throws, update that plugin's regex to match the new template.
5. `npx expo lint`, `npx tsc --noEmit`, `npx vitest run`.
6. Build a release APK (see Releasing) and test on a device: sign in, open a repo, open a PR diff, check the widget.
7. Check `modules/shikai-security/`. The Kotlin module can break on a new Kotlin or Android Gradle Plugin version.
8. Pin `react-native` again if a patch release causes trouble. Otherwise leave it unpinned.

## Every June: target API level

Google Play requires updates to target a recent Android API level and usually raises the bar each August. Each June, check the current rule in Play Console's policy status page. Shikai targets API 36 on Expo SDK 54. The target comes from the Expo SDK, so staying current on SDKs keeps this covered. If you miss the deadline, the app stops showing up for users on newer devices.

## Releasing

1. Bump `version` in `package.json` and `app.config.ts`, and bump `android.versionCode` in `app.config.ts`. Play rejects a versionCode it has seen before.
2. Update `CHANGES.md`.
3. Build and sign locally:

   ```bash
   export SHIKAI_KEYSTORE_PASSWORD=...   # Gradle reads it at build time
   export SENTRY_AUTH_TOKEN=...          # plain gradlew doesn't read .env
   npx expo prebuild --clean
   cd android && ./gradlew.bat bundleRelease
   ```

   For EAS builds, check first that both `preview` and `production` have the full variable set (`eas env:list --environment <name>`). The two environments don't share variables.

### OTA updates vs a new build

`runtimeVersion` uses the `appVersion` policy: an `eas update` goes to every installed build with the same `version`.

- **JS-only change:** an OTA update is fine. Run `npm run sentry:sourcemaps` afterwards so stack traces stay readable.
- **Anything native** (new native package, Expo SDK upgrade, config plugin change, `app.config.ts` change): bump `version` and ship a new store build. Pushing native-dependent JS over OTA to an older binary crashes it on launch.

## Other deployments

- **OAuth proxy** (`oauth-proxy/`): a separate Cloudflare Worker. `GITHUB_CLIENT_SECRET` is a Wrangler secret. When you rotate the GitHub App's client secret, run `wrangler secret put GITHUB_CLIENT_SECRET` in `oauth-proxy/`. Deploy with `wrangler deploy` from that folder.
- **Web build:** `npm run deploy`.

## Things only you hold

Keep an offline backup of each. None of them are in the repo.

- `keystore/release.keystore` and its password. Play App Signing can reset a lost upload key, but that takes days.
- `.env`
- EAS environment variables for `preview` and `production`
- The GitHub App's client secret and private key
- Sentry auth token

## When something breaks

- **CI red:** the GitHub Actions run shows which of lint, typecheck, or tests failed.
- **Crash spike after a release:** Sentry groups it by release. If an OTA update caused it, republish the previous update with `eas update:republish`.
- **Sign-in fails for everyone:** check the OAuth proxy Worker's logs in the Cloudflare dashboard, then the GitHub App's settings.
