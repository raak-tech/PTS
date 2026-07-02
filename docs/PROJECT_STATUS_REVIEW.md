# PTS Project Status Review

**Date:** 2026-06-30 (gap analysis) · **Model update:** 2026-07-02  
**Scope:** Full codebase + docs review — no code changes  
**Audience:** Satheesh, Ramya  

> **Execution todos:** consolidated in [`PILOT_TODO.md`](./PILOT_TODO.md). This doc is gap analysis / recommendations only.
>
> **2026-07-02 — Week-1-first model (canonical):** Initial LLM generate produces **Week 1 only**; Weeks 2–6 are gated per-week with counselor comment before each generate. Counselor approves **one week at a time** (no bulk approve). See `PROVIDER_WORKFLOW.md` v1.1 and `DECISIONS.md` 2026-07-02.

---

## Part 1: Where we are — an honest summary

### What is production-deployed (pts-web-pied.vercel.app)

The web app is live and functional for a controlled pilot. It has:

- Full email/password auth (register, login, session, password reset)
- 7-step guided intake with red-flag routing and consent
- LLM plan generation (Claude API via OpenRouter) — 6-week structured program with holistic blocks (Ayurveda, yoga, music), daily practices, weekly reflections, and counselor read-out templates
- Client-facing: plan view, daily checklist, weekly check-in, messaging with counselor
- Counselor web console: client list, plan review + approval, engagement dashboard, per-client workspace with AI week regeneration, daily read-out editor with audio recording
- Admin dashboard: platform metrics, client dossier, safety flags, music catalog management
- Safety infrastructure: crisis banner on every page, red-flag gating, consent-gated artifact storage

### What exists in the mobile app (apps/mobile — Expo, not yet shipped)

The Expo app is scaffolded and has meaningful code built. It covers:

**Client role:**
- OTP phone login (phone check → OTP → session with JWT bearer)
- Full intake flow (7 steps, save-and-resume)
- Waiting for plan screen
- Today tab: morning focus (holistic cards + read-out + calendar builder), evening check-in (feedback + reflection), practice marking, counselor audio player, voice read-out submission
- Program tab: 6-week overview with week cards (locked/current/complete) + weekly check-in + Calendly booking
- Messages: direct thread with counselor
- Profile: data/consent, flare-up protocol, safety guidelines, sign out
- "I'm struggling" FAB component (built, placement TBD)

**Counselor role:**
- Work queue home: red-flag escalations, pending plans, unread messages, daily engagement needs-attention list
- Client list with status chips
- Plan review: client context, Week 1 content, holistic block toggles, regenerate, approve
- Client detail page
- Engagement dashboard
- Messages thread per client
- Profile tab (basic)

**Infrastructure:**
- Theme system (dark/light), design tokens in `theme.ts`
- Shared component library: Button, Card, Screen, TextField, AppHeader, CrisisBar, HitTarget
- API layer (`src/lib/api.ts`) covering all endpoints
- `useProgramTime` hook computing week/day/time-of-day from `programStartedAt`
- Holistic cards (Ayurveda, yoga, music) fully built and wired into Today and plan review

### Maturity assessment by area

| Area | Web | Mobile | Notes |
|------|-----|--------|-------|
| Auth | Complete | Built (OTP only) | Different mechanisms — web email/pw, mobile OTP |
| Intake | Complete | Built | Mobile mirrors web 7-step flow |
| Plan generation | Complete | Via web API | Mobile calls same backend |
| Client daily loop | Functional | Built | Mobile has more features (audio, calendar) than web |
| Holistic blocks | Complete | Complete | Ayurveda, yoga, music all live in both |
| Client messaging | Functional | Built | Both poll-based |
| Counselor plan review | Complete (web richer) | Partial (Week 1 only) | Mobile misses Weeks 2–6 and full content |
| Counselor week regeneration | Complete (web only) | Not on mobile | AI week planning is web-exclusive |
| Counselor read-out audio | Complete (web only) | Player only, no recorder | Recording stays web for now |
| Counselor engagement view | Complete | Basic | Mobile view is simpler than web |
| Admin | Complete | Not on mobile | Intentional — admin stays web |
| Push notifications | Backend exists | Not wired | `pushSubscriptions` table exists, no FCM yet |
| Post-program continuation | Not built | Not built | Nothing exists past Week 6 in either surface |
| Monthly review / re-plan | Not built | Not built | Defined in prior conversations, not implemented |

