# Mobile auth (phone OTP)

PTS mobile uses **phone OTP** against the same Next.js API as the web app. Admins register users by phone; only registered numbers can sign in.

## Flow

1. User enters a 10-digit Indian mobile number (+91).
2. App calls `POST /api/auth/check-phone` — if not registered, show “contact your administrator”.
3. App calls `POST /api/auth/otp/send` — MSG91 sends SMS (or dev fallback logs OTP).
4. User enters OTP → `POST /api/auth/otp/verify` returns `{ token, user }`.
5. App stores the Bearer token and uses it for all API calls.
6. `GET /api/auth/session` refreshes user state on launch.

## Environment (web / Vercel)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres |
| `MSG91_AUTH_KEY` | MSG91 API key |
| `MSG91_TEMPLATE_ID` | OTP SMS template |
| `OTP_TEST_MODE` | Set `true` to accept fixed OTP `123456` for all numbers (pilot testing) |
| `OTP_FIXED_CODE` | Override fixed OTP (default `123456`) when test mode is on |
| `ADMIN_EMAILS` | Comma-separated admin emails for web admin |

## Environment (mobile / Expo)

| Variable | Default | Purpose |
|----------|---------|---------|
| `EXPO_PUBLIC_API_URL` | `https://pts-web-pied.vercel.app` | API base URL |
| `EXPO_PUBLIC_USE_MOCK_AUTH` | unset (`false`) | Set `true` for offline prototype |

## Registering users

1. Sign in to the web app as an admin (`ADMIN_EMAILS` or `role=admin`).
2. Open `/admin` → **Register mobile user**.
3. Enter phone, role (client or counselor), and display name.
4. User can sign in on the mobile app immediately.

API: `POST /api/admin/users` with body:

```json
{
  "phone": "9876543210",
  "role": "client",
  "displayName": "Priya Sharma"
}
```

For counselors, optional `title` and `bio` populate the counselor profile.

## Test phones

During pilot testing, set **`OTP_TEST_MODE=true`** on the web API (Vercel). All registered numbers then accept OTP **`123456`** without MSG91 SMS.

Numbers matching `+919900000*` always use the fixed OTP even if `OTP_TEST_MODE` is unset.

When you go live, remove `OTP_TEST_MODE`, configure MSG91, and clear test data.

**Full go-live checklist:** [`BEFORE_PRODUCTION.md`](BEFORE_PRODUCTION.md)

Example: `9988776655` → register via admin, sign in with OTP `123456` while test mode is on.

## Mock auth (prototype)

Set `EXPO_PUBLIC_USE_MOCK_AUTH=true` in `apps/mobile/.env` to use built-in test accounts without the API:

| Phone | Role | OTP |
|-------|------|-----|
| 9876543210 | client | 123456 |
| 9123456789 | counselor | 123456 |

Dev menu quick sign-in is only available in mock mode.

## Database migration

Run before first OTP login in an environment:

```bash
cd apps/web && npm run db:migrate
```

Migration `0009_mobile_auth.sql` adds `users.phone`, nullable `password_hash`, and `otp_codes`.

## Session format

- Token: opaque session ID (same as web cookie sessions).
- Authorization header: `Bearer <token>`.
- All existing API routes accept Bearer or cookie via `getUserFromRequest()`.

## Synthetic emails

OTP-only users get email `{digits}@phone.pts.local` for internal uniqueness; they never use password login.

## Theme

Mobile pilot uses **Warm Ember** (`warmEmber`) — dark background `#111`, accent `#FBBF24`.
