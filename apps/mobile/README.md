# PTS Mobile

Expo app for **clients + counselors** (phone OTP). See [`docs/MOBILE_APP_UX.md`](../../docs/MOBILE_APP_UX.md) and [`docs/MOBILE_AUTH.md`](../../docs/MOBILE_AUTH.md).

## Run locally (web preview)

```bash
cd apps/mobile
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your API host
npm install
npm run local          # http://<host>:8081
```

## Test accounts (local API)

After `npm run db:seed-dev` in `apps/web`:

| Phone | Role | OTP |
|-------|------|-----|
| 9900000001 | Client | 123456 |
| 9900000002 | Counselor | 123456 |

Production: register users at `/admin` on the web app.

## Android APK (EAS cloud)

**Prerequisites:** Expo account, `eas-cli` installed.

```bash
cd apps/mobile
npm install
npx eas login
npx eas init          # links project, writes projectId to app.config.ts extra.eas
npm run build:apk     # preview profile → installable APK
```

The `preview` profile points at `https://pts-web-pied.vercel.app`.

After build completes, EAS prints a download URL — install on Android (enable “Install unknown apps”).

```bash
# Check build status
npx eas build:list
```

## Android APK (local Gradle — no EAS queue)

Faster iteration (~10–35 min after first SDK install). Uses the same production API as the preview EAS profile.

### One-time setup (Ubuntu)

```bash
cd apps/mobile
bash ./scripts/setup-android-sdk.sh
# Add ANDROID_HOME / JAVA_HOME to ~/.bashrc (script prints the lines)
```

### Build

```bash
cd apps/mobile
npm run build:apk:gradle
```

Output:

- `android/app/build/outputs/apk/release/app-release.apk`
- `dist/pts-mobile-release.apk` (copy for easy sharing)

Optional: build only for your phone’s CPU (smaller, faster):

```bash
PTS_ANDROID_ABI=arm64-v8a npm run build:apk:gradle
```

Regenerate native project after plugin/config changes:

```bash
npm run prebuild:android
```

**Note:** Release builds are signed with the debug keystore (fine for sideload testing). For Play Store, configure a release keystore in `android/app/build.gradle`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run local` | Expo web on LAN :8081 |
| `npm run typecheck` | TypeScript |
| `npm run build:apk` | EAS preview APK (production API) |
| `npm run build:apk:gradle` | Local Gradle release APK |
| `npm run prebuild:android` | Regenerate `android/` from Expo config |

## Theme

Warm Ember pilot — dark `#111`, accent `#FBBF24`.
