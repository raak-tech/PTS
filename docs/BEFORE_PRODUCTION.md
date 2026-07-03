# Before going to production

**Purpose:** Single checklist for closing the **pilot / test** setup and turning on **real** admin access, SMS OTP, and clean data before live users.

**Review when:** You are ready to stop using fixed OTP `123456`, register real phone numbers, and hand the app to counselors and clients outside the internal test group.

**Production web:** https://pts-web-pied.vercel.app  
**Vercel project:** `sat-ananths-projects/pts-web`  
**Mobile API URL (EAS):** `https://pts-web-pied.vercel.app` (set in `apps/mobile/eas.json`)

---

## Current pilot shortcuts (remove before go-live)

| Item | Pilot state today | Production target |
|------|-------------------|-------------------|
| OTP | `OTP_TEST_MODE=true` → all numbers accept `123456` | Real SMS OTP via MSG91 |
| MSG91 | Not configured on Vercel | `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` set |
| Admin | `role=admin` set in DB for ops email(s) | `ADMIN_EMAILS` env + at least one admin account |
| Test data | Pilot users, intakes, plans in Neon | Cleared or fresh database |
| Mobile APK | Preview builds for internal test | Production profile + Play Store / distribution plan |

---

## 1. Admin account setup

Web admin lives at **`/admin`**. Access requires a normal **email + password** login at `/login`, then either:

- the signed-in user’s email is listed in **`ADMIN_EMAILS`**, or  
- the user has **`role = 'admin'`** in PostgreSQL (`users` table).

### Option A — Recommended: `ADMIN_EMAILS` (no DB edit)

1. Register (or use existing) ops account at https://pts-web-pied.vercel.app/register  
   Example: `ops@yourcompany.com`
2. On Vercel → **pts-web** → **Settings** → **Environment Variables** → **Production**:
   ```bash
   ADMIN_EMAILS=ops@yourcompany.com,backup@yourcompany.com
   ```
   Comma-separated, no spaces required (trimmed automatically).
3. Redeploy production (or run `vercel deploy --prod` from `apps/web`).
4. Sign in at `/login` → open `/admin` → confirm **Register mobile user** works.

**CLI:**
```bash
cd apps/web
printf 'ops@yourcompany.com' | npx vercel env add ADMIN_EMAILS production
npx vercel deploy --prod --yes
```

### Option B — Database `role = admin` (what we used in pilot)

Use when you already have an account and need admin before `ADMIN_EMAILS` is set:

```sql
UPDATE users
SET role = 'admin'
WHERE lower(email) = lower('satheesh@raak-advisory.co.in');
```

Run against **production** Neon (SQL console or migration). Prefer **Option A** for go-live so admin access is env-driven and auditable.

### Admin checklist

- [ ] At least one admin email registered with a strong password
- [ ] `ADMIN_EMAILS` set on Vercel production (or documented DB `role=admin` removed after cutover)
- [ ] `/admin` loads after sign-in
- [ ] Can register a **client** and **counselor** by phone from `/admin`
- [ ] Non-admin users cannot access `/admin` (redirects to `/`)

---

## 2. Activate MSG91 (real SMS OTP)

OTP is sent by `apps/web` via MSG91 Flow API (`apps/web/src/lib/msg91.ts`).

### MSG91 dashboard

1. Create / use MSG91 account and **Auth Key**
2. Create an **OTP / Flow template** with a variable for the code (API sends `VAR: <code>`)
3. Note **Template ID**

### Vercel production env

```bash
MSG91_AUTH_KEY=<your-auth-key>
MSG91_TEMPLATE_ID=<your-template-id>
```

**CLI:**
```bash
cd apps/web
printf '<auth-key>' | npx vercel env add MSG91_AUTH_KEY production
printf '<template-id>' | npx vercel env add MSG91_TEMPLATE_ID production
```

4. Redeploy production after adding vars.

### Verify MSG91

- [ ] `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` set on Vercel **Production** only (not committed to git)
- [ ] Register a **real** test phone via `/admin`
- [ ] In mobile app: enter number → **Send OTP** → SMS received (not `123456` unless test mode still on)
- [ ] Wrong OTP is rejected; correct OTP signs in
- [ ] Check Vercel function logs if SMS fails (`sms-failed` from `/api/auth/otp/send`)

**Reference:** Trainer app MSG91 setup on `100.119.182.21` (`trainer-app-mvp-recovered`) if reusing the same MSG91 project.

---

## 3. Remove OTP test mode

While **`OTP_TEST_MODE=true`**, every registered number accepts fixed OTP **`123456`** and **no SMS is sent**.

