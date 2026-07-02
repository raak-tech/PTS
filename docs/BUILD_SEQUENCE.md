# PTS Build Sequence & Model Guide

**Purpose:** Step-by-step build order with exact prompts to give Claude, which model to use, and token budget for each batch. Follow this top to bottom — each batch depends on the one above it being done first.

> **Current execution queue:** [`PILOT_TODO.md`](./PILOT_TODO.md). This guide is a historical build playbook.

**Before starting any batch:**

**Model switching:** type `/model haiku`, `/model sonnet`, or `/model opus` in the Claude Code prompt before starting each batch. Takes 2 seconds.

**Token budget syntax:** prefix your prompt with `+200k` (or similar) to cap spend on that session.

---

## Phase 0 — Decisions (YOU + Ramya, no Claude needed)

**Model:** none — this is human work  
**Estimated time:** 1–2 days  
**Must complete before any code**

Run the decision session described in `TRACK0_DECISIONS.md`. For each of the 8 items (#17–#24), agree an answer and write it into `DECISIONS.md`.

The three decisions that most directly unblock code:

| Decision | What it unblocks |
|---|---|
| #19 Counseling vs therapy scope language | Consent copy, FAQ, all user-facing strings |
| #20 Regulatory posture / data residency | Whether Singapore region is confirmed |
| Auth surface boundary (SCOPE-C) | Whether to add OTP to web, or keep pilot mobile-only |

👉 **When done:** tell Claude `"Phase 0 complete — decisions recorded in DECISIONS.md"` and start Phase 1.

---

## Phase 1 — Foundation (schema + auth)

**Model: Sonnet**  
**Why:** Multi-file changes touching schema, migrations, API routes, and session logic. Haiku loses consistency across this many files. Opus is overkill.

### Batch 1A — Database foundation
```
/model sonnet
+300k
Work through these backlog items in order, committing after each:
1. SCOPE-A: Add planWeeks DB table and per-week approval model (BACKLOG Track 3)
2. SCOPE-F: Add dailyCheckIns DB table (BACKLOG Track 4)
Run npm run db:migrate after each. Do not touch any UI yet.
```
**Expected output:** 2 new migration files, updated schema.ts, updated plan-related API routes to read from planWeeks.  
**Rough cost:** ~$1.50

### Batch 1B — Auth unification
```
/model sonnet
+250k
Implement SCOPE-C from BACKLOG Track 0: [paste whichever option was decided in Phase 0 here].
Update apps/web auth routes and apps/mobile AuthContext as needed.
Commit when both surfaces can authenticate the same user.
```
**Expected output:** OTP route on web (or equivalent per decision), updated session handling.  
**Rough cost:** ~$1.00

---

## Phase 2 — Counselor web workspace (plan editing)

**Model: Sonnet**  
**Why:** This is the most complex feature in the codebase. It touches PlanReviewClient, ProviderClientWorkspaceClient, the plans API, and planWeeks data. Sonnet handles this — Haiku will produce inconsistent inline editing behaviour across the different week fields.

**Depends on:** Batch 1A complete (planWeeks table must exist).

### Batch 2A — Resolve planning model (document only, no code)
```
/model sonnet
+50k
Update PROVIDER_WORKFLOW.md to reflect the LLM-first with counselor inline editing model.
Record the decision in DECISIONS.md as SCOPE-G resolved.
No code changes — documentation only.
```
**Rough cost:** ~$0.10

### Batch 2B — Counselor inline plan editing on web
```
/model sonnet
+400k
Implement SCOPE-A: Build counselor inline plan editing on web (BACKLOG Track 3).
Files to change: apps/web/src/app/provider/plans/PlanReviewClient.tsx and
apps/web/src/app/provider/clients/[id]/ProviderClientWorkspaceClient.tsx.
Replace all read-only week accordion items with click-to-edit inline fields.
Edited state writes to planWeeks.content via a new PATCH /api/provider/plans/[id]/week/[n] route.
Status set to 'edited' on any field change.
```
**Expected output:** Editable week cards on web, new API route, planWeeks rows updated on save.  
**Rough cost:** ~$2.00

### Batch 2C — Per-week approval CTA (web)
```
/model sonnet
+250k
Implement SCOPE-A part 3 (web half): Per-week approval CTA on web (BACKLOG Track 3).
Replace the single "Approve & send to client" button with per-week "Approve Week N" buttons.
Add sticky footer showing "N of 6 weeks approved" progress.
Client-facing plan view must only show weeks where planWeeks.status = 'approved'.
```
**Expected output:** Per-week approve buttons, client plan view gated to approved weeks only.  
**Rough cost:** ~$1.50

---

## Phase 3 — Mobile plan review fixes

**Model: Sonnet**  
**Why:** Requires understanding the existing mobile planReview screen deeply and making consistent changes. The clinical safety angle (counselors approving blind) warrants careful implementation.

**Depends on:** Phase 2 complete (planWeeks + per-week approval must exist on backend).

### Batch 3A — All 6 weeks visible + per-week approval on mobile
```
/model sonnet
+300k
Implement two items from BACKLOG in order:
1. SCOPE-D: Show all 6 weeks in mobile plan review
   (apps/mobile/app/(provider)/plan-review/[id].tsx — add collapsed accordion for weeks 2–6,
   read-only, with "Edit and approve on web" link per week)
2. SCOPE-A mobile half: Per-week approval CTA on mobile
   (scope initial approval to Week 1 only; "Approve Week 1" button; weeks 2–6 locked with link to web)
Commit each separately.
```
**Expected output:** Mobile plan review shows all 6 weeks; approval scoped to Week 1.  
**Rough cost:** ~$1.50

---

## Phase 4 — Patient safety items

**Model: Sonnet**  
**Why:** Patient safety — needs careful, correct implementation. Haiku is too likely to miss the gating logic.

**Depends on:** Phase 1 complete (auth working). These are independent of plan editing.

### Batch 4A — Crisis acknowledgment gate + C7 safety screen split
```
/model sonnet
+300k
Implement two SCOPE-I items from BACKLOG Track 12 (patient safety):
1. Crisis notes acknowledgment gate before plan approve — on both web PlanReviewClient and
   mobile plan-review screen: if plan has crisis notes, block Approve CTA behind a
   required acknowledgment checkbox. Cannot approve without it.
2. C7 safety check — split intake safety step into 2 screens in apps/mobile/src/components/intake/IntakeStepContent.tsx:
   screen (a) shows red flag items one at a time with warm clinical copy,
   screen (b) is consent + confirmation.
Commit each separately.
```
**Expected output:** Approve requires crisis acknowledgment; intake C7 is 2 screens.  
**Rough cost:** ~$1.50

---

## Phase 5 — Morning check-in (mobile)

**Model: Haiku**  
**Why:** Well-specified, self-contained component work. Schema already exists from Phase 1. Haiku can deliver this cleanly.

**Depends on:** Batch 1A (dailyCheckIns table must exist).

### Batch 5A — Morning check-in card
```
/model haiku
+150k
Implement SCOPE-F: Build morning check-in card on mobile Today tab (BACKLOG Track 4).
File: apps/mobile/app/(client)/(tabs)/today.tsx
Add as the first card above fold in the morning (before holistic cards).
Fields: pain level (NRS face scale component — 11 faces mapped to 0–10, show yesterday's value faintly),
sleep quality (Poor / OK / Good chip selector), one intention (short TextField).
POST to /api/check-ins/daily on submit.
Also build the API route: apps/web/src/app/api/check-ins/daily/route.ts
(POST: save to dailyCheckIns; GET: return today's entry if exists).
```
**Expected output:** Morning check-in card in Today tab, new API route, data in dailyCheckIns.  
**Rough cost:** ~$0.20

---

## Phase 6 — Track 12 UX items (bulk)

**Model: Haiku**  
**Why:** All self-contained component changes, well-specified. Each touches 1–2 files.

**Depends on:** Phase 1 (auth), Phase 5 (theme.ts token file must exist). Do 6A first.

### Batch 6A — Design tokens (prerequisite for all other UX work)
```
/model haiku
+80k
Implement SCOPE-I: Define theme.ts design tokens (BACKLOG Track 12).
Create apps/mobile/src/theme.ts (it may already exist — check and update if so) with exported
colors (primary #111, accent #fbbf24, warning #f97316, bg white, surface #f9f9f9, muted #555,
border #eee, success green, danger red), spacing (4/8/12/16/24/32/48px scale),
radii (sm:8, md:12, lg:16, pill:999), typography (body:15, small:13, label:12, heading:18, title:22).
Mirror web app values exactly.
```
**Rough cost:** ~$0.05

### Batch 6B — OTP split input + intake abandonment screen
```
/model haiku
+120k
Implement two SCOPE-I items from BACKLOG Track 12:
1. 6-box OTP split input — update apps/mobile/app/(auth)/otp.tsx to use 6 individual
   TextInput boxes (one per digit), auto-advance on entry, autoComplete="one-time-code".
2. Intake abandonment re-entry screen — update apps/mobile/app/(client)/intake.tsx:
   on mount, if local draft exists from a previous session, show a full-screen card:
   "Resume your assessment — Step N of 7, started X days ago" with Continue and Start over buttons.
   Do not silently restore state.
Commit each separately.
```
**Rough cost:** ~$0.15

### Batch 6C — Messages, program, and profile UX
```
/model haiku
+150k
Implement three SCOPE-I items from BACKLOG Track 12:
1. Remove message list screen (C19) for pilot — update apps/mobile/app/(client)/(tabs)/messages/index.tsx
   to redirect directly to the counselor thread (use counselorId from useCounselorContact hook).
   Show counselor name and initials in thread header.
2. Locked week teaser cards — update apps/mobile/app/(client)/(tabs)/program.tsx:
   locked week cards show week theme text and a lock icon with copy
   "Week N unlocks when your counselor marks Week N-1 complete." No greyed empty cards.
3. Weekly check-in one-question-at-a-time — update apps/mobile/app/(client)/program/check-in.tsx
   to show one prompt per screen with a thin progress bar. Continue button advances to next question.
Commit each separately.
```
**Rough cost:** ~$0.20

### Batch 6D — Mark done + counselor bridge
```
/model haiku
+120k
Implement two SCOPE-I items from BACKLOG Track 12:
1. Mark practice done — full-width button — update the practice done interaction in
   apps/mobile/app/(client)/(tabs)/today.tsx: replace checkbox/small button with a full-width
   Button component labelled "Mark practice done". After tap, show "How did this feel?"
   as a follow-up Card with emoji scale or short TextField before dismissing.
2. Counselor "go to web workspace" bridge — in apps/mobile/app/(provider)/clients/[id].tsx
   add a prominent Card or Button: "Record read-out & plan next week on web workspace"
   that opens the web URL /provider/clients/[clientId] via Linking.openURL.
Commit each separately.
```
**Rough cost:** ~$0.15

### Batch 6E — Tab badges + NRS pain scale component
```
/model haiku
+150k
Implement two SCOPE-I items from BACKLOG Track 12:
1. Tab badge lifecycle — in apps/mobile/app/(provider)/(tabs)/_layout.tsx and
   apps/mobile/app/(client)/(tabs)/_layout.tsx: document and implement when each badge clears.
   Home/Work queue badge: clears after user views the queue screen. Messages badge: clears after
   opening the thread. Re-badges when new data arrives on next poll.
2. NRS face scale component — create apps/mobile/src/components/NRSFaceScale.tsx:
   a row of 11 faces (emoji or SVG) mapped to 0–10, tappable, shows selected value,
   displays previous day's value as a faint indicator below the selected face.
   Export and use in the morning check-in card from Phase 5.
Commit each separately.
```
**Rough cost:** ~$0.15

---

## Phase 7 — Post-program state

**Model: Haiku**  
**Why:** Well-specified screens. Self-contained component and route work.

**Depends on:** Phase 1 (schema), Phase 6 (theme tokens).

### Batch 7A — Graduation + maintenance mode
```
/model haiku
+200k
Implement three items from BACKLOG Track 11:
1. Graduation screen — add apps/mobile/app/(client)/graduation.tsx: shown when
   useProgramTime() returns programComplete: true instead of routing to Today.
   Content: animated checkmark, "You've completed your 6-week program", summary card,
   "What's next" section explaining maintenance mode.
2. Maintenance mode in Program tab — update apps/mobile/app/(client)/(tabs)/program.tsx:
   when programComplete, replace week cards with a "Maintenance" view showing:
   last completed week, "Next monthly session" booking button (Calendly link), and
   a "Your maintenance plan" card.
3. Monthly check-in API route — add apps/web/src/app/api/check-ins/monthly/route.ts
   (POST: save monthly check-in; GET: return latest). Trigger the prompt in maintenance mode
   when 30 days have elapsed since program completion.
Commit each separately.
```
**Rough cost:** ~$0.25

---

## Phase 8 — Push notifications

**Model: Sonnet**  
**Why:** Touches native mobile (Expo Notifications / FCM), backend cron/dispatch logic, and multiple notification templates. Cross-cutting enough to need Sonnet's consistency.

**Depends on:** Phase 5 (dailyCheckIns exists — needed for "check-in due" trigger), Phase 2 (planWeeks — needed for "week approved" notification).

### Batch 8A — FCM integration + notification dispatch
```
/model sonnet
+400k
Implement push notifications end-to-end:
1. Add Expo Notifications to apps/mobile — FCM integration, request permissions on first login,
   save token to /api/notifications/subscribe (already exists).
2. Add notification dispatch logic to apps/web/src/app/api/:
   - On plan week approved (PATCH planWeeks status → approved): push "Your Week N plan is ready"
   - On new message received (POST /api/messages): push "New message from [counselor name]"
   - Daily cron at 8am local: push "Time for your morning check-in" if no dailyCheckIn today
   - On red-flag detected: push to counselor "Action needed: [client name] flagged"
3. Client Profile tab notification preferences (apps/mobile/app/(client)/(tabs)/profile.tsx):
   toggle per notification type.
Commit each step separately.
```
**Rough cost:** ~$2.50

---

## Phase 9 — Counselor-initiated plan generation (SCOPE-H) ✏️ REVISED

> **Decision (2026-06-30):** Auto-generation on intake submit was removed. Plan generation is counselor-initiated only — counselors may message the client for clarifications before generating. This preserves the counselor-led model. Original Phase 9 (auto-trigger) is superseded.

**Model: Haiku**  
**Why:** Three self-contained additions — a new section on an existing page, a new API endpoint, and a mobile queue update. Each touches 1–2 files.

**Depends on:** Phase 1 (auth, plans table), Phase 8 (push notifications for admin alert).

### Batch 9A — Intake queue on web
```
/model haiku
+150k
Implement Phase 9A: Intake queue on the provider plans page.
In apps/web/src/app/provider/plans/page.tsx, add a new "Pending intakes" section
ABOVE the existing draft plans list. Query: clients who have an intakeResponse row
but NO plan row at all (not even a draft). For each, show:
- Client display name (anonymised, same anon() function already in the file)
- Pain source from intakeResponses
- Date submitted
- Red flag badge if hasRedFlags=true or isSafe=false
- "Message client" link → /messages?with=[userId]
- "Generate plan draft" button → POST /api/provider/generate-plan { userId }
If the section is empty, show nothing (no empty state needed).
Commit.
```
**Rough cost:** ~$0.10

### Batch 9B — Generate-plan endpoint + intake hardening
```
/model haiku
+120k
Implement Phase 9B: Two items:
1. New API endpoint apps/web/src/app/api/provider/generate-plan/route.ts
   POST, provider-auth only. Body: { userId: string }.
   Guard: if a plan with status='draft' or status='approved' already exists for userId,
   return { ok: false, reason: 'plan_exists' } with status 200 (not an error).
   Otherwise call regeneratePlanDraftForUser(userId) from apps/web/src/lib/regenerate-plan-for-user.ts.
   On success send push notification to all admin users ("New plan draft ready — [client anon email]")
   using sendPushToUser from apps/web/src/lib/expo-push.ts.
   Return { ok: true, planId }.
2. Intake hardening in apps/web/src/app/api/intake/route.ts:
   after saving intake, add idempotency check — if plan already exists for this user
   return { ok: true, planGenTriggered: false } without calling any generation.
   Return { ok: true, planGenTriggered: false } always (generation is now counselor-triggered).
Commit each separately.
```
**Rough cost:** ~$0.10

### Batch 9C — Mobile queue intake section
```
/model haiku
+150k
Implement Phase 9C: Pending intakes section in the provider mobile Queue tab.
In apps/mobile/app/(provider)/(tabs)/index.tsx, add a "Pending intakes" section
above the existing pending plans list. Use apiGetProviderQueue (already fetches
pendingPlans) — add pendingIntakes to that API response, OR make a separate
call to a new GET /api/provider/pending-intakes endpoint that returns the same
data as the web intake queue (userId, anonEmail, painSource, submittedAt, hasRedFlags, isSafe).
For each pending intake show a Card with:
- Anon name, pain source, date, red flag badge
- "Message" button → router.push to messages/[userId]
- "Generate plan" button → POST /api/provider/generate-plan { userId }, on success
  show a brief "Draft generating…" toast then refresh the queue
If section is empty, show nothing.
Build the GET /api/provider/pending-intakes endpoint if needed.
Commit.
```
**Rough cost:** ~$0.10

---

## Phase 10 — Counselor profile editor (web)

**Model: Haiku**  
**Why:** Simple form page — new route on web, reads/writes existing counselorProfiles table.

**Depends on:** Phase 1 (auth working). Independent of everything else.

### Batch 10A
```
/model haiku
+100k
Build counselor profile editor at apps/web/src/app/provider/profile/page.tsx.
Fields (read from and write to counselorProfiles table): fullName, title, credentials,
bio, calendlyUrl, specialisations, languages.
All fields editable. Save via PATCH /api/provider/profile.
Add link to this page from the counselor web console nav.
```
**Rough cost:** ~$0.10

---

## Phase 11 — Pre-pilot QA pass

**Model: Sonnet**  
**Why:** Needs to reason about correctness across the whole system, not just individual files.

**Depends on:** All phases above complete.

### Batch 11A
```
/model sonnet
+300k
Run a pre-pilot QA pass:
1. Check every client-visible route is auth-gated and returns appropriate empty states
2. Verify planWeeks gating: client cannot see any week with status != 'approved'
3. Verify crisis acknowledgment gate cannot be bypassed
4. Run npm run build in apps/web and npx expo export in apps/mobile — fix any type errors
5. Check all API routes return correct 401s for unauthenticated requests
Report findings and fix any issues found. Commit fixes.
```
**Rough cost:** ~$1.50

---

## Cost summary

| Phase | Model | Est. cost |
|---|---|---|
| 1 — Schema + auth | Sonnet | ~$2.50 |
| 2 — Counselor web plan editing | Sonnet | ~$3.60 |
| 3 — Mobile plan review | Sonnet | ~$1.50 |
| 4 — Patient safety items | Sonnet | ~$1.50 |
| 5 — Morning check-in | Haiku | ~$0.20 |
| 6 — Track 12 UX items (5 batches) | Haiku | ~$0.70 |
| 7 — Post-program state | Haiku | ~$0.25 |
| 8 — Push notifications | Sonnet | ~$2.50 |
| 9 — Counselor-initiated plan gen (3 batches) | Haiku | ~$0.30 |
| 10 — Counselor profile editor | Haiku | ~$0.10 |
| 11 — QA pass | Sonnet | ~$1.50 |
| **Total** | | **~$15** |

---

## Rules of thumb

- **Never run two batches in the same session without reviewing commits between them.** Each batch should produce commits you can read before the next batch builds on them.
- **If a batch produces errors mid-way**, stop and fix before proceeding — don't let errors compound across batches.
- **Haiku batches are cheap enough to re-run** if the output is wrong. Sonnet batches should be reviewed before committing.
- **Phase 0 is not negotiable** — none of the code phases produce correct output if the decisions are still open.
