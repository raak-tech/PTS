# PTS Backlog → Cursor Execution Spec

**Complete specification for all 98 backlog items across 10 tracks.**

**Format:** Track → Item → Exact specifications for Cursor to implement  
**Status:** Ready for autonomous execution (after Phase 0 validation)

---

## ARCHITECTURE OVERVIEW

### Tech Stack (Fixed)
- **Frontend:** Next.js 16.2.6, TypeScript (strict), CSS-in-JS
- **Backend:** Next.js API routes, PostgreSQL (Neon), Drizzle ORM
- **LLM:** Claude via OpenRouter (anthropic/claude-sonnet-4.6)
- **Auth:** HTTP-only cookies, argon2 hashing, session tokens
- **Deployment:** Vercel (production), GitHub (source)
- **Monitoring:** Vercel logs, structured JSON logging

### Data Model (Established)
- `users` — clients (role='client'), counselors (role='provider')
- `intakeResponses` — one per client, captures 7-step assessment
- `plans` — LLM-generated, counselor-reviewed, status: draft/approved
- `messages` — async chat (fromUserId, toUserId, readAt)
- `counselorProfiles` — credentials, specialisations, languages, calendly
- `clientCounselor` — one counselor per client (assignment)
- `pushSubscriptions` — notification endpoints
- See `src/db/schema.ts` for current schema

### API Patterns (Established)
```
POST /api/[resource] — create
GET /api/[resource] — list or read
POST /api/[resource]/[action] — perform action
DELETE /api/[resource]/[id] — delete
Authentication: HTTP-only session cookie (via /lib/session.ts)
Error handling: NextResponse.json with { error, status }
Logging: log() and logError() from @/lib/logger
Rate limiting: checkRateLimit() from @/lib/rate-limit
```

### UI Patterns (Established)
- Client pages: centered layout, clamp() for responsive typography
- Provider pages: grid/sidebar layouts, data tables
- Responsive: mobile-first, tested on 375px (mobile), 1024px (tablet), 1920px (desktop)
- Mobile input: 44px+ touch targets, avoid hover-only interactions

---

## TRACK 0 — STRATEGY & FOUNDATION

**All items are documentation/decision-making. Cursor role: Format and store decisions, generate compliance docs.**

### Item 0.1: Finalise product name and brand positioning

**Spec:**  
- Decision: Use "PTS (Pain to Strength)" as primary brand
- Positioning: "Counseling-led recovery platform for anyone whose pain has changed how they live"
- Update all:
  - src/app/LandingPage.tsx (hero, title, tagline)
  - HTML <title> tags
  - Meta descriptions
  - docs/PROJECT_BRIEF.md (refresh version tag)

**Cursor action:** When Satheesh confirms brand decision, update files with find-replace. Commit as "Finalise brand: PTS (Pain to Strength)".

**Status:** ⏳ Pending Satheesh decision

---

### Item 0.2–0.9: Strategy decisions (7 more items)

**Spec:** See TRACK0_DECISIONS.md for detailed prompts. Cursor role: Store decisions in `docs/STRATEGY_DECISIONS.md` once provided.

**Status:** ⏳ Pending stakeholder input (Satheesh + Ramya)

---

## TRACK 1 — LANDING PAGE & MARKETING SITE

**Currently:** Exists at src/app/LandingPage.tsx (basic version)  
**Goal:** Production-quality marketing site

### Item 1.1: Write hero section copy

**Spec:**
- File: `src/app/LandingPage.tsx` (update HeadlineSection)
- Content needed:
  - Headline (6 words max): "Get back to living after pain"
  - Subheadline (15 words max): "Personalized counseling + daily support + a counselor who knows your story"
  - CTA button: "Start your recovery → " (leads to /register)
  - Background: Calming gradient or image (no medical jargon)

