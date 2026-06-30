# PTS End-to-End Test Guide

## Current System State (as of 2026-06-30)

**Phases completed:** 0-10 (all fundamentals + counselor-initiated plan generation)
**Phase pending:** 11 (QA pass)

### Database Users

| Role | Phone | Email | Password | Purpose |
|------|-------|-------|----------|---------|
| **Client** | +91 9900000001 | 919900000001@phone.pts.local | OTP: `123456` | Mobile client testing |
| **Counselor (Provider)** | +91 9900000002 | 919900000002@phone.pts.local | OTP: `123456` | Mobile provider + web workspace |
| **Admin** | N/A | (use ADMIN_EMAILS env var) | Email/password on web | Admin dashboard |

### Service URLs

- **Web (Counselor + Admin):** https://pts-web-pied.vercel.app
- **Mobile (Client + Counselor):** APK file (see below)
- **API Base:** https://pts-web-pied.vercel.app/api

---

## System Components

### 1. Mobile App (APK)

**Building now:** `npx eas build --platform android --local`

Once built, the APK will be located at:
```
~/.eas/builds/[build-id]/
```

**What to test on mobile:**
- **Client flow:** Intake → Daily check-ins → 6-week program → Graduation
- **Counselor flow:** Plan review → Week approval → Read-outs → Profile management

**Credentials (OTP auth):**
- Client: +91 9900000001 → OTP 123456
- Counselor: +91 9900000002 → OTP 123456

---

### 2. Web App (Counselor Workspace)

**URL:** https://pts-web-pied.vercel.app/login

**Login:** Email/password auth
- **Counselor:** 919900000002@phone.pts.local / (needs password set)
- **Admin:** (set via ADMIN_EMAILS env var)

#### Password Setup for Web Login

Web users (counselor/admin) need passwords set manually. Run:

```bash
cd /home/satananth/work/PTS/apps/web
node -e "
const crypto = require('crypto');
const email = '919900000002@phone.pts.local';
const password = 'TestPassword123!'; // Choose a password
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha256').toString('hex');
console.log('Email:', email);
console.log('Password:', password);
console.log('Hash to insert:', \`\${salt}:\${hash}\`);
"
```

Then update the DB:
```bash
psql -U satananth -d pts -c "UPDATE users SET password_hash = 'SALT:HASH' WHERE email = '919900000002@phone.pts.local';"
```

#### Counselor Features (Web)

1. **Plan Review** (`/provider/plans`)
   - See draft plans awaiting review
   - See pending intakes (new clients without plans yet)
   - Inline edit week content
   - Per-week approval with crisis acknowledgment gate
   - Send push notifications to clients on week approval

2. **Pending Intakes** (on `/provider/plans`)
   - View clients who completed intake but have no plan
   - Message clients for clarifications
   - Click "Generate plan draft" to trigger LLM generation
   - Admin notified via push when plan is ready

3. **Client Workspace** (`/provider/clients/[id]`)
   - View client's intake data
   - Read-out & plan review UI
   - Record engagement

4. **Messages** (`/messages`)
   - Send/receive messages with clients
   - Push notifications on new message

5. **Profile** (`/provider/profile`) — NEW Phase 10
   - Edit: fullName, title, credentials, bio, calendlyUrl
   - Edit: specialisations and languages (multiline JSON)
   - Save via PATCH endpoint

#### Admin Features (Web)

1. **Admin Dashboard** (`/admin`)
   - Notification dispatch center
   - Music library management
   - System stats

2. **Notifications Page** (`/admin/notifications`)
   - Send manual push notifications to users (if exposed)

---

## End-to-End Test Scenario

### Prerequisites
1. ✅ Mobile APK built and installed
2. ✅ Web login credentials set for counselor/admin
3. ✅ Dev users seeded (already done: client + counselor)

### Test Flow (30 mins)

#### Phase 1: Client Mobile Intake (5 min)

1. Install APK, open app
2. Tap phone input, enter `+919900000001`
3. Receive OTP, enter `123456`
4. Complete intake form:
   - Pain source: "Back pain"
   - Pain description: "Chronic lower back pain after injury"
   - Activities affected: "Running, sitting for long periods"
   - Recovery goal: "Return to work without pain"
   - Red flags: Mark as safe (isSafe=true)
5. Submit → Should succeed, no auto-plan generation (counselor-triggered)

#### Phase 2: Counselor Web - Message Client (3 min)

1. Login to https://pts-web-pied.vercel.app with counselor email/password
2. Go to `/provider/plans` → See "Pending intakes (1)"
3. Click "Message client" → Fill message, send
4. Mobile client should receive push notification "New message from [counselor name]"

#### Phase 3: Counselor Web - Generate Plan (3 min)

1. Back on `/provider/plans`
2. Click "Generate plan draft" button on pending intake
3. Should see "Plan draft generated!" alert
4. Page refreshes, intake moves from pending → draft plans section
5. Admin should receive push notification "New plan draft ready"

#### Phase 4: Counselor Web - Review & Approve Plan (5 min)