### Turn off test mode

1. Vercel → **pts-web** → **Environment Variables** → **Production**
2. **Delete** `OTP_TEST_MODE` (or set to `false`)
3. Optionally delete `OTP_FIXED_CODE` if it was set
4. Redeploy production

**CLI:**
```bash
cd apps/web
npx vercel env rm OTP_TEST_MODE production
npx vercel deploy --prod --yes
```

### Code behaviour after cutover

Fixed OTP is used only when:

- phone matches `+919900000*` (dev test range — do **not** register these for real users), **or**
- `OTP_TEST_MODE` is on, **or**
- MSG91 keys are **missing** (fallback — avoid in production)

With MSG91 configured **and** `OTP_TEST_MODE` removed, all normal numbers get a **random 6-digit OTP** via SMS.

### OTP checklist

- [ ] `OTP_TEST_MODE` removed from Vercel production
- [ ] `OTP_FIXED_CODE` removed (if present)
- [ ] MSG91 keys present **before** removing test mode (otherwise API still accepts fixed OTP when MSG91 is unset)
- [ ] Smoke test: real number receives SMS OTP and `123456` **fails**
- [ ] Document who owns MSG91 billing and template updates

---

## 4. Clear pilot / test data

Before real clients and counselors onboard:

- [ ] Export anything you need from `/admin` metrics and provider views
- [ ] Remove or archive pilot users (test phones, internal accounts)
- [ ] Clear test intakes, draft plans, and messages (Neon SQL or admin tooling)
- [ ] Do **not** register `990000000*` range numbers in production
- [ ] Rotate any passwords used during pilot (admin web login)
- [ ] Optional: fresh Neon branch / new database for a clean slate

**Pilot accounts to review:** numbers registered during internal testing (e.g. `9988776655`, `9900000001`, etc.).

---

## 5. Mobile app (Expo / EAS)

- [x] `EXPO_PUBLIC_API_URL` in `eas.json` points to production API (`https://pts-web-pied.vercel.app`)
- [x] **Build 14** (`versionCode=14`) at `apps/mobile/dist/pts-mobile-release.apk` — sideload via `adb install -r`
- [ ] `EXPO_PUBLIC_USE_MOCK_AUTH` is **not** set in EAS build profiles (verify on next EAS build)
- [ ] Rebuild APK after API auth changes if not using local Gradle
- [ ] Distribute new build to counselors; old APKs with cached sessions may need re-login

**Local install (when device connected):**
```bash
adb devices -l
adb install -r apps/mobile/dist/pts-mobile-release.apk
```

---

## 6. Other production env vars (web)

Confirm these are set on Vercel **Production** (see also `apps/web/.env.example`):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Neon Postgres |
| `OPENROUTER_API_KEY` | Yes | LLM plan generation |
| `COUNSELOR_INVITE_CODE` | Yes | Counselor web self-register |
| `CRISIS_ALERT_EMAIL` | Recommended | Red-flag alerts |
| `ADMIN_EMAILS` | Recommended | Web admin access |
| `MSG91_AUTH_KEY` | Yes (go-live) | SMS OTP |
| `MSG91_TEMPLATE_ID` | Yes (go-live) | SMS OTP |
| `OTP_TEST_MODE` | **No** | Remove before go-live |
| `CRON_SECRET` | Optional | Protects `/api/cron/intake-cleanup` (90-day intake delete). Without it, cron returns 401 — safe default. |
| Email (`EMAIL_*`) | Optional | Password reset via SMTP |

---

## 7. Final sign-off

| Step | Owner | Date | Done |
|------|-------|------|------|
| Admin via `ADMIN_EMAILS` | | | [ ] |
| MSG91 live + test SMS | | | [ ] |
| `OTP_TEST_MODE` removed | | | [ ] |
| Pilot data cleared | | | [ ] |
| New mobile build distributed | | 2026-07-03 | [x] build 14 on Pixel 7 |
| Ramya clinical sign-off on flows | | | [ ] |
| Internal smoke test (client + counselor E2E) | | | [ ] |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`MOBILE_AUTH.md`](MOBILE_AUTH.md) | OTP flow, env vars, registering mobile users |
| [`PRODUCTION_READY_CHECKLIST.md`](PRODUCTION_READY_CHECKLIST.md) | Broader product / safety / QA gates |
| [`PHASE0_CHECKLIST.md`](PHASE0_CHECKLIST.md) | Manual web E2E before pilot |
| [`apps/web/.env.example`](../apps/web/.env.example) | Local env template |