---

## Part 2: Counselor web vs. mobile — a direct comparison

This is the most important surface asymmetry. The counselor has two interfaces — web is significantly richer.

### Counselor web has exclusively:

**1. AI week regeneration (`/provider/clients/[id]` workspace)**
The counselor can trigger an LLM-authored Week N+1 draft using the client's current engagement data (read-out responses, calendar completion, holistic card completion, weekly summary). Review the draft, then one-click apply it to the live plan. This is the core adaptive loop that drives clinical value — it is **web-only** and missing from the mobile spec entirely.

**2. Daily read-out audio recording**
The `CounselorReadOutEditor` (web) allows the counselor to record their voice and attach it to the daily read-out template. Clients hear the counselor's voice through the `CounselorAudioPlayer` in the mobile app. The recording flow exists only on web.

**3. Full plan content review**
The web plan review shows the full generated plan (all 6 weeks with accordion). The mobile plan review shows only Week 1 content. A counselor approving a plan on mobile cannot see what Weeks 2–6 look like.

**4. Per-client weekly data summary**
The workspace shows: reinforcement response count, calendar blocks done/skipped, scheduling insights (e.g. "client consistently skips afternoon blocks"). This granular view is web-only.

**5. Admin client dossier**
Full intake fields, plan history, safety flags, all artifacts — accessible at `/admin/clients/[id]`. Mobile has no equivalent.

**6. Platform metrics**
Admin dashboard at `/admin`. Mobile has no metrics view.

### Assessment
The asymmetry is appropriate for now — the counselor's deep clinical work (audio recording, week planning, full plan review) belongs on a larger screen. The mobile gives the counselor their action queue (review plan, reply to messages, check engagement) but not the workspace. This is the right split **if** the counselor knows to open the web app for deep work. The gap to close is making the mobile queue a better trigger to the web workspace, not trying to replicate web features on mobile.

---

## Part 3: Recommendation areas for deeper dive

Ordered by impact, not complexity.

---

### 1. Mobile plan review is too thin for meaningful clinical oversight

**The gap:** The counselor is being asked to approve a full 6-week plan on mobile while only seeing Week 1. They cannot assess whether Weeks 3–6 are clinically appropriate, whether holistic blocks fit the client's situation, or whether the progression is sensible.

**Why it matters:** Plan approval is a patient-safety gate. A counselor approving blind is worse than no approval gate.

**What's needed:**
- All 6 weeks visible in the mobile plan review — use an accordion (collapsed by default, per the UX review recommendation)
- Watch points and key themes visible (already in the `GeneratedPlan` type: `watchPoints`, `keyThemes`)
- The crisis-notes acknowledgment gate (flagged in MOBILE_UX_REVIEW.md)

---

### 2. No post-program state — the app has no life after Week 6

**The gap:** When `computeProgramTime()` returns `programComplete: true`, the Program tab shows "Program complete — review your weeks anytime" and Today tab has no clear state. There is no continuation, graduation, or re-engagement flow in either surface.

**Why it matters:** For the pilot, clients finishing Week 6 will open the app and find an empty state. The counselor has no mechanism to extend, graduate, or transition the client. This is a retention cliff.

**What's needed** (the monthly review model discussed previously):
- A **graduation screen** at Week 6 completion: acknowledges progress, frames the shift to maintenance mode
- A **monthly cadence** API and UI: monthly check-in replacing weekly, monthly session booking prompt
- A **plan extension** flow: counselor can either (a) approve a continuation plan (lighter, 4-week) or (b) mark client as "maintenance mode" with monthly check-ins only
- Mobile program tab state post-Week-6: replace week cards with a "maintenance mode" view showing last check-in and next monthly session

These requirements were outlined in the prior conversation but nothing is built yet.

---

### 3. Morning check-in as a structured clinical touchpoint is missing

