# PTS Phase 0-10 Test Credentials & Access

**As of 2026-06-30 — All phases 0-10 complete, ready for E2E testing**

---

## Quick Reference

### 🔐 Credentials

#### Mobile App (OTP Authentication)
All users use OTP code: **`123456`** (hardcoded for dev)

| Role | Phone | Purpose |
|------|-------|---------|
| **Client** | `+919900000001` | End-to-end intake → graduation |
| **Counselor** | `+919900000002` | Mobile queue + plan management |

#### Web App (Email/Password Authentication)

| Role | Email | Password | URL |
|------|-------|----------|-----|
| **Counselor** | `919900000002@phone.pts.local` | `TestCounselor123!` | https://pts-web-pied.vercel.app/login |
| **Admin** | (Not yet created — set via ADMIN_EMAILS env var) | — | https://pts-web-pied.vercel.app/admin |

---

## Building the APK

The Android APK build is in progress. Local builds take 10-15 minutes on first run.

**To build (or resume):**
```bash
cd /home/satananth/work/PTS/apps/mobile
npx eas build --platform android --local
```

**Output location:** Look for the `.apk` file in the EAS build output directory once complete.

**Install:**
```bash
adb install path/to/pts-mobile-*.apk
```

---

## Web App - Ready Now ✅

### Counselor Console
**Login:** https://pts-web-pied.vercel.app/login
- Email: `919900000002@phone.pts.local`
- Password: `TestCounselor123!`

**Key Pages:**
| Page | URL | Phase | Feature |
|------|-----|-------|---------|
| Plan Review | `/provider/plans` | 1-4 | Draft plans, per-week approval, crisis gate |
| Pending Intakes | `/provider/plans` | 9 | NEW: View clients without plans, message, generate |
| Plan details | `/provider/clients/[id]` | 1-3 | Full client workspace, read-outs |
| Messages | `/messages` | 6 | Send/receive with clients, push notifications |
| My Profile | `/provider/profile` | 10 | NEW: Edit counselor info (name, credentials, bio, calendly, etc.) |
| Assignments | `/provider/assignments` | — | Admin assignments (placeholder) |

### Admin Dashboard
**Location:** https://pts-web-pied.vercel.app/admin
- Requires `role = 'admin'` in DB or email in `ADMIN_EMAILS` env var
- Not yet set up — you can create an admin user manually via:
  ```bash
  psql -U satananth -d pts -c "INSERT INTO users (id, email, phone, role, password_hash, created_at) VALUES (gen_random_uuid(), 'admin@pts.local', NULL, 'admin', 'HASH:HERE', NOW());"
  ```

---

## System Architecture Phases

### ✅ Phase 0: Decisions
Captured in `DECISIONS.md` — all decisions made:
- No liability insurance (India compliance)
- Counselor-led, not platform-driven
- No crisis escalation commitment
- Clients OTP-only on mobile, never on web
- Monthly sessions post-program

### ✅ Phase 1: Foundation
- DB schema (planWeeks, dailyCheckIns, users, etc.)
- Auth unification (OTP for mobile, email/password for web)

### ✅ Phase 2-4: Core Features
- Counselor inline plan editing (per-week)
- Crisis acknowledgment gates
- Client safety checks (red flags)

### ✅ Phase 5-8: Mobile & Notifications
- Morning check-in (NRS scale + sleep + intention)
- Daily engagement tracking
- Graduation screen + maintenance mode
- Expo Push Notifications end-to-end
  - Client → plan/message/check-in due pushes
  - Counselor → queue badge notifications
  - Admin → plan draft ready notifications

### ✅ Phase 9: Counselor-Initiated Plan Generation
**NEW redesign:** Plan generation is counselor-triggered, not automatic
- **9A:** Web pending intakes queue + generate button
- **9B:** `POST /api/provider/generate-plan` endpoint + intake idempotency
- **9C:** Mobile pending intakes section + generate from queue

**Flow:**
1. Client completes intake
2. Intake appears in counselor queue (pending intakes)
3. Counselor can message for clarifications
4. Counselor clicks "Generate plan draft" → LLM called → plan appears in review queue
5. Admin notified via push when draft ready

### ✅ Phase 10: Counselor Profile Editor
- `/provider/profile` page (NEW)
- Edit: fullName, title, credentials, bio, calendlyUrl, specialisations, languages
- PATCH `/api/provider/profile` endpoint
- All data persists to `counselorProfiles` table