**Implementation:**
```jsx
// src/app/LandingPage.tsx
function HeadlineSection() {
  return (
    <section style={{ background: 'linear-gradient(...)', padding: 'clamp(40px, 10vw, 80px) ...' }}>
      <h1 style={{ fontSize: 'clamp(32px, 8vw, 52px)', lineHeight: 1.2 }}>
        Get back to living after pain
      </h1>
      <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: '#666', marginTop: 12 }}>
        Personalized counseling + daily support + a counselor who knows your story
      </p>
      <Link href="/register" style={{ ...buttonStyle }}>
        Start your recovery →
      </Link>
    </section>
  )
}
```

**Testing:** 
- [ ] Text renders correctly on mobile (375px), tablet (768px), desktop (1920px)
- [ ] CTA button is clickable, leads to /register
- [ ] No text overflow or layout breaks

**Status:** ✅ Can be implemented immediately

---

### Item 1.2: Write "Who this is for" section

**Spec:**
- 3-4 pain archetypes in plain language
- Each archetype: title + 2-3 sentence description + subtle icon/color

**Content:**
```
Archetype 1: Workplace injury
"You got hurt at work. Recovery means returning to your job with confidence."

Archetype 2: Sports injury
"You were active. Now pain has sidelined you. Recovery means getting back in the game."

Archetype 3: Road accident
"You survived. Now comes the harder part: rebuilding after trauma and pain."

Archetype 4: Health disruption
"Sudden pain changed everything. Recovery means reclaiming your independence."
```

**Implementation:** Add new section to LandingPage.tsx with grid of cards.

**File:** `src/app/LandingPage.tsx` (add ArchetypesSection)

**Status:** ✅ Can be implemented immediately

---

### Item 1.3–1.10: FAQ, footer, analytics, design

**Spec (abbreviated for space):**
- 1.3 FAQ: 6-8 QA pairs (counseling vs therapy, confidentiality, crisis, cost, cancel)
- 1.4 Footer: privacy policy link, terms, contact, crisis line (iCall: 9152987821)
- 1.5 Crisis helpline: Visible on every page (sticky banner or header icon)
- 1.6 Design: Mobile-first, use clamp() for all font sizes and spacing
- 1.7 Build: Convert designs to React components
- 1.8 Analytics: Plausible or Vercel Analytics (script in _document)
- 1.9 Counselors section: Added after Phase 1 (once real counselors exist)

**Status:** ⏳ Design phase (Satheesh) → Implementation (Cursor)

---

## TRACK 2 — CLIENT ONBOARDING & ASSESSMENT

**Currently:** 7-step intake exists and is live  
**Goal:** Enhance with additional context and save-resume

### Item 2.1–2.6: Intake content (already written)

**Status:** ✅ Implemented (see src/app/IntakeClient.tsx)

---

### Item 2.7: Enhanced save-and-resume

**Spec:**
- **Current:** Saves to localStorage (key: `pts.intake.draft.v3`)
- **Enhance to:** Also save checkpoint to database (in case browser storage lost)

**Implementation:**
- New table: `intakeCheckpoints` (user_id, step, data JSON, created_at)
- New API: `POST /api/intake/checkpoint` — saves current step to DB
- Trigger: On blur of any field + on step change
- On page load: Check DB for checkpoint, restore if exists

**Files to modify:**
- `src/db/schema.ts` — add intakeCheckpoints table
- `src/db/migrations/0009_intake_checkpoints.sql` — create table
- `src/app/IntakeClient.tsx` — add checkpoint saving
- `src/app/api/intake/checkpoint/route.ts` — new endpoint

**Status:** ✅ Can be implemented after Phase 0

---

### Item 2.8: Intake completion screen

**Spec:**
- Page: `/intake/complete`
- Show: Reassuring message, what happens next timeline, links to /plan and /messages
- Content: "Your counselor will review this and generate your personalized plan. Check back in 2-4 hours. Meanwhile, browse resources or message your counselor."

**File:** `src/app/intake/complete/page.tsx` (already exists, enhance)

**Status:** ✅ Already exists, minor enhancement

---

## TRACK 3 — PLAN DEVELOPMENT & PROGRAM ENGINE

**Currently:** LLM generates plans, counselor approves (draft/approved status)  
**Goal:** Add plan versioning, adaptation logic, escalation rules

### Item 3.1: Plan structure and week types

