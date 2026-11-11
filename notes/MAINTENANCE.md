# Maintenance

Shikai rarely breaks on its own. It breaks when a platform under it moves: Google Play's target API rule, Expo SDK support windows, or the GitHub API. This runbook keeps up with those on a fixed schedule so no upgrade has to be a big one.

## Monthly (30 minutes)

1. **Sentry:** look for new issues. GitHub API failures show up as `GitHub <status> on <METHOD> <endpoint>`, one issue per endpoint and status. Only 5xx and statuses Shikai never expects get reported (see D-030), so a new one on a single endpoint usually means GitHub changed or deprecated it.
2. **Play Console:** check Android vitals (crash rate, ANR rate) and read new reviews.
3. **Dependencies:** run `npx expo install --check`. It lists packages that have drifted from the versions this Expo SDK supports. `npx expo install --fix` fails here with `EALLOWSCRIPTS`, because the Expo CLI passes `--allow-scripts` and npm rejects it next to the `allowScripts` field in `package.json`. Install the versions `--check` lists with plain `npm install pkg@~x.y.z`, then run `--check` again. Don't use `npm update` or Dependabot for Expo packages: they bump past the SDK's supported range.
   - **Pending bump:** once Expo's pin for `@sentry/react-native` (in `node_modules/expo/bundledNativeModules.json`) reaches `~8.33.0` or later, move to it. SDK 58 pins `~8.28.0`, whose expo-router lookup still requires `expo-router/build/global-state/router-store`, a file expo-router 58 removed. That makes Metro print an "invalid package.json configuration" warning on every bundle. The warning is harmless: the require sits in a `try/catch`, and Shikai uses neither `expoRouterIntegration` nor `wrapExpoRouterErrorBoundary`. 8.33.0 is the first version that doesn't hit the removed path. Sentry ships native code, so the bump needs a new build, not an OTA. Delete this note once the bump ships.
4. **Security:** run `npm audit --omit=dev` and patch anything that reaches the shipped app.
5. **GitHub issues:** triage anything new.

## Each Expo SDK release (half a day)

Expo ships about three SDKs a year. Upgrade one SDK at a time. Skip an SDK only when Expo's release notes say to, as with 56 (D-035).

1. Read the SDK's release notes and its breaking changes.
2. Remove the `react-native` pin: the `overrides` entry and the exact version in the dependency (npm rejects an override that differs from the direct dependency). The new SDK picks its own React Native version, and the pin will fight it.
3. `npm install expo@^<new version>`, then align the rest by hand as in the monthly dependency step, since `--fix` hits `EALLOWSCRIPTS`.
4. `npx expo prebuild --clean`. The config plugins in `plugins/` throw if Expo's `build.gradle` template has changed. If one throws, update that plugin's regex to match the new template.
5. `npm run lint`, `npm run typecheck`, `npx vitest run`.
6. Build a release APK (see Releasing) and test on a device: sign in, open a repo, open a full-screen diff, check the widget.
7. Check `modules/shikai-security/`. The Kotlin module can break on a new Kotlin or Android Gradle Plugin version.
8. Pin `react-native` back to the exact version the hop ended on, in the dependency and in `overrides`. A transitive bump should never move React Native without a test.

## Every June: target API level

Google Play requires updates to target a recent Android API level and usually raises the bar each August. Each June, check the current rule in Play Console's policy status page. Shikai targets API 36 on Expo SDK 58. The target comes from the Expo SDK, so staying current on SDKs keeps this covered. If you miss the deadline, the app stops showing up for users on newer devices.

## Releasing

1. Bump `version` in `package.json` and `app.config.ts`, and bump `android.versionCode` in `app.config.ts`. Play rejects a versionCode it has seen before.
2. Update `CHANGES.md`.
3. **Play Store:** build on EAS. First check that the `production` environment has the full variable set (`eas env:list --environment production`). `preview` and `production` don't share variables.

   ```bash
   eas build --platform android --profile production
   ```

   EAS signs with its own stored credentials. The signing and ABI-split plugins skip themselves there.

4. **GitHub release APKs:** build locally, then attach the three APKs from `android/app/build/outputs/apk/release/` to the release.

   ```bash
   export SHIKAI_KEYSTORE_PASSWORD=...   # Gradle reads it at build time
   npx expo prebuild --clean
   npm run android:assemble              # sets SENTRY_DISABLE_AUTO_UPLOAD
   ```

   `android:assemble` skips the Sentry source-map upload, since GitHub APKs don't need it. Local builds embed no update channel, and Expo's update server rejects requests without one. GitHub APK users never get OTA updates, so they update by installing each release's APK over the old one.

