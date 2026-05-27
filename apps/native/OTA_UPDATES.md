# Native app OTA updates (EAS Update)

This app uses [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/) + [EAS Update](https://docs.expo.dev/eas-update/introduction/) to ship JavaScript, TypeScript, and asset changes without a new App Store / Play Store submission.

## How it works in this project

1. **Store builds** (`eas build`) embed a native shell + an initial JS bundle and register an EAS **channel** (`production`, `preview`, or `development` — see [`eas.json`](./eas.json)).
2. **OTA publishes** (`eas update`) upload a new JS bundle to that channel on Expo's CDN.
3. On **launch** and when returning to **foreground**, [`use-expo-updates-bootstrap.ts`](./hooks/use-expo-updates-bootstrap.ts) checks for updates, downloads them, and reloads the app.
4. OTA is **disabled in dev** (`expo start` / `__DEV__`). You only get OTA on release builds (TestFlight, App Store, Play internal/production, etc.).

### Channels

| Channel | EAS build profile | Typical use |
|---------|-------------------|-------------|
| `production` | `production` | App Store / Play production users |
| `preview` | `preview` | Internal TestFlight / APK testers |
| `development` | `development` | Dev client builds |

Production store builds also request the `production` channel via [`app.json`](./app.json) (`updates.requestHeaders.expo-channel-name`).

### Runtime version

[`app.json`](./app.json) uses:

```json
"runtimeVersion": { "policy": "appVersion" }
```

The runtime version equals the app **`version`** field (currently `1.0.0`). OTA updates only apply to builds with the **same** runtime version.

- Same `version` (e.g. still `1.0.0`) → OTA is enough for JS/UI changes.
- Bump `version` (e.g. `1.0.0` → `1.1.0`) → you must ship a **new native build** to stores first; then publish OTAs for `1.1.0`.

---

## Quick reference: which command?

### JS / UI / hooks only (no native changes)

Ship an OTA to production:

```bash
cd apps/native
pnpm update:production -- --message "Fix For You trending order"
```

Or without the script:

```bash
cd apps/native
eas update --channel production --message "Describe the change"
```

Other channels:

```bash
pnpm update:preview -- --message "Internal QA"
pnpm update:development -- --message "Dev client fix"
```

### Backend (Convex) only

No native OTA required. Deploy backend separately:

```bash
cd packages/backend
pnpm deploy:prod
```

The native app talks to Convex over the network; existing store builds pick up API/query changes after deploy (no app update needed unless you changed env URLs or client-side code).

### Native code, plugins, permissions, or `app.json` native config

OTA is **not** enough. Create a new store build:

```bash
cd apps/native
pnpm build:ios          # local production iOS
pnpm build:android      # local production Android
# or remote Android:
pnpm build:android:remote
```

Then submit to stores (`eas submit`, App Store Connect, Play Console). After users install the new binary, use OTA again for subsequent JS-only fixes **for that new app version**.

### Bump app version (new store release)

1. Update `version` in [`app.json`](./app.json) (and native build numbers if you manage them in EAS).
2. Run `eas build` for iOS/Android (production profile).
3. Submit to App Store / Play Store.
4. After the build is live, publish OTAs with `eas update --channel production` (runtime will match the new `version`).

---

## Prerequisites

1. [EAS CLI](https://docs.expo.dev/build/setup/) installed and logged in:

   ```bash
   npm i -g eas-cli
   eas login
   ```

2. Run commands from **`apps/native`** (project root for Expo/EAS).

3. **Environment variables** (`EXPO_PUBLIC_*`) are baked into the update bundle at publish time. Ensure your production values are loaded (local `.env`, EAS environment, or `eas env:pull`) before running `eas update`.

4. Install deps from monorepo root if needed:

   ```bash
   pnpm install
   ```

---

## Recommended workflow (production JS change)

1. Implement and test locally: `pnpm dev` (from `apps/native`).
2. Deploy backend if needed: `pnpm deploy:prod` in `packages/backend`.
3. Publish OTA:

   ```bash
   cd apps/native
   pnpm update:production -- --message "Short description for EAS dashboard"
   ```

4. On a **release** build (not Expo Go): force-quit the app, reopen (or background → foreground). The bootstrap hook checks for updates on launch and when the app becomes active.
5. Verify in [Expo dashboard](https://expo.dev) → project **feelchat** → Updates.

---

## Useful EAS commands

```bash
# List recent updates on a channel
eas update:list --channel production

# View update details
eas update:view <update-id>

# Roll back (republish embedded bundle / previous update — see Expo docs)
eas update:rollback --channel production
```

---

## OTA vs native build (decision table)

| Change | OTA (`eas update`) | New build (`eas build`) |
|--------|--------------------|-------------------------|
| React screens, hooks, styling | Yes | No |
| Convex query usage (client-side) | Yes (with backend deploy) | No |
| New `EXPO_PUBLIC_*` env value | Yes (republish OTA with new env) | Sometimes (if embedded at build time only) |
| New npm package with **native** code | No | Yes |
| Expo SDK upgrade | No | Yes |
| `app.json` plugins, permissions, icons, splash | No | Yes |
| Bump `version` / new runtime | No (build first) | Yes |

---

## Troubleshooting

- **Update not appearing**: Confirm you're on a **release** build (not dev client with `expo start`). OTA is skipped when `__DEV__` is true.
- **Wrong channel**: Production store builds use the `production` channel. Preview/dev builds use their profile channel from [`eas.json`](./eas.json).
- **Runtime mismatch**: OTA must target the same `runtimeVersion` as the installed app (`appVersion` policy → check `version` in `app.json`).
- **Logs**: Release builds log `[ExpoUpdates]` to the device console (Xcode / Android Studio / `npx react-native log-ios`).

---

## Related files

- [`app.json`](./app.json) — `version`, `runtimeVersion`, `updates.url`, channel header
- [`eas.json`](./eas.json) — build profiles and channels
- [`hooks/use-expo-updates-bootstrap.ts`](./hooks/use-expo-updates-bootstrap.ts) — check / download / reload
- [`package.json`](./package.json) — `update:*` scripts