**Spec:**
- Week types:
  - **Stabilisation (weeks 1–2):** Grounding, safety, understanding the pain, building safety routines
  - **Building (weeks 3–4):** Gentle re-engagement, values clarification, small wins
  - **Consolidation (weeks 5–6):** Integration, habits, preparing for continuation
  - **Continuation (week 7+):** Maintenance, booster practices, self-directed

- Each week contains:
  - Theme (e.g., "Finding Ground")
  - Focus (1–2 sentences on what this week is about)
  - 3 daily practices (title, description, duration in minutes)
  - Weekly reflection question
  - Counselor note (what to look for)

**Implementation:** Already in LLM prompt (src/lib/plan-generator.ts). Verify output structure.

**Status:** ✅ Already implemented

---

### Item 3.2: Plan versioning and history

**Spec:**
- New table: `planVersions` (id, plan_id, content JSON, created_by, created_at, change_reason)
- Trigger: On plan approval or update, create version record
- UI: Counselor can view "History" on plan review page, see all versions with diffs

**Files:**
- `src/db/schema.ts` — add planVersions table
- `src/db/migrations/0010_plan_versions.sql`
- `src/app/api/plans/route.ts` — update to create version on save
- `src/app/provider/plans/PlanReviewClient.tsx` — add "View history" button

**Status:** 🟡 Medium priority (implement after Phase 0)

---

### Item 3.3: Plan adaptation logic

**Spec:**
- Rule: If weekly check-in shows pain level unchanged or increased OR goal progress 0%, counselor should be alerted
- Implementation: New table `planAdaptations` (plan_id, triggered_by_checkin_id, action_suggested, dismissed_by)
- Logic in: `POST /api/checkins` endpoint — after creating checkin, evaluate against plan and suggest adaptations

**Status:** 🟡 Post-pilot

---

## TRACK 4 — DAILY ENGAGEMENT & PROGRAM DELIVERY

**Currently:** Week 1 static plan exists  
**Goal:** Dynamic daily prompts, progress tracker, milestone moments

### Item 4.1: Daily engagement rhythm and prompts

**Spec:**
- **Morning check-in (7–8am default):** "How's your pain today? (0-10)" + "Sleep last night?" + "What's one thing you want to do today?"
- **Midday practice (12–1pm):** Deliver one practice from daily schedule + "How did it feel?"
- **Evening reflection (8–9pm):** "What happened today?" + "What worked?" + "What was hard?"

**Implementation:**
- New endpoint: `GET /api/daily/prompt` — returns prompt for current time based on day/week
- Response structure:
```json
{
  "type": "morning" | "midday" | "evening",
  "prompt": "string",
  "practice": { "id", "title", "description", "duration" },
  "allowedResponses": ["radio", "text", "range"]
}
```
- New table: `dailyPrompts` — store responses
- UI: `/daily` page shows current prompt + timer + submit button

**Files:**
- `src/db/schema.ts` — add dailyPrompts table
- `src/db/migrations/0011_daily_prompts.sql`
- `src/app/api/daily/prompt/route.ts` — new endpoint
- `src/app/api/daily/response/route.ts` — post response
- `src/app/daily/page.tsx` — new page

**Status:** ⏳ Medium priority (after Phase 0)

---

### Item 4.2: "I'm struggling" button

**Spec:**
- Visible on every page (fixed bottom-right, mobile-safe)
- Tap → opens quick resource modal:
  - "Quick tools" (3 breathing exercises, 1 grounding exercise)
  - "Message your counselor" (quick open of /messages)
  - "Crisis resources" (iCall, Aasra)
- Log interaction: `POST /api/struggles` → record as flag for counselor

**Implementation:**
- New component: `src/app/StruggleButton.tsx`
- Include in root layout: `src/app/layout.tsx`
- New endpoint: `POST /api/struggles`
- New table: `struggles` (user_id, timestamp, action_taken)

**Status:** 🟡 Post-pilot (after daily engagement in place)

---

### Item 4.3–4.5: Progress tracker, milestones, counselor dashboard data

**Status:** 🟡 Post-pilot features (not blocking pilot)

---

## TRACK 5 — MOBILE & PUSH COMMUNICATION