5. **Tag and publish:** create the tag on the release commit, then publish the GitHub release with the three APKs.

   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   gh release create vX.Y.Z android/app/build/outputs/apk/release/*.apk \
     --draft --title "Shikai Release vX.Y.Z" --notes-file store/GITHUB-RELEASE.md
   ```

   Don't publish a release to reserve the version: whatever the tag points at is what users download, and later work under the same version needs the tag and release redone. Keep it a draft until the APKs are attached, tested, and the notes are final. A draft keeps its assets, so publishing later just attaches it to the tag.

### OTA updates vs a new build

`runtimeVersion` uses the `appVersion` policy: an `eas update` goes to every installed build with the same `version`.

- **JS-only change:** an OTA update is fine. Run `npm run sentry:sourcemaps` afterwards so stack traces stay readable.
- **`sentry:sourcemaps` fails on Windows** with `spawnSync ... @sentry\cli\bin\sentry-cli ENOENT`: the script starts `sentry-cli`, a Node script with a shebang, through `spawnSync`, which Windows can't run. Upload the bundle `eas update` left in `dist/` through npx instead. `SENTRY_AUTH_TOKEN` lives in `.env.local`, so load both env files first:

  ```bash
  set -a; . ./.env.local; . ./.env; set +a
  f=$(ls dist/_expo/static/js/android/*.hbc)
  SENTRY_ORG=merc-with-a-mouth SENTRY_PROJECT=shikai SENTRY_URL=https://de.sentry.io/ \
    npx sentry-cli sourcemaps upload --debug-id-reference "$f" "$f.map"
  ```

  The report should list the `.hbc` and its `.map` under the same debug ID.

- **Always pass `--platform android` and `--environment production`:** `eas update --channel production --environment production --platform android --message "..."`. `--environment` has been required since SDK 55, when EAS started loading environment variables per environment. Without `--platform` the export also builds web, which fails on `react-native-pdf` and publishes nothing.
- **Anything that changes what's inside the binary** (a new or upgraded native package, an Expo SDK upgrade, a config plugin or `app.config.ts` change that adds native code, permissions, or manifest entries): bump `version` and ship a new store build. Pushing JS that needs native code an older binary lacks crashes it. Build-only settings such as signing or ABI splits don't count.
- **Bump `version` the moment a native dependency lands, not at release time.** An OTA reaches every EAS build with that version on the channel, on any Play track. The Sep 6 EAS build of 1.4.0 (versionCode 5) predates `react-native-pdf` but still says 1.4.0, so an OTA of later JS would crash it. That's why v1.5.0 shipped as a store build.

## Other deployments

- **OAuth proxy** (`oauth-proxy/`): a separate Cloudflare Worker. `GITHUB_CLIENT_SECRET` is a Wrangler secret. When you rotate the GitHub App's client secret, run `npx wrangler secret put GITHUB_CLIENT_SECRET -c oauth-proxy/wrangler.toml` from the repo root. Deploy with `npx wrangler deploy -c oauth-proxy/wrangler.toml`. Without `-c`, Wrangler reads the root `wrangler.jsonc`, even from inside `oauth-proxy/`, and targets the web worker.
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
- **`expo run:android` fails with `JAVA_HOME is set to an invalid directory`:** Microsoft's OpenJDK auto-updates its patch build and deletes the previous folder (17.0.20.101 became 17.0.21.21), leaving `JAVA_HOME` pointing at nothing. Check what's installed with `ls "/c/Program Files/Microsoft"`, then fix both places it is set, since each hides the other: `export JAVA_HOME` in `~/.bashrc` (what Git Bash uses) and the user environment variable (`setx JAVA_HOME "C:\Program Files\Microsoft\jdk-<version>"`). The system-level variable is separate and was already correct, which is why `java -version` still worked while Gradle failed. Open a new terminal afterwards: a running shell, Metro and the agent all keep the value they started with. `cd android && ./gradlew.bat -version` prints the JVM Gradle actually picked.
- **A native module fails to compile right after a `gradlew clean`** (`Unresolved reference 'SvgView'` in `react-native-gesture-handler`, or `Failed to create MD5 hash for file` in another module): the Gradle build cache is holding an incomplete task output and replays it, so cleaning the build folders does not help. Delete `~/.gradle/caches/build-cache-1` and rebuild. To confirm the cause, count a module's compiled classes: `react-native-svg`'s `compileDebugJavaWithJavac` output should hold 175 classes including `SvgView.class`, and a subset means the broken entry survived.