### ⏳ Phase 11: Pre-pilot QA (Pending)
- Auth gates verification
- Cache/state management
- Build type-checking
- Crisis gates cannot be bypassed
- All 401 responses correct
- Push notification triggers working

---

## What Each Component Does

### 📱 Mobile App (Expo, React Native)

**Client side:**
- OTP login → intake form → daily check-ins → 6-week program → graduation
- Morning check-in: pain level (NRS emoji scale), sleep (chips), intention (text)
- Weekly program view: locked week cards unlock as counselor approves
- Monthly maintenance check-in after 6 weeks complete
- Push notifications for: week unlocked, new messages, check-in reminders

**Counselor side:**
- OTP login → queue view (pending intakes + plans) → plan review
- Queue: "Pending intakes" section with message + generate buttons
- Plan review: editable week content (mobile) or link to web for full editing
- Daily engagement tracking
- Messages with clients

### 🌐 Web App (Next.js, App Router)

**Counselor workspace:**
- Auth: email/password (OAuth-ready, not yet integrated)
- Plans page: 
  - "Pending intakes" section (TOP) — clients with intake, no plan yet
  - "Draft plans" section — generated plans awaiting review
  - "Approved plans" section — completed plans
- Plan review UI: click-to-edit week content, per-week approval
- Messages: send/receive, thread view with counselor
- Profile editor: manage public info (name, credentials, specialisations, languages, calendly)

**Admin dashboard:**
- Notification dispatch center
- Music library management
- System stats
- Crisis escalation tracking (in progress)

### 🔗 API Layer

All endpoints at: `https://pts-web-pied.vercel.app/api/`

**Key endpoints:**
- `POST /auth/login` — email/password
- `POST /auth/check-phone` → `POST /auth/otp` — 2-step mobile OTP
- `POST /intake` — client intake submission (counselor-triggered plan gen)
- `GET /provider/plans` — provider sees draft plans
- `PATCH /provider/plans/[id]/week/[n]` — edit week content
- `POST /provider/plans/[id]/week/[n]/approve` — week approval trigger
- `POST /provider/generate-plan` — trigger plan LLM generation
- `GET /provider/pending-intakes` — list intakes without plans
- `PATCH /provider/profile` — save counselor profile
- `POST /notifications/register-token` — push token registration
- `POST /messages` — send message (triggers push)

---

## Testing Recommendation

### Option A: Quick Smoke Test (30 min, no APK needed)

1. **Web Counselor Login** ✅ Ready NOW
   - Go to https://pts-web-pied.vercel.app/login
   - Use: `919900000002@phone.pts.local` / `TestCounselor123!`
   - Navigate around (plans, profile, messages)

2. **Simulate Mobile Intake** (use seed data)
   - DB already has test client with completed intake
   - Check web shows "Pending intakes" section
   - Test generate plan flow

3. **Generate Plan & Review**
   - Click "Generate plan" on pending intake
   - Verify plan appears in draft queue
   - Try editing and approving

### Option B: Full E2E with APK (60 min, includes mobile)

1. Wait for APK to finish building
2. Install on device/emulator
3. Run through client intake on mobile
4. Test counselor mobile queue
5. Test web plan review
6. Test messages and push notifications

---

## Key Constraints & Design Principles

⚠️ **PERMANENT:**
- Clients NEVER get web access (only mobile OTP)
- Counselor-led platform (not automated)
- No platform crisis escalation commitment
- No liability insurance requirement (India)

✅ **IMPLEMENTATION:**
- Per-week approval (not atomic plan approval)
- Crisis notes block all approve CTAs until acknowledged
- Plan generation counselor-triggered (not auto)
- Counselor can message before generating plan
- Monthly post-program check-ins (30+ days after completion)

---

## Next Steps

1. **Immediate:** Try web counselor login + UI navigation
2. **APK ready:** Install and run mobile flow
3. **Phase 11:** Run full QA suite (type checking, auth gates, crisis gates)
4. **Pilot launch:** Deploy to production with real users

---

## Questions?

- Schema changes: See `/home/satananth/work/PTS/apps/web/src/db/schema.ts`
- Phase specs: See `/home/satananth/work/PTS/docs/BUILD_SEQUENCE.md`
- E2E test checklist: See `E2E_TEST_GUIDE.md`