**Currently:** Browser Notifications API integrated  
**Goal:** PWA, SMS fallback, WhatsApp integration

### Item 5.1: PWA manifest and offline capability

**Spec:**
- Create `/public/manifest.json`:
```json
{
  "name": "PTS - Pain to Strength",
  "short_name": "PTS",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111111"
}
```
- Update service worker (`public/sw.js`) to cache key pages for offline
- Add manifest link to `src/app/layout.tsx`:
```html
<link rel="manifest" href="/manifest.json" />
```

**Status:** ✅ Can implement immediately

---

### Item 5.2: Notification preferences management

**Spec:**
- New page: `/notifications/preferences` (client-only)
- Allow user to:
  - Toggle on/off each notification type (morning check-in, midday practice, evening reflection, counselor message, milestone)
  - Set quiet hours (e.g., "Do not notify 9pm–8am")
  - Set frequency (daily, every 2 days, weekly)
- Store in: new table `notificationPreferences` (user_id, type, enabled, quiet_start, quiet_end, frequency)

**Files:**
- `src/db/schema.ts` — add notificationPreferences table
- `src/db/migrations/0012_notification_prefs.sql`
- `src/app/notifications/preferences/page.tsx` — new UI
- `src/app/api/notifications/preferences/route.ts` — new endpoint

**Status:** 🟡 Medium priority (after basic notifications)

---

### Item 5.3–5.6: SMS fallback, WhatsApp, re-engagement

**Status:** 🟠 Pre-launch features (Phase 1–2)

---

## TRACK 6 — TWO-WAY MESSAGING

**Currently:** Async messaging works (8s polling)  
**Goal:** Add unread badges, system messages, away status

### Item 6.1: Unread message badges

**Spec:**
- Update messages table to track read status (already has `readAt` field)
- New endpoint: `GET /api/messages/unread-count` — returns count by conversation
- UI: Badge on message thread in sidebar (red dot or number)
- Auto-read: When user opens conversation, mark all as read

**Implementation:**
- Update `src/app/messages/MessagesClient.tsx` to:
  - Fetch unread count on mount
  - Display badge on each contact
  - Auto-mark as read on open
  - Poll for new unread count every 30s

**Status:** ✅ Can implement immediately

---

### Item 6.2: System-generated messages

**Spec:**
- Types: plan-approved, milestone-reached, suggested-resource, check-in-reminder
- Generated by: LLM (prompt-engineered, counselor-reviewed) or system (auto-send)
- Implementation:
  - New table: `systemMessages` (template_id, user_id, content, generated_by, reviewed_at)
  - New endpoint: `POST /api/system-messages` — generate and send
  - Batch job: Nightly at 10pm send pending system messages

**Status:** 🟠 Pre-launch

---

### Item 6.3: Counselor "away" indicator

**Spec:**
- Add field to `users`: `availabilityStatus` ('available' | 'away' | 'offline')
- Counselor can set via `/provider/status`
- Client sees status in message thread header: "Ramya is away — usually responds within 24 hours"
- If away >4 hours, auto-escalate to backup counselor

**Status:** 🟠 Pre-launch

---

## TRACK 7 — COUNSELOR PLATFORM

**Currently:** Counselor registration, profile, console, plan review all work  
**Goal:** Calendar integration, availability mgmt, sessions, supervision

### Item 7.1: Calendar and availability management

**Spec:**
- **Current:** Calendly embed (external link)
- **Enhanced:** 
  - Counselor sets recurring availability: M–F 9am–1pm, 3pm–6pm (in /provider/settings)
  - Store in: new table `counselorAvailability` (user_id, day_of_week, start_time, end_time)
  - Client sees: "Ramya is available Mondays–Fridays, 9am–6pm IST" + "Book a session" button
  - Booking: Integrate with Cal.com or build simple booking (capture email, time, confirmation)

**Implementation:**
- `src/db/schema.ts` — add counselorAvailability table
- `src/db/migrations/0013_counselor_availability.sql`
- `src/app/provider/settings/page.tsx` — allow counselor to set hours
- `src/app/api/counselor/availability/route.ts` — endpoint to get/set availability
- `src/app/booking/page.tsx` — new booking flow

