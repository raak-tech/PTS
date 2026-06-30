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

## Android APK (EAS)

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

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run local` | Expo web on LAN :8081 |
| `npm run typecheck` | TypeScript |
| `npm run build:apk` | EAS preview APK (production API) |

## Theme

Warm Ember pilot — dark `#111`, accent `#FBBF24`.