**The gap:** The `MOBILE_APP_UX.md` spec defines Screen C11 (pain 0–10, sleep quality, intention) as a morning check-in. The mobile Today tab has morning focus cards (holistic, read-out, calendar) but no structured pain/sleep/intention capture. The daily engagement data the counselor sees (`calendarBlocksDone`, `reinforcementRecordedToday`) contains no morning symptom data.

**Why it matters:** Pain level tracking over time is the core clinical signal. Without it, the counselor's engagement dashboard is engagement-only, not clinical-outcome-linked. Weekly check-ins alone are too sparse.

**What's needed:**
- A simple morning check-in card (first thing on Today tab): pain 0–10 (NRS face scale per UX review), sleep quality, one intention
- Store to DB: `dailyCheckIns` table (date, painLevel, sleepQuality, intention)
- Surface on counselor engagement dashboard: sparkline of pain levels over the week per client

---

### 4. The counselor's mobile experience lacks a clear "go to web" bridge

**The gap:** The mobile counselor experience is action-oriented (queue → review → approve → message). This is correct. But when a counselor needs to do deep work — write a read-out, regenerate Week 2, review full plan — there is no pointer telling them to open the web app. They will either not do the deep work or not know where to go.

**What's needed:**
- In the client detail page (mobile), add a "Full workspace on web" link that deep-links to `/provider/clients/[id]` on the web app
- On the plan review screen (mobile), after approving, show: "You can record a daily read-out and plan Week 2 from the counselor web workspace"
- This could be a single banner or button; it doesn't require full feature parity

---

### 5. Push notifications are unbuilt despite being foundational to engagement

**The gap:** The `pushSubscriptions` table exists. The web has a `NotificationButton` component and `/api/notifications/subscribe`. The mobile FCM integration is listed as Phase 1b. None of it is wired.

**Why it matters:** Daily engagement is the product's core value loop. Without push (morning check-in reminder, "your counselor replied", "plan ready"), engagement will be driven entirely by habit — which is inappropriate for a pain recovery population. The backlog lists this as pilot-critical.

**What's needed:**
- FCM integration in the Expo app (Expo Notifications)
- Backend: notification dispatch on message received, plan approved, "check-in due" daily cron
- Client Profile tab: enable/disable by notification type (already in spec as C21)

---

### 6. Intake abandonment recovery is not designed

**The gap:** The mobile intake has `save-and-resume` (mentioned in spec, `lib/intake.ts` exists for local storage). But there is no defined re-entry screen. A client who starts intake, closes the app, and returns 2 days later will find their form state restored silently with no explanation.

**More importantly:** the web intake uses a different auth mechanism (email/password) than the mobile intake (OTP). There is no clear path for a client who starts on mobile and wants to continue on web, or vice versa.

**What's needed:**
- An explicit "Resume your assessment" screen (described in MOBILE_UX_REVIEW.md) rather than silent restore
- Clarify whether intake state syncs to the server after each step (currently mobile stores locally only) or only on submit
- If pilot has both web and mobile users, define whether they share one intake backend

---

### 7. Counselor profile and Calendly management are incomplete

**The gap:** The mobile counselor Profile tab exists as a skeleton. The counselor web console has no dedicated profile editor either — `counselorProfiles` table has `fullName`, `title`, `credentials`, `bio`, `calendlyUrl` but no web UI to edit them except on the `/provider/join` page at registration time.

**Why it matters:** The `calendlyUrl` field drives session booking for clients — it's how the "Book a session" button in the mobile Program tab works. If a counselor updates their Calendly URL, there is currently no way to do it.

**What's needed:**
- A counselor profile edit page on web (not mobile — editing on phone is awkward)
- Web: credentials, bio, Calendly URL edit at `/provider/profile` or in the existing console
- Mobile: profile tab shows read-only summary + "Edit on web" link

---

### 8. The program's day-level structure is not surfaced to clients

**The gap:** The Program tab shows week cards. Tapping a week navigates to `/program/week/[id]`. But the week detail screen content depends on what `generatedContent` stores — the `GeneratedPlan` type has `dailyPractices` as a week-level array, not per-day assignments. There is no `Day 1` / `Day 2` breakdown within a week.