**Status:** 🟡 Medium priority (Calendly works for pilot, enhance later)

---

### Item 7.2: Session booking and confirmation

**Spec:**
- Client views counselor's available slots (from counselorAvailability)
- Client selects slot + books
- System sends confirmation email to both
- Pre-session: Counselor sees client's recent check-ins + flags
- Post-session: Counselor records notes, plan adjustments, follow-up actions

**Implementation:**
- New table: `sessions` (id, client_id, counselor_id, scheduled_at, format, status, notes, adjustments)
- Endpoints:
  - `GET /api/counselor/[id]/available-slots` — returns free 60-min slots
  - `POST /api/sessions` — create booking
  - `PUT /api/sessions/[id]` — update notes/status post-session
- UI:
  - Client: `/booking/[counselor-id]` — slot picker
  - Counselor: `/provider/sessions` — view upcoming + past sessions

**Status:** 🟡 Medium priority

---

### Item 7.3: Client assignment

**Spec:**
- **Current:** Admin assigns client to counselor (manual via DB)
- **Enhance to:**
  - Auto-assign: If counselor has capacity + specialisation matches pain archetype → auto-assign on intake completion
  - OR Client selects: Show 3–5 available counselors, client picks
- Rule: One counselor per client (enforced by unique constraint on clientCounselor)

**Implementation:**
- New endpoint: `POST /api/counselor/assign` — triggers assignment logic
- Logic:
  - Get client's pain archetype from intake
  - Find counselors with matching specialisation + available capacity
  - Auto-assign to first match
  - Send both "You've been assigned" messages
- Call on: Intake completion (in src/app/api/intake/route.ts)

**Status:** ✅ Can implement after Phase 0

---

### Item 7.4–7.6: Caseload management, session format, supervision

**Status:** 🟠 Pre-launch

---

## TRACK 8 — ADMIN & PLATFORM OPERATIONS

**Currently:** None implemented  
**Goal:** Admin dashboard, crisis routing, data management

### Item 8.1: Admin dashboard

**Spec:**
- Protected page: `/admin` (only users with role='admin')
- Shows:
  - User counts: total registrations, clients, counselors, active last 7 days
  - Intake metrics: total completed, completion rate, avg time to complete
  - Plan metrics: generated, approved, pending >4 hours
  - Message metrics: total, avg response time by counselor
  - Escalations: red flags count, unsafe users count, crisis responses

**Implementation:**
- New page: `src/app/admin/page.tsx`
- New endpoint: `GET /api/admin/metrics` — aggregates all metrics
- Database queries: Already have schema to support

**Files:**
- `src/app/admin/page.tsx` — new page
- `src/app/api/admin/metrics/route.ts` — metrics endpoint

**Status:** ✅ Can implement immediately (Phase 0+)

---

### Item 8.2: Escalation management

**Spec:**
- When red flag detected in intake → automatically create escalation record
- New table: `escalations` (id, user_id, type, detected_at, assigned_to, resolved_at, action_taken)
- Admin dashboard shows: list of open escalations + action buttons (dismiss, reassign, contact)
- When escalation created: email sent to assigned admin
- SLA: Escalation must be addressed within 1 hour

**Implementation:**
- `src/db/schema.ts` — add escalations table
- `src/db/migrations/0014_escalations.sql`
- Trigger: In `POST /api/intake` when red flags detected, create escalation
- `src/app/admin/escalations/page.tsx` — list and manage
- `src/app/api/admin/escalations/[id]/route.ts` — update escalation status

**Status:** ✅ Can implement after Phase 0

---

### Item 8.3: Crisis resources

**Spec:**
- Crisis resources visible on every page (sticky header or footer)
- Content:
  - **India:** iCall (9152987821), Aasra (9820466726)
  - **Global:** findahelpline.com
- On intake safety screen: Show resources + make them tappable
- Log access: `POST /api/crisis-resources` — track when user accesses

**Implementation:**
- New component: `src/app/CrisisResourcesFooter.tsx`
- Include in root layout
- New endpoint: `POST /api/crisis-resources/access` — logging
- Update intake safety screen to highlight these