1. Scroll to "Draft plants awaiting review" section
2. Click on client plan card
3. Review all 6 weeks (editable inline)
4. Edit Week 1 content if desired
5. Click "Approve Week 1" → Should show success toast
6. Client gets push "Week 1 unlocked 🎉"

#### Phase 5: Client Mobile - Daily Check-in (3 min)

1. Open mobile app (already logged in)
2. Go to Today tab
3. See morning check-in card at top:
   - NRS face scale (0-10 pain)
   - Sleep quality (Poor/OK/Good)
   - One intention (text field)
4. Fill and submit → Success

#### Phase 6: Counselor Profile Editor (3 min)

1. On web, click "My profile" in provider nav (left sidebar)
2. Edit fields:
   - Full name: "Dr. Jane Smith"
   - Title: "Pain Rehabilitation Specialist"
   - Credentials: "PT, DPT, CSCS"
   - Bio: "Specializing in chronic pain management..."
   - Calendly URL: "https://calendly.com/janesmith"
   - Specialisations: (multiline) "Back pain\nChronic pain\nPost-surgical recovery"
   - Languages: (multiline) "English\nHindi"
3. Click "Save profile" → Success message

#### Phase 7: Admin Dashboard (2 min)

1. Switch to admin account (if set up via ADMIN_EMAILS)
2. Go to `/admin`
3. Browse admin dashboard (music library, stats, etc.)

---

## Test Checklist

### Mobile Client (OTP Auth)
- [ ] OTP login works (+919900000001, OTP 123456)
- [ ] Intake form submits successfully
- [ ] No auto-plan generation (counselor-triggered only)
- [ ] Can receive and read messages
- [ ] Morning check-in card displays and saves
- [ ] Daily engagement cards show holistic content
- [ ] Program tab shows week cards (locked until approved)
- [ ] Receives push notifications for messages and week approvals

### Mobile Counselor (OTP Auth)
- [ ] OTP login works (+919900000002, OTP 123456)
- [ ] Queue tab shows pending intakes and plans
- [ ] Can message clients from queue
- [ ] Can generate plan from queue (button triggers API)
- [ ] Plan review screen editable inline
- [ ] Can approve individual weeks
- [ ] Receives crisis acknowledgment gate if red flags

### Web Counselor (Email/Password)
- [ ] Email/password login works (919900000002@...)
- [ ] Plans page shows pending intakes and drafts
- [ ] "Message client" link goes to messages
- [ ] "Generate plan draft" button calls API and refreshes
- [ ] Plan review shows all 6 weeks
- [ ] Inline editing saves per week
- [ ] Per-week approve buttons work
- [ ] Profile editor (NEW) saves all fields to DB
- [ ] Profile nav link present in left sidebar

### Web Admin (if set up)
- [ ] Email/password login as admin works
- [ ] Can access `/admin` dashboard
- [ ] Admin features visible (music, stats, etc.)
- [ ] Receives push notifications for plan drafts

### API Gates (Auth & Gating)
- [ ] `/api/intake` — client auth required ✅
- [ ] `/api/provider/plans/...` — provider auth required ✅
- [ ] `/api/provider/generate-plan` — provider auth required ✅
- [ ] `/api/admin/*` — admin auth required ✅
- [ ] Client cannot see draft/approved plans until status = 'approved' ✅
- [ ] Client gets 401 on counselor endpoints ✅

### Crisis Gate (Patient Safety)
- [ ] If intake has hasRedFlags=true or isSafe=false:
  - [ ] Plan gets CRISIS note in counselorNotes
  - [ ] Approve CTA on web blocked behind acknowledgment checkbox
  - [ ] Red flag badge shows on web and mobile

### Push Notifications
- [ ] Token registration works on mobile login
- [ ] Week approval sends push "Week N unlocked"
- [ ] Message send triggers push "New message from [counselor]"
- [ ] Plan draft ready sends push to admins

---

## Troubleshooting

### APK Build Fails
- Check NDK: `export ANDROID_NDK_HOME=/path/to/ndk`
- Clean: `npx expo-cli prebuild --clean` before building

### OTP Not Working
- Verify DB has phone numbers in `+91XXXXXXXXXX` format
- Check OTP code is `123456` (hardcoded in dev)

### Web Login Fails
- Set password hash in DB (see Password Setup section above)
- Check ADMIN_EMAILS env var is set for admin access

### Mobile App Blank After Login
- Check API_URL matches https://pts-web-pied.vercel.app
- Check EXPO_PUBLIC_API_URL in app.config.ts

### Plan Generation Fails
- Check LLM API key is configured (for Claude API calls)
- Check DB connection and intakeResponses table
- Check admin users have expo_push_token to receive notifications

---

## Notes

- **Client NEVER has web access** — permanent design constraint
- **Counselor-initiated generation** — no auto-plan on intake submit
- **Crisis gates** — approval blocked if CRISIS notes present until acknowledged
- **Phase 11** — QA pass will verify all these gates + build/type checking