The `CalendarBuilder` on the Today tab lets clients plan their day manually, but it is not pre-populated from the plan's practices for that specific day of the week. The spec defines C16 (Day detail) and the web `PROGRAM_TEMPLATE.md` likely defines day-level structure, but the data model does not currently support it.

**Why it matters:** Clients need predictability ("I know Day 1 is always the breath exercise, Day 3 is the values walk"). Without day-level structure, the program feels like a list rather than a journey.

**What's needed:**
- Decide whether day-level assignment is counselor-authored at plan approval, LLM-generated, or client-chosen
- Extend the `GeneratedPlan` data structure to include per-day practice assignments if counselor-authored
- Pre-populate the `CalendarBuilder` from the plan's day N practices, not from scratch each morning

---

### 9. Safety flags are visible to admin but not surfaced proactively to the counselor

**The gap:** The admin dashboard shows `safety.redFlags` and `safety.unsafeUsers`. The counselor work queue shows a count of `redFlags` from `apiGetProviderQueue`. But there is no proactive alert mechanism — the counselor must open the app to see flags. If a client marks "unsafe" in a check-in at 11pm, the counselor may not see it until the next morning when they happen to open the work queue.

**What's needed:**
- Push notification to counselor immediately on red-flag event (morning check-in, weekly check-in, or message with crisis language)
- A dedicated "Escalation" screen on mobile that shows the safety context: what the client reported, when, and what action the counselor must take
- Define the SLA in writing: counselors must respond to red-flag alerts within X hours (currently undefined per TRACK0_DECISIONS.md #24)

---

### 10. No voice recording on mobile for counselors

**The gap:** The `CounselorAudioPlayer` is built and works on mobile (client hears audio). The `VoiceReadOut` component lets clients submit voice responses. But there is no counselor audio recording flow on mobile. The `CounselorReadOutEditor` (audio recording) is web-only.

**Why it matters:** Counselors who are mobile-only (e.g. working from a phone between sessions) cannot record daily read-outs. The read-out is one of the highest-value touches in the daily loop — the client hears their counselor's voice as part of the morning routine. If the counselor cannot record it from their phone, it will not get recorded.

**What's needed:**
- A `CounselorAudioRecorder` component using Expo AV for mobile
- Add to the counselor per-client screen (after `Plan review` is approved)
- This is a Phase 1b item but should be prioritised before pilot launch if counselors are primarily mobile

---

### 11. Counselor plan editing and per-week approval — the most critical missing capability

This is the foundational gap that the rest of the product depends on. It redefines the counselor's role from gatekeeper to author.

#### Current state (what actually exists)

The web plan review (`PlanReviewClient.tsx`) is **read-only**. The counselor can:
- Read the AI-generated plan in an accordion (all 6 weeks)
- Toggle holistic block visibility (Ayurveda / yoga / music on/off checkboxes)
- Write a free-text counselor note (visible to themselves only)
- Approve the plan atomically — all 6 weeks go live at once
- Regenerate the entire plan from scratch (all-or-nothing)

There is no ability to change a single word of the plan content — no practice title, description, duration, week theme, reflection prompt, read-out template body, or holistic block text. The counselor either approves what the LLM wrote or regenerates the whole thing and accepts another LLM draft.

Approval is a single action that releases all 6 weeks simultaneously. The client sees the full program immediately. There is no per-week release, no "approve Week 1 now, review Week 2 next week" workflow.

#### Why this is a category-level problem

PTS's core value proposition — stated in the product brief — is *"counselor-led, AI-assisted."* If the counselor cannot edit the plan, the AI is the author and the counselor is a rubber stamp. This creates:

1. **Clinical risk:** An LLM practice that is inappropriate for this client (wrong intensity, wrong framing, missing a contraindication the counselor knows) goes out with the counselor's implicit approval but without their judgment applied to it.
2. **Professional problem:** A credentialed counselor cannot put their name on content they didn't author or meaningfully review. Long-term this limits the quality of counselors who will join the platform.
3. **Engagement problem:** A plan that the counselor has shaped in their own words will read differently to the client than one that reads generically LLM-authored. The counselor's voice in the plan is part of the therapeutic relationship.
4. **Adaptability problem:** Per-week approval is the only mechanism that allows a plan to respond to a client's actual progress. Approving 6 weeks on Day 1 means Week 5 was approved without knowing how Week 1 went.

#### What is needed — full requirements

**A. Per-week inline editing on the counselor web workspace**

Each week in the plan review should be separately editable before approval. For each week:

| Field | Edit type | Notes |
|-------|-----------|-------|
| Week theme | Short text | LLM-generated; counselor can reword |
| Week focus | Paragraph text | The framing clients read |
| Daily practices (each) | Title + description + duration | Counselor can rewrite, add, or remove a practice |
| Weekly reflection prompt | Single text | The question clients answer at week end |
| Counselor note | Paragraph text | Visible to counselor only in current model; could become visible to client as an optional motivational note |
| Read-out title + body | Short text + paragraph | Counselor can personalise the daily read-out to their voice |
| Holistic blocks (Ayurveda / yoga / music) | Toggle on/off + edit text fields | Currently toggles exist; text editing does not |

Editing should be inline: clicking a field switches it to an editable `<textarea>` or `<input>`. Not a modal. No separate edit page. The counselor edits in place, sees the preview update live, then approves that week.

**B. Per-week approval status and release model**

The current `plans.status` field has two values: `draft` and `approved`. This needs to become per-week:

| Concept | Current model | Required model |
|---------|--------------|----------------|
| Plan overall status | `draft` / `approved` | Unchanged — plan is active once Week 1 approved |
| Week status | Not modelled | `draft` / `edited` / `approved` per week |
| Client visibility | All weeks released on plan approval | Client sees only weeks the counselor has approved |
| Week 1 approval | Part of full plan approval | Counselor edits Week 1, approves → client sees Week 1 |
| Week 2 approval | Not available | Counselor reviews engagement data from Week 1, edits Week 2 with that context, approves → client sees Week 2 |

This is how the product should work: the counselor approves Week 1 at intake. At end of Week 1, the counselor reviews the client's check-in data, sees what the AI suggests for Week 2 (the `regenerate-week` endpoint already exists for this), edits the draft to fit what they know about this client's actual progress, and then approves Week 2. The client never sees a week before their counselor has reviewed and shaped it.

**Data model change required:** A new `planWeeks` table (or a `weekApprovals` JSON column on `plans`) is needed to track per-week edit state and approval status. Suggested schema:

```
planWeeks:
  id          — unique per week
  planId      — FK to plans
  weekNumber  — 1–6 (or beyond for continuation)
  content     — JSON (the full week object, counselor-edited version)
  status      — 'draft' | 'edited' | 'approved'
  approvedAt  — timestamp
  editedAt    — timestamp (last edit)
  counselorId — who approved
```

The `plans.generatedContent` blob becomes the LLM source. `planWeeks` holds the counselor-edited canonical version per week. On plan generation, all 6 weeks are written to `planWeeks` as `draft`. The client's plan view reads from `planWeeks` where `status = 'approved'` only.

**C. The counselor's workflow for each new week**

The intended clinical loop:

```
End of Week N
  ↓
Client submits weekly check-in (engagement + reflection data)
  ↓
Counselor opens web workspace for this client
  ↓
Views: this week's check-in answers, engagement stats (blocks done, read-out responses, holistic completion)
  ↓
Clicks "Prepare Week N+1" → triggers AI week regeneration (already exists as /api/provider/clients/[id]/regenerate-week)
  ↓
AI draft for Week N+1 appears in the plan editor
  ↓
Counselor edits the draft inline — changes wording, swaps practices, adjusts intensity, adds a personal note
  ↓
Counselor approves Week N+1 → client sees it on their Program tab
```

This loop is almost entirely there in terms of backend (the weekly summary endpoint, the regenerate-week endpoint, the apply-week endpoint all exist). What is missing is the **editing layer** — the ability to change text before clicking approve.

**D. What the counselor sees on the web workspace today vs. what they need**

Today the `ProviderClientWorkspaceClient` shows: engagement stats → read-out editor → "Generate week 2 draft" button → preview Week 2 theme/read-out title/yoga/music in a display card → "Apply week 2" button.

The "Apply week 2" button pushes the AI-generated week onto the live plan without any counselor editing of the practice content, reflection, or framing. The counselor can see what they're applying but cannot change it without regenerating again.

What is needed is a step between "draft appears" and "apply": an **editable week card** where the counselor can click any field and change it.

**E. Mobile plan review implication**

Per-week approval changes what the mobile plan review shows. On mobile:
- When a plan is in draft state (pre-Week-1 approval), the counselor sees Week 1 for editing and approval — same content, mobile-accessible editing of text fields
- Weeks 2–6 on mobile are visible in read-only mode (the counselor can see what the AI drafted but deep editing belongs on web)
- A "Review and edit on web" link is shown for Weeks 2–6 on mobile
- The mobile "Approve plan" CTA becomes "Approve Week 1" — a scoped approval, not the whole 6-week release

**F. What this means for the "AI as assistant" positioning**

This change makes the platform honest about what the AI does. The current framing in `PlanReviewClient.tsx` says: *"Approving assigns you as this client's counselor and auto-creates their Week 1 daily read-out and calendar template."* With per-week editing, the framing becomes: *"Review and edit this week's plan. When you're satisfied it's right for this client, approve it — they'll see it immediately."*

The AI is the first draft. The counselor is the author. This is what "counselor-led" actually means in practice.

---

## Part 4: Missing core items — a consolidated list

Items that are definitively absent from both web and mobile and would leave a noticeable gap in the product:

| Missing item | Impact if absent | Effort |
|---|---|---|
| **Counselor inline plan editing (web)** | **AI is the de-facto author; counselor is a rubber stamp** | **High** |
| **Per-week approval model + planWeeks data model** | **6 weeks approved on Day 1 without client progress data** | **High** |
| Post-Week-6 program state + monthly review | Clients hit a wall; no retention past 6 weeks | Medium |
| Graduation / transition flow | No clinical closure for successful completions | Low |
| Morning check-in (pain/sleep/intention) | No longitudinal symptom data for counselor | Low–Medium |
| Push notifications (all variants) | Engagement falls to habit-only | Medium |
| Day-level practice structure in plan data | Program feels like a list, not a journey | Medium |
| Counselor audio recording on mobile | Read-outs are web-gated | Low–Medium |
| Counselor profile editor (web) | Calendly URL becomes stale; no bio update | Low |
| Intake abandonment re-entry screen | Silent restore; no user confidence | Low |
| Red-flag push notification to counselor | Safety response is reactive, not proactive | Medium |
| "Go to web workspace" bridge in mobile counselor app | Deep work doesn't happen on mobile | Very low |
| Post-session notes and plan adjustment flow | No clinical record of 1:1 sessions | Medium |
| Client milestone acknowledgment (end of Week 1, 3, 6) | No motivational anchors in program | Low |
| Week 2–6 content visible in mobile plan review | Counselors approving blind on 5 weeks | Low |

---

## Part 5: What to prioritise before pilot launch

Given the pilot goal (10–20 clients, 2–3 counselors, 6 weeks), these are the must-haves:

**Non-negotiable before first pilot user:**
1. **Per-week approval data model** (planWeeks table) — this gate determines clinical architecture of everything else
2. **Counselor inline plan editing on web** — Week 1 at minimum before pilot; Weeks 2–6 before end of pilot
3. Push notifications — at minimum: "counselor replied", "plan approved", morning check-in reminder
4. Full plan (all 6 weeks) visible in mobile plan review
5. Red-flag push alert to counselor
6. Intake abandonment recovery screen
7. Morning check-in card (even basic: pain level + intention)

**Should-have for a good pilot:**
8. Graduation screen + minimal post-Week-6 state
9. Counselor "go to web" bridge in mobile
10. Week 2–6 edit capability on web (mobile shows read-only)
11. Counselor profile editor on web

**Can defer:**
12. Monthly review full implementation
13. Post-session notes
14. Counselor audio recording on mobile
15. Day-level plan assignments