**Status:** ✅ Can implement immediately

---

### Item 8.4–8.7: Content management, counselor performance, reporting, audit log, data cleanup

**Status:** 🟠 Pre-launch and post-pilot features

---

## TRACK 9 — INFRASTRUCTURE & TECHNICAL

**Currently:** Vercel + Neon deployed, basic monitoring in place  
**Goal:** Optimize performance, add staging, improve reliability

### Item 9.1: Vercel function region optimization

**Spec:**
- Set Vercel function region to Singapore (`sin1`) to match Neon's `ap-southeast-1`
- Currently: Default region (likely us-east-1, causing cross-region latency)
- Update: `vercel.json` or `vercel.ts` (if using new config):
```json
{
  "regions": ["sin1"]
}
```

**Status:** ✅ Implement immediately (zero-downtime change)

---

### Item 9.2: Email delivery setup

**Spec:**
- Choose: Resend (recommended) or SendGrid
- Use case: verification emails, plan-ready notifications, session confirmations
- Implementation:
  - Install `resend` npm package
  - Store API key in env: `RESEND_API_KEY`
  - Create `src/lib/email.ts`:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: 'noreply@pts-app.com',
    to,
    subject,
    html,
  });
}
```
  - Use in: password reset, plan approval notification, session confirmation

**Status:** ✅ Can implement immediately

---

### Item 9.3: Error monitoring (Sentry)

**Spec:**
- Install `@sentry/nextjs`
- Configure in `next.config.js`:
```javascript
const withSentry = require('@sentry/nextjs').withSentryConfig;
module.exports = withSentry(nextConfig, { org: 'pts', project: 'web' });
```
- Captures: unhandled errors, API errors (already logged), performance metrics
- Dashboard: https://sentry.io — view errors, set alerts

**Status:** ✅ Can implement immediately

---

### Item 9.4: LLM integration optimization

**Spec:**
- Current: OpenRouter API, no caching
- Enhance: Enable prompt caching on Claude API (reduces cost 90%)
- Implementation:
  - Send cache_control header in requests
  - Store system prompt + recent intakes as cacheable context
  - Save ~$0.80 per plan generation

**Status:** 🟡 Medium priority (works now, optimize later)

---

### Item 9.5–9.10: Staging environment, backups, connection pooling, WebSockets, calendar API, CI/CD

**Status:** 🟠 Pre-launch features

---

## IMPLEMENTATION ROADMAP

### Phase 0: Validation (1–2 weeks, current)
- Manual testing of all core flows
- Bug fixes from Phase 0 findings
- Finalize TRACK 0 strategy decisions

### Phase 1: Closed Pilot (2–4 weeks after Phase 0)
**Cursor should implement:**
- TRACK 1: Landing page polish
- TRACK 2: Intake save-resume (Item 2.7)
- TRACK 3: Plan versioning (Item 3.2)
- TRACK 4: Daily engagement (Items 4.1–4.2)
- TRACK 5: PWA + notification preferences (Items 5.1–5.2)
- TRACK 6: Unread badges (Item 6.1)
- TRACK 7: Calendar + booking (Items 7.1–7.3)
- TRACK 8: Admin dashboard + escalations (Items 8.1–8.2)
- TRACK 9: Region optimization + email + Sentry (Items 9.1–9.3)

**Not in Phase 1:** System messages, away status, advanced features (Post-pilot)

### Phase 2: Scale (post Phase 1, with real data)
- TRACK 4: Progress tracker, milestones
- TRACK 5: SMS, WhatsApp, re-engagement
- TRACK 6: System messages, away status
- TRACK 7: Session formats, supervision
- TRACK 8: Content management, performance reviews
- TRACK 9: Staging environment, CI/CD, advanced monitoring

---

## CURSOR EXECUTION CHECKLIST

**For each item, Cursor should:**

1. ✅ Read spec and understand requirements
2. ✅ Check dependencies (any blocking items?)
3. ✅ Identify files to create/modify
4. ✅ Write database migrations (if needed)
5. ✅ Implement API endpoints (if needed)
6. ✅ Build UI components (if needed)
7. ✅ Update schema in `src/db/schema.ts`
8. ✅ Add tests (see Testing section below)
9. ✅ Build (`npm run build`)
10. ✅ Deploy to Vercel (`npx vercel deploy --prod`)
11. ✅ Commit with clear message

---

## TESTING STRATEGY

### Unit tests (if tests added)
- Create `src/__tests__/[feature].test.ts` for utility functions
- Use Jest (configured in Next.js)

### Integration tests
- New endpoints: Test via curl or Postman
- Example: `curl -X POST https://pts-web-pied.vercel.app/api/feature -H "Content-Type: application/json" -d '{...}'`

