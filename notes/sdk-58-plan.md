# Expo SDK 54 → 58 upgrade plan (Shikai 1.8.0)

Written 2026-11-02 for an executor agent. Delete this file in the wrap-up commit.

Route: **54 → 55 → 57 → 58**. SDK 56 is skipped on purpose (see "Why skip 56"). One commit per hop on branch `chore/sdk-58`. The release is 1.8.0, versionCode 11, with no features.

Total estimate: 2.5 to 3.5 days of work, most of it builds and phone checks.

---

## Read this first: rules for the executor

You are running this plan step by step. Follow it literally. When something happens that the plan does not cover, **stop** and write a STOP report (template at the end). Do not invent a fix.

### Hard rules (never break these)

1. Shell is **Git Bash**. Never PowerShell. ADB lives at `"$ANDROID_HOME/platform-tools/adb.exe"`; every command below sets `A` to it first.
2. Never edit anything under `android/` by hand. Prebuild regenerates it. Native changes go in `plugins/` or `app.config.ts`.
3. Never edit `node_modules/`, never add `patch-package`, never pass `--force` or `--legacy-peer-deps` to npm.
4. Never run `npx expo install --fix`. It fails here with `EALLOWSCRIPTS`. Use `--check` plus plain `npm install` (step H3).
5. Never add a new package unless this plan names it. Never downgrade `expo` or `react-native` to get past an error.
6. Never touch Hermes settings (`useHermesV1`, `buildReactNativeFromSource`, `hermes-compiler`) and never turn on Worklets "bundle mode". Expo calls both unsupported.
7. Never use `expo@57.0.16` or lower. The floor is `57.0.17`.
8. Never run `git push`, `eas submit`, `eas update` or `wrangler deploy`. Atharv runs those.
9. Never commit unless lint, typecheck and tests all pass (step H5). Never `git commit --amend`. Never skip hooks.
10. Commit messages: exactly the ones given in this plan. **No `Co-Authored-By` trailer, no AI attribution, no "Generated with" line.** Atharv is the sole contributor.
11. Do not trust your own memory of Expo SDK 55 to 58 APIs. Use this plan and the changelog links in it. If you need a fact that isn't here, stop and ask.
12. Never ask Atharv to paste a secret (keystore password, tokens) into the chat.

### Fixes you ARE allowed to make without stopping

- The edits this plan lists for each hop.
- Install the versions `npx expo install --check` asks for (step H3).
- Add an `allowScripts` entry in `package.json` when npm refuses to run install scripts for a package **whose name is already listed** in `allowScripts` at a different version (for example `@sentry/cli@2.58.0` when `@sentry/cli@2.55.0` is there). Copy the exact `name@version` from the npm error and set it to `true`. A package name that isn't listed yet: stop.
- A TypeScript error in app code where the fix is a rename the changelog in this plan names (for example a removed prop). Anything else: stop.

### Stop rules that apply everywhere

Stop and write a STOP report when:

- Any command exits non-zero and this plan does not say what to do about it.
- `npx expo prebuild` throws from a file in `plugins/` (a regex no longer matches Expo's template).
- The Gradle build fails, whatever the reason (Kotlin, AGP, a third-party module, `modules/shikai-security`). Exception: step H6 lets you upgrade a named third-party package once.
- Lint, typecheck or tests fail and the fix isn't one of the allowed fixes above.
- A phone check (QA list) fails.
- Memory after the QA run is more than 25% above the baseline from step 0.2.

---

## Facts about this repo the executor needs

- Package id: `com.atharvdange618.Shikai`. Main activity: `.MainActivity`.
- `runtimeVersion` policy is `appVersion`, so 1.8.0 OTA updates never reach 1.7.0 phones.
- `package.json` has `"overrides": { "react-native": "0.81.5" }`. Hop 1 removes it; wrap-up puts it back at the new version.
- `app.config.ts` already sets `web.output: "static"` (needed for SDK 58) and uses the `expo-notifications` config plugin (needed for SDK 55).
- `plugins/withGradleProperties.js` already turns on R8 and resource shrinking. SDK 58 turns on R8 by default too, so no change is needed there.
- The ios folder is gitignored. Always pass `--platform android` to prebuild.
- Release builds need `SHIKAI_KEYSTORE_PASSWORD` set in the shell. Check with `[ -n "$SHIKAI_KEYSTORE_PASSWORD" ] && echo set || echo MISSING`. If missing, stop and ask Atharv to set it in his Git Bash profile. Never ask for the value.
- On the Narzo, release builds show a security block screen because USB debugging is on. Tap the developer override on that screen to continue. That is expected, not a failure.
- Gate commands: `npx expo lint`, `npx tsc --noEmit`, `npx vitest run`. On SDK 54 there are 276 tests; the count must not drop.

Third-party native packages that Expo's `--check` does **not** manage:

| Package | Now | Rule |
|---|---|---|
| `expo-share-intent` | 5.1.x | Major version is tied to the SDK: **6 for SDK 55, 8 for SDK 57, 9 for SDK 58**. Install it in every hop. |
| `react-native-mmkv` + `react-native-nitro-modules` | 4.3.2 / 0.35.x | Leave alone unless the build fails in them (H6). Upgrade both together. |
| `react-native-android-widget` | 0.20.x | Leave alone unless the build fails in it (H6). |
| `react-native-pdf`, `react-native-blob-util` | 7.0.5 / 0.24.x | Leave alone unless the build fails in them (H6). Upgrade both together. |
| `expo-in-app-updates` | 0.12.x | Leave alone unless the build fails in it (H6). |

---

## Why skip 56

Hermes V1 is the default engine from SDK 56. Hermes V1 on SDK 56, and on SDK 57 before `expo@57.0.9`, has a memory regression in apps that import `react-native-worklets` or `react-native-reanimated` (expo/expo#46519). Shikai imports both, and Issue #37 is a `libworklets.so` crash. Expo's advice is to go straight to SDK 57 with `expo@57.0.17` or later (57.0.17 also fixes slow dev startup). We still apply SDK 56's breaking changes, inside hop 2.

Changelogs (read the one for your hop before starting it):

- SDK 55: https://expo.dev/changelog/sdk-55
- SDK 56: https://expo.dev/changelog/sdk-56 (applied in hop 2)
- SDK 57: https://expo.dev/changelog/sdk-57
- SDK 58: https://expo.dev/changelog/sdk-58
- Router 57 → 58: https://docs.expo.dev/router/migrate/sdk-57-to-58/

---

## Step 0: setup and baseline (about 45 min)

Done already (uncommitted): branch `chore/sdk-58` exists, `app.config.ts` says `version: "1.8.0"` and `versionCode: 11`, `package.json` and `package-lock.json` say 1.8.0.

### 0.1 Commit the version bump (5 min)

```bash
cd /c/Shikai
git branch --show-current          # must print chore/sdk-58
git status --short                 # only app.config.ts, package.json, package-lock.json, notes/sdk-58-plan.md
npx expo lint && npx tsc --noEmit && npx vitest run
git add app.config.ts package.json package-lock.json
git commit -m "chore(release): bump to 1.8.0 (versionCode 11) for the SDK 58 upgrade" -m "The Expo SDK upgrade changes native code, so it ships as a new store build. runtimeVersion follows appVersion, so no 1.8.0 OTA can reach a 1.7.0 binary."
git add notes/sdk-58-plan.md
git commit -m "docs: add the SDK 58 upgrade plan" -m "Step-by-step plan for the 54 to 58 upgrade on this branch. Deleted again in the wrap-up commit."
```

Pass: `git log -1 --oneline` shows the commit; `git status` is clean.

### 0.2 Baseline on the Play Store 1.7.0 build (25 min, needs Atharv and the Narzo)

Atharv has the Play Store 1.7.0 installed and signed in. Connect the Narzo by USB.

```bash
A="$ANDROID_HOME/platform-tools/adb.exe"
"$A" devices                                     # must list one device
"$A" shell dumpsys package com.atharvdange618.Shikai | grep -E "versionName|versionCode"
# must show versionName=1.7.0 and versionCode=10
```

Cold start time (run three times, keep the middle value):

```bash
"$A" shell am force-stop com.atharvdange618.Shikai
"$A" shell am start -W -n com.atharvdange618.Shikai/.MainActivity | grep TotalTime
```

Then Atharv taps the override if the block screen shows, and uses the app for 5 minutes: open facebook/react PR #37778, its Files tab, open three diffs, go back, scroll the Overview and Repos tabs. Then:

```bash
"$A" shell dumpsys meminfo com.atharvdange618.Shikai | grep -E "TOTAL PSS|TOTAL RSS|TOTAL:"
```

Write the numbers in a new file `notes/sdk-58-baseline.txt` (not committed; delete at wrap-up):

```
1.7.0 Play baseline, <date>
cold start TotalTime (ms): <middle of three>
TOTAL PSS (KB): <n>
TOTAL RSS (KB): <n>
```

### 0.3 Check which key signs the Play build (10 min)

The Play build may be signed by Google's app signing key, not the local upload key. If so, a local APK can't install over it, and each hop's phone test needs an uninstall (which signs Atharv out).

```bash
A="$ANDROID_HOME/platform-tools/adb.exe"
P=$("$A" shell pm path com.atharvdange618.Shikai | head -1 | sed 's/^package://' | tr -d '\r')
"$A" pull "$P" "$TEMP/shikai-play-base.apk"
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$BT/apksigner.bat" verify --print-certs "$TEMP/shikai-play-base.apk" | grep -i "SHA-256"
```

Local release key SHA-256: `86:76:16:2F:2E:C0:B7:3C:54:A5:14:CE:ED:7A:A1:5C:2B:15:E1:11:E5:C8:D8:64:C4:60:3B:3C:DC:77:64:4B` (apksigner prints it without colons, lower case).

- **Same key:** install hop builds with `install -r` (keeps sign-in). Write `INSTALL_MODE=replace` in the baseline file.
- **Different key:** each hop build needs `uninstall` first, and Atharv signs in again. Write `INSTALL_MODE=uninstall` in the baseline file. The real 1.7.0 → 1.8.0 upgrade gets tested through the Play internal track at wrap-up.

Pass: the baseline file has all four values plus `INSTALL_MODE`.

---

## The per-hop procedure (H1 to H8)

Every hop runs these steps in order. Each hop section below says what to do at H2 and H4 and gives the target version.

### H1. Read the changelog (15 min)

Open the changelog link(s) for the hop. Compare every breaking change against the hop's "Shikai-specific edits" list. If the changelog names something that touches Shikai and this plan doesn't cover it, stop.

### H2. Install the new SDK (15 min)

```bash
cd /c/Shikai
npm install expo@<TARGET> expo-share-intent@<SHARE_INTENT_MAJOR>
npm ls expo                      # must show the target version
```

### H3. Align Expo-managed packages (20 min)

```bash
npx expo install --check
```

It prints packages whose versions don't match the SDK, each with the expected version. Install **all** of them in one `npm install` call, using the exact expected range it prints, for example:

```bash
npm install react-native@0.83.x react@19.2.x react-native-reanimated@~4.2.x ...
```

Run `npx expo install --check` again. Pass: it reports that dependencies are up to date. If it keeps asking for the same package after you installed it, stop.

Then:

```bash
npx expo-doctor@latest
```

Pass: no errors. Warnings about packages from the third-party table above are fine. A "missing peer dependency" error: install the peer it names (that counts as named by this plan), run doctor again. Any other error: stop.

### H4. Make the Shikai-specific edits

Listed per hop below.

### H5. Gate (10 min)

```bash
npx expo lint && npx tsc --noEmit && npx vitest run
```

Pass: all three pass, and the test count is at least 276. Fix only with the allowed fixes; otherwise stop.

### H6. Prebuild and release build (30 to 60 min)

```bash
[ -n "$SHIKAI_KEYSTORE_PASSWORD" ] && echo set || echo MISSING
npx expo prebuild --clean --platform android
npm run android:assemble
ls android/app/build/outputs/apk/release/
```

Pass: prebuild finishes with no throw from `plugins/`, Gradle prints `BUILD SUCCESSFUL`, and an `arm64-v8a` release APK exists.

If the Gradle build fails **inside one of the third-party packages in the table** (the error path names `node_modules/<that package>`), you may upgrade that package (and its pair) to `@latest` **once**, then repeat H3 to H6. A second failure, or a failure anywhere else (including `modules/shikai-security`): stop.

### H7. Phone QA (45 min, needs Atharv)

```bash
A="$ANDROID_HOME/platform-tools/adb.exe"
APK=$(ls android/app/build/outputs/apk/release/*arm64-v8a*release*.apk | head -1)
# INSTALL_MODE=replace:
"$A" install -r "$APK"
# INSTALL_MODE=uninstall:
"$A" uninstall com.atharvdange618.Shikai && "$A" install "$APK"
"$A" logcat -c
```

Run the QA list at the end of this file. Atharv does the taps; you run the adb lines and record results. Pass: every item passes, and memory is within 25% of the baseline.

### H8. Commit (5 min)

```bash
git add -A
git status --short     # check: no android/, no .env, no keystore, no notes/sdk-58-baseline.txt
git commit -m "<hop commit subject>" -m "<hop commit body>"
```

If `git status` lists `notes/sdk-58-baseline.txt`, unstage it with `git restore --staged notes/sdk-58-baseline.txt` before committing.

---

## Hop 1: SDK 54 → 55 (half a day to 1 day)

- Changelog: https://expo.dev/changelog/sdk-55
- TARGET: `expo@~55.0.32` (or the latest 55.0.x)
- SHARE_INTENT_MAJOR: `6`
- Brings React Native 0.83 and React 19.2.

### Shikai-specific edits (H4)

1. `package.json`: delete the whole `"overrides"` block (it pins `react-native` to 0.81.5 and will fight the new version). Do this **before H2**, then run `npm install` once.
2. `app.config.ts`: delete the line `newArchEnabled: true,` (SDK 55 removed the field; New Architecture is the only option now).
3. `app.config.ts`: delete the line `edgeToEdgeEnabled: true,` inside `android` (removed in SDK 55; edge-to-edge is always on).
4. Check: `grep -rn "reactCanary\|androidStatusBar\|androidNavigationBar" app.config.ts` must print nothing. If it prints something, stop.
5. Check: `grep -rn "allowsFullscreen\|addClipboardListener\|removeSubscription" app components hooks lib widgets` must print nothing. If it prints something, stop.

### Extra checks for this hop

- After H6, confirm `modules/shikai-security` compiled: the Gradle log contains `:shikai-security:` tasks and no errors.

### Commit (H8)

```
chore(deps): upgrade Expo SDK 54 to 55

React Native 0.81 to 0.83 and React 19.1 to 19.2. Drops newArchEnabled and
edgeToEdgeEnabled from app.config.ts, since SDK 55 removed both fields. Removes
the react-native override so the SDK picks its own version; it goes back after
SDK 58. expo-share-intent moves to 6.x, the line for SDK 55.
```

---

## Hop 2: SDK 55 → 57, skipping 56 (1 day)

- Changelogs: https://expo.dev/changelog/sdk-56 **and** https://expo.dev/changelog/sdk-57
- TARGET: `expo@~57.0.31` (or the latest 57.0.x). **Must be 57.0.17 or later.** Check with `npm ls expo`.
- SHARE_INTENT_MAJOR: `8`
- Brings React Native 0.86, Hermes V1 as the default engine, TypeScript 6.0.3, Reanimated 4.5 and Worklets 0.10 (versions come from `--check`).

### Shikai-specific edits (H4)

1. **React Navigation imports.** In SDK 56, `expo-router` stopped depending on React Navigation. Run the codemod:

   ```bash
   npx expo-codemod sdk-56-expo-router-react-navigation-replace app components hooks lib widgets contexts
   git diff --stat
   ```

   Known direct import before the codemod: `components/shared/Tooltip.tsx` imports `useNavigation` from `@react-navigation/native`. After the codemod:

   ```bash
   grep -rn "@react-navigation" --include=*.ts --include=*.tsx app components hooks lib widgets contexts stores
   ```

   - Prints nothing: remove the packages with `npm uninstall @react-navigation/bottom-tabs @react-navigation/elements @react-navigation/native`, then run `npx expo-doctor@latest`. If doctor reports one of them as a missing required peer, put that one back (`npm install <it>`) and note it in the commit body.
   - Still prints imports: stop.
2. **`fetch` is now `expo/fetch`.** SDK 56 makes `expo/fetch` the global `fetch`. No code change. Four call sites must be tested in QA: OAuth token exchange (`app/sign-in.tsx`), PDF viewer (`components/file/PdfViewer.tsx`), mermaid script load (`components/shared/MarkdownRenderer.tsx`), widget refresh (`lib/widget-data.ts`). Do **not** set `EXPO_PUBLIC_USE_RN_FETCH`. If one of them breaks, stop.
3. **`@expo/vector-icons`** is already a direct dependency in `package.json`. Keep it. Don't run the vector-icons codemod (out of scope).
4. **TypeScript 6.0.3** arrives through `--check`. If `tsc` errors come from `tsconfig.json` options (not app code), stop.
5. Do not touch Hermes. Do not set `useHermesV1`.

### Extra checks for this hop

- The memory check in QA matters most here. Compare against the baseline carefully.
- QA items Q4 and Q5 (tooltips) cover the `Tooltip.tsx` import change.

### Commit (H8)

```
chore(deps): upgrade Expo SDK 55 to 57, skipping 56

React Native 0.83 to 0.86, with Hermes V1 now the default engine. SDK 56 and
SDK 57 before expo 57.0.9 have a Hermes V1 memory regression in apps that load
reanimated or worklets, which Shikai does, so this hop skips 56 and pins expo
to 57.0.17 or later. Applies SDK 56's changes here: React Navigation imports
move to expo-router through Expo's codemod, and the @react-navigation packages
go. expo-share-intent moves to 8.x, the line for SDK 57.
```

(If a `@react-navigation` package had to stay, replace the last-but-one sentence with which one stayed and why.)

---

## Hop 3: SDK 57 → 58 (half a day to 1 day)

- Changelogs: https://expo.dev/changelog/sdk-58 and https://docs.expo.dev/router/migrate/sdk-57-to-58/
- TARGET: `expo@~58.0.22` (or the latest 58.0.x)
- SHARE_INTENT_MAJOR: `9`
- Brings React Native 0.88 (includes 0.87), the strict TypeScript API, and the expo-router navigation rework. Node must be 22.13+, 24.3+ or 26+ (`node -v`; this machine has 24.22.1, fine).

### Shikai-specific edits (H4)

1. **`app/_layout.tsx` StatusBar.** React Native 0.87 removed the `StatusBar` props `backgroundColor` and `translucent`. The component around line 64 is:

   ```tsx
   <StatusBar
     barStyle={theme.isDark ? "light-content" : "dark-content"}
     backgroundColor="transparent"
     translucent
   />
   ```

   Delete the `backgroundColor="transparent"` and `translucent` lines. Keep `barStyle`. Under edge-to-edge both were already no-ops.
2. **Removed React Native APIs.** This must print nothing:

   ```bash
   grep -rn --include=*.ts --include=*.tsx -E "react-native/Libraries|InteractionManager|\bTouchable\b|NativeMethods|ImageBackground|\banimated=\{" app components hooks lib widgets contexts
   ```

   If it prints something, stop.
3. **Router rework.** These must print nothing:

   ```bash
   grep -rn --include=*.ts --include=*.tsx -E "initialRouteName|initialParams|navigationKey|freezeOnBlur|beforeRemove|renderRouterAsync|expo-router/js-stack|withLayoutContext" app components hooks lib
   ```

   If it prints something, stop.
4. **`safe-area-context`**: comes through `--check`. Nothing else to do.
5. **`web.output`** is already `"static"`. Leave it. Add this check after H5:

   ```bash
   npx expo export -p web
   ```

   Pass: export finishes. Do not deploy.

### Things this hop changes that only QA can catch

- `useNavigation` now throws outside a navigator. `components/shared/Tooltip.tsx` uses it, and `TooltipProvider` sits in `app/(app)/(tabs)/_layout.tsx`. QA Q4 and Q5.
- The module-level `router` (imported in `app/(app)/repo/[repoId]/blame.tsx`, `app/(app)/repo/[repoId]/pr/[number].tsx`, `components/repo/DiffFileList.tsx`, `components/repo/TimelineEventRow.tsx`, `lib/prefetch.ts`) throws if used before the router first renders. Cold-start paths are the risk. QA Q11 and Q12.
- Parent route params are no longer copied into child routes. Nested repo screens must still know their repo. QA Q6 to Q8.
- `Linking.parse()` no longer decodes twice. The OAuth code goes through it in `app/sign-in.tsx`. QA Q2.
- Navigation actions are queued until after the React commit. The boot `router.replace` and the deep-link push after it (`hooks/useDeepLinks.ts`) depend on order. QA Q11.

If any of these fails, stop. Do not refactor the router code yourself.

### Commit (H8)

```
chore(deps): upgrade Expo SDK 57 to 58

React Native 0.86 to 0.88, which brings the strict TypeScript API and removes
the StatusBar backgroundColor and translucent props, so the root layout drops
them (both did nothing under edge-to-edge). expo-router's navigation rework
needed no code changes; boot, deep links and nested repo screens were checked
on a device. expo-share-intent moves to 9.x, the line for SDK 58.
```

(If any router code had to change after a STOP and a fix from Atharv, say so in the body instead of "needed no code changes".)

---

## Wrap-up (1.5 to 2 hours)

### W1. Pin react-native again (10 min)

```bash
node -p "require('./node_modules/react-native/package.json').version"
```

Add back to `package.json`, using that exact version:

```json
"overrides": {
  "react-native": "<that version>"
}
```

Then `npm install`, `npx expo install --check` (must be clean), gate (H5).

Commit:

```
chore(deps): pin react-native to <that version>

Same reason as the old 0.81.5 pin: stop a transitive bump from moving React
Native without a test.
```

### W2. Docs (45 min)

1. `notes/DECISIONS.md`: add an entry after D-034, following the format of the entries above it:

   > **D-035: SDK 56 skipped on the way to 58**
   > Shikai went from SDK 55 straight to 57. Hermes V1, default from SDK 56, has a memory regression in apps that load reanimated or worklets until expo 57.0.9, and Expo advises skipping 56. Shikai loads both, and Issue #37 was a worklets crash. Each other hop still got its own commit. Don't go below expo 57.0.17 if you ever roll back.

2. `notes/MAINTENANCE.md`:
   - Line "Upgrade one SDK at a time, never two at once." → "Upgrade one SDK at a time. Skip an SDK only when Expo's release notes say to (D-035)."
   - Step 2 mentions removing the `react-native` pin: keep it.
   - In the monthly step 3, the sentence about React Navigation running ahead of Expo's ranges: delete it if hop 2 removed the `@react-navigation` packages. Keep it if any stayed.
   - Search for `eas update`: SDK 55 made `--environment` required. Add `--environment production` to every `eas update` command shown.
3. `AGENTS.md`:
   - "Expo SDK 54" → "Expo SDK 58" in the first line.
   - "`react-native` is pinned to `0.81.5`" → the new version.
   - "New Architecture: Enabled (`newArchEnabled: true` in `app.config.ts`)" → "New Architecture: the only option since SDK 55; there is no flag."
   - `notes/DECISIONS.md` D-007 is titled "react-native is pinned to 0.81.5". Don't rewrite it; add one line at its end: "Pin moved to <new version> with the SDK 58 upgrade (D-035)."
   - Search for `eas update` and add `--environment production`, as above.
4. `CHANGES.md`: add a `1.8.0 (unreleased)` section at the top, matching the format of 1.7.0:
   - Expo SDK 58 and React Native 0.88 (from SDK 54 and 0.81).
   - No new features.
5. Delete `notes/sdk-58-plan.md` and `notes/sdk-58-baseline.txt` (copy the baseline numbers into the CHANGES entry or the commit body first if Atharv wants them).

Gate (H5), then commit:

```
docs: record the SDK 58 upgrade and why SDK 56 was skipped

Adds D-035, lets MAINTENANCE skip an SDK when Expo says to, adds
--environment to eas update commands (required since SDK 55), and moves the
agent guide to SDK 58.
```

### W3. Hand back to Atharv (stop here)

Write a short report: the commits on the branch (`git log --oneline main..chore/sdk-58`), the baseline vs final memory and cold start numbers, and any STOP that came up and how it was settled.

Atharv then does these himself:

1. Push the branch and decide merge vs PR.
2. `eas build --platform android --profile production`.
3. Submit that build to the **internal testing** track, install 1.8.0 over the Play 1.7.0 on the Narzo, and check sign-in, theme and watchlist survived. This is the real upgrade test.
4. Production submit: `eas-cli submit --id <build id>`.

---

## QA list (H7)

Atharv taps; the executor runs the adb lines and writes pass/fail for each item. Use `A="$ANDROID_HOME/platform-tools/adb.exe"`.

| # | Check | Pass when |
|---|---|---|
| Q1 | Cold start: `"$A" shell am force-stop com.atharvdange618.Shikai` then `"$A" shell am start -W -n com.atharvdange618.Shikai/.MainActivity \| grep TotalTime`, three times. Tap the override on the block screen. | App reaches Overview. Middle TotalTime is within 25% of the baseline. |
| Q2 | Sign in with GitHub (only after an uninstall install). | Lands on Overview, signed in. |
| Q3 | Kill the app and start it again. | Still signed in; theme unchanged. |
| Q4 | Overview: tap a contribution stat to open its tooltip. | Tooltip shows, no crash. |
| Q5 | Open any repo; tap the info dot in the repo header. | Tooltip shows, no crash. |
| Q6 | Open facebook/react PR #37778 → Files → open a file's diff full-screen. Try Wrap and Copy, then go back. | Diff renders with colors; back returns to the file list. |
| Q7 | In the same repo open Commits → a commit → a file diff. Then Compare → a file diff. | Each screen shows its title and content; nothing says the repo is missing. |
| Q8 | Repo → Actions → a run → a check's logs. | Logs load. |
| Q9 | Open the README of `mermaid-js/mermaid`. | Mermaid diagrams render (tests `fetch` of the mermaid script). |
| Q10 | Open any `.pdf` file in a repo (Atharv picks one he knows). | PDF renders (tests `fetch` in PdfViewer). |
| Q11 | Cold deep link. Get a SHA with `gh api repos/facebook/react/commits/main --jq .sha`, then `"$A" shell am force-stop com.atharvdange618.Shikai` and `"$A" shell am start -a android.intent.action.VIEW -d "shikai://repo/facebook~~react/commit/<sha>"`. Press Back once. Then kill and start the app normally. | Opens the commit; Back goes to Overview; the normal start lands on Overview, not the commit again. |
| Q12 | Notification alerts (needs Atharv's PAT in Settings). Turn alerts on. Background the app, then force the job as `AGENTS.md` describes under Build Gotchas (WorkManager diagnostics, then `jobscheduler run -f`). If an alert appears, kill the app and tap it. | The job runs without a crash in logcat; tapping an alert from a killed app opens the thread. If no thread had news, write "no alert to tap" and pass on the job run alone. |
| Q13 | Home screen widget: add it (or refresh an existing one). | Contribution graph shows, in the app's theme colors. |
| Q14 | Switch theme dark ↔ light in Settings; pull to refresh on Repos. | Colors switch; refresh spinner uses theme colors. |
| Q15 | Memory: use the app for 5 minutes as in step 0.2, then `"$A" shell dumpsys meminfo com.atharvdange618.Shikai \| grep -E "TOTAL PSS\|TOTAL RSS\|TOTAL:"`. | Within 25% of the baseline. |
| Q16 | Crashes: `"$A" logcat -d -b crash` and `"$A" logcat -d \| grep -E "FATAL\|AndroidRuntime: " \| head -20`. | Both print nothing from `com.atharvdange618.Shikai`. |

Paste the filled table into the hop's report to Atharv (not into the commit).

---

## STOP report template

```
STOP: hop <n>, step <H#/Q#/W#>
Command: <exact command>
Exit code: <n>
Error (first 60 lines, unedited):
<paste>
What I changed before this point (git status --short):
<paste>
What I think the cause is (one or two lines, marked as a guess):
<text>
I did not try any fix outside the plan's allowed fixes.
```

Atharv brings STOP reports to Claude Code. Wait for the answer before going on.