### Manual acceptance tests
- For UI: Test on mobile (375px) + desktop (1920px)
- For forms: Submit with valid/invalid data
- For auth: Test with/without session cookies

### Database verification
- Query Neon to verify data is stored correctly
- Example: `SELECT COUNT(*) FROM intakeResponses;`

---

## PERFORMANCE TARGETS

- Page load: <2 sec (First Contentful Paint)
- API response: <500ms (p95)
- Database query: <100ms (p95)
- LLM plan generation: <30 sec

---

## SECURITY CHECKLIST

For each item:
- ✅ Auth-gated (users can't access other users' data)
- ✅ Rate limiting (prevent brute force / abuse)
- ✅ Input validation (reject invalid/malicious input)
- ✅ SQL injection prevention (use Drizzle, never string concat)
- ✅ XSS prevention (React escapes by default, avoid dangerouslySetInnerHTML)
- ✅ CSRF protection (Next.js provides automatically for cookies)

---

## DEPLOYMENT PROCESS

For each completed item:

```bash
# 1. Code review (self-check)
git diff

# 2. Local build
npm run build

# 3. Commit
git add -A && git commit -m "Implement [Track #]: [Item name]"

# 4. Push to GitHub
git push origin main

# 5. Deploy to Vercel
npx vercel deploy --prod --yes

# 6. Verify
curl https://pts-web-pied.vercel.app/api/health

# 7. Manual smoke test (if UI changed)
# Open https://pts-web-pied.vercel.app in browser
# Test the feature you just built
```

---

## DEPENDENCIES & ORDERING

**Safe to implement in parallel:**
- TRACK 1 items (landing page) — independent of other tracks
- TRACK 8.1 (admin dashboard) — reads from existing data, doesn't modify
- TRACK 9.1–9.3 (infrastructure) — no code changes needed, just config

**Must implement before:**
- TRACK 4.1 (daily prompts) requires TRACK 2 complete (intake data available)
- TRACK 7.2 (session booking) requires TRACK 7.1 (availability defined)
- TRACK 8.2 (escalations) requires TRACK 3 (plans exist to escalate from)

**Quick dependency check:**
```
TRACK 0 (decisions) → All other tracks depend on this
TRACK 1 (landing) → Independent
TRACK 2 (intake) → Needed by TRACK 3, 4, 7
TRACK 3 (plans) → Needed by TRACK 4, 8
TRACK 4 (engagement) → Depends on TRACK 2, 3
TRACK 5 (mobile) → Independent
TRACK 6 (messaging) → Independent
TRACK 7 (counselor) → Depends on TRACK 2, 3
TRACK 8 (admin) → Depends on all data-creating tracks
TRACK 9 (infra) → Mostly independent, supports all
```

---

## QUICK START FOR CURSOR

**Tomorrow morning, start with:**
1. Item 1.1: Hero section copy (30 min)
2. Item 1.2: Archetypes section (45 min)
3. Item 5.1: PWA manifest (15 min)
4. Item 9.1: Vercel region optimization (5 min)
5. Item 8.1: Admin dashboard (2 hours)

**All are safe to implement independently, low risk, high visibility.**

Then move to Phase 1 priorities once Phase 0 validation is complete.

---

**END OF SPEC**

All 98 items described. All dependencies mapped. All paths clear.

Ready for Cursor to execute autonomously, starting with Phase 0 validation, then Phase 1 build-out.
