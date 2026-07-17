# PTS Backlog

**Last updated:** 2026-07-03  
**Format:** Track → Item. Priority: 🔴 Pilot-critical · 🟠 Pre-launch · 🟡 Post-pilot

> **Active pilot execution queue:** [`PILOT_TODO.md`](./PILOT_TODO.md) — dev runs, APK drops, and near-term fixes live there.  
> **Latest ship:** build 14 (Runs D–H, 2026-07-03). Remaining pilot work is mostly **device QA** (§5) and go-live infra (MSG91, Sentry).  
> This file is the **long-term strategic backlog** (all tracks). Do not duplicate pilot todos in both places.

See `PROJECT_BRIEF.md` for full product context.

---

## TRACK 0 — Strategy & Foundation

- 🔴 Finalise product name and brand positioning
- 🔴 Define the three user personas in detail: (a) workplace injury, (b) sports/activity injury, (c) accident/trauma — agree which the pilot focuses on
- 🔴 Define what "counseling" means on this platform vs. "therapy" — agree the language with the clinical lead and document scope boundaries
- 🔴 Confirm regulatory posture for India launch and target global markets (data residency, clinical disclaimers, consent requirements)
- 🔴 Define therapist/counselor credentialing criteria — what qualifications are required to join the platform
- 🔴 Define platform liability boundaries in writing — what it is and is not responsible for
- 🟠 Agree LLM provider and data handling policy for user content sent to LLM (consent language, data minimisation, retention)
- 🟠 **Intake quality & LLM cost controls** — pre-LLM nonsense/off-topic gates, rate limits, tighten round-3 submit, counselor low-quality flag; payment after Week 1 approval (see `PILOT_TODO.md` § Deferred — Intake quality)
- 🔴 Define pilot success metrics: activation, engagement, retention, counselor utilisation, user-reported outcome
- 🔴 **[SCOPE-B] Complete Track 0 decision sprint** — all 8 decisions in `TRACK0_DECISIONS.md` (#17–#24) are open and blocking pilot-critical build items. Run the 1-week alignment session described in that doc. Record all outcomes in `DECISIONS.md`. Acceptance criteria: `DECISIONS.md` has entries for all 8 decisions; no Track 0 item remains unresolved before pilot recruitment begins. *Must precede: credentialing build, consent copy, regulatory infra decisions, LLM data policy, pilot metrics dashboard.* See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding B.
- 🔴 **[SCOPE-C] Define and implement auth surface boundaries for pilot** — web uses email/password; mobile uses OTP. A mobile-authenticated client cannot log into the web app. Decide: (a) pilot is mobile-only — no web client access, or (b) add OTP login to web app, or (c) allow phone-verified users to set a password after OTP. Implement the decision. Acceptance criteria: a client who registers via mobile OTP can access their plan on whichever surfaces are supported; no dead-end auth states. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding C.
- 🟠 Agree business model: direct-to-consumer, B2B (employer/insurer), or both
- 🟠 Define pricing and access model

---

## TRACK 1 — Landing Page & Marketing Site

- 🔴 Write hero section copy: headline, subheadline, primary CTA
- 🔴 Write "Who this is for" section: 3–4 pain archetypes in plain language
- 🔴 Write "How it works" section: 3-step journey (assess, plan, walk with you)
- 🔴 Write "What you get" section: program, daily support, counselor access, 1:1 sessions
- 🔴 Write FAQ: Is this counseling? Is it confidential? What if I'm in crisis? How much? Can I cancel?
- 🔴 Write footer: privacy policy, terms, contact, crisis line number
- 🔴 Ensure crisis/red-flag helpline number is visible on every page
- 🟠 Design landing page (mobile-first)
- 🟠 Build landing page (static, separate from the app)
- 🟠 Set up analytics (page views, CTA clicks, registration funnel drop-off)
- 🟠 Write "Meet our counselors" section (once counselors are onboarded)

---

## TRACK 2 — Client Onboarding & Assessment

- 🔴 Design conversational intake flow — guided, empathetic, multi-step (not a form dump)
- 🔴 Write intake module 1 — **Your situation:** what happened, how long ago, what kind of pain/impact
- 🔴 Write intake module 2 — **Life impact:** what have you lost or had to stop? Work, sport, relationships, independence?
- 🔴 Write intake module 3 — **Your goal:** what does recovery look like? What would "back to living" mean for you?
- 🔴 Write intake module 4 — **Current support:** physio, doctor, family/social support
- 🔴 Write intake module 5 — **Your preferences:** language, communication style, schedule availability, structure preference
- 🔴 Write intake module 6 — **Safety screen:** red flags, crisis indicators, consent
- 🔴 Define intake data schema: what fields are stored and what feeds the LLM for plan generation
- 🔴 Build multi-step conversational intake UI (replaces current single intake page)
- 🔴 Build intake progress indicator
- 🔴 Build intake save-and-resume (user doesn't lose progress if they close the browser)
- 🔴 Build intake completion screen: "Your counselor will review this — your plan will be ready within X hours"
- 🟠 Define what triggers plan generation: immediate on intake completion, or after counselor review signal

---

## TRACK 3 — Plan Development & Program Engine

- 🔴 Define program structure: what does a week consist of? (theme, daily practices, check-in questions, session cadence)
- 🔴 Define week types: stabilisation (1–2), building (3–4), consolidation (5–6), continuation (7+)
- 🔴 Write base program content for each week type — clinical lead owns this
- 🔴 Design LLM prompt architecture: what inputs (intake data, pain archetype, goals, preferences) → what outputs (personalised plan draft)
- 🔴 Build LLM batch job: triggered on intake completion → generates personalised plan draft
- 🔴 **[SCOPE-A] Add `planWeeks` DB table and per-week approval model** — schema migration adding `planWeeks` table (planId, weekNumber, content JSON, status: draft/edited/approved, approvedAt, editedAt, counselorId); update `plans.status` logic so client-facing plan view reads only `approved` weeks; migrate existing approved plans to seed all 6 weeks as approved. Acceptance criteria: a client with an approved plan sees only counselor-approved weeks; weeks not yet approved are not visible. *Blocks all counselor plan-editing work.* See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding A.
- 🔴 **[SCOPE-A] Build counselor inline plan editing on web** — in `PlanReviewClient` and `ProviderClientWorkspaceClient`, replace read-only plan display with editable fields per week: theme, focus, daily practices (title/description/duration each), weekly reflection prompt, read-out title/body, holistic block text. Click-to-edit inline (no modal, no separate page). Edited state stored in `planWeeks.content`; `status` set to `edited` on any change. Acceptance criteria: counselor can change any text field in any week, save the edit, and approve that week independently. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding A.
- 🔴 **[SCOPE-A] Per-week approval CTA on web and mobile** — replace single "Approve plan" with per-week "Approve Week N" action. Mobile plan review: scope approval to Week 1 on initial review; Weeks 2–6 show read-only with "Edit and approve on web" link. Web workspace: sticky per-week approve button with progress indicator (e.g. "3 of 6 weeks approved"). Acceptance criteria: approving Week 1 releases only Week 1 to client; client sees Week 2 only after counselor approves it. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding A, Finding D.
- 🔴 **[SCOPE-G] Resolve and document the weekly planning model** — decision required before building counselor workspace: (a) LLM-first with counselor inline editing (recommended — matches product brief and PTS's scalability thesis), or (b) counselor authors each week from scratch. Update `PROVIDER_WORKFLOW.md` to match the agreed model. Acceptance criteria: `PROVIDER_WORKFLOW.md` updated, decision recorded in `DECISIONS.md`. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding G.
- 🔴 Build counselor plan review interface: view generated draft, edit sections, add notes, approve *(now superseded by SCOPE-A items above — retire once those are complete)*
- 🟠 **Counselor full plan regenerate:** from plan review (web + mobile), re-run LLM on latest intake → new draft; client keeps current approved plan until counselor approves replacement (see `regeneratePlanDraftForUser`, `POST /api/plans` action `regenerate`)
- 🟠 **Counselor week-N regenerate:** extend weekly summary + `regenerate-week` into LLM-authored Week N+1 draft with Ayurveda / yoga trial / music playlist blocks
- 🔴 **[SCOPE-H] Decide and implement plan generation trigger** — promote from 🟠: decide whether plan is generated immediately on intake submit or on counselor signal. Update Screen C8 copy in mobile app to match. Acceptance criteria: trigger is defined, implemented, and C8 copy reflects real behaviour. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding H.
- 🔴 Build plan delivery to client: "Your plan is ready" notification + plan view in app
- 🟠 Define plan adaptation logic: how does the plan update based on weekly check-in data?
- 🟠 Build plan version history: counselor and client can see plan evolution
- 🟠 Define escalation rules: which check-in responses trigger counselor alert vs. automatic resource delivery

---

## TRACK 4 — Daily Engagement & Program Delivery

- 🔴 **[SCOPE-F] Add `dailyCheckIns` DB table** — schema migration: `dailyCheckIns` (userId, date, painLevel 0–10, sleepQuality enum, intention text, createdAt). Acceptance criteria: morning check-in data persists per user per day; counselor engagement dashboard can query pain level trend for a client over the current week. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding F.
- 🔴 **[SCOPE-F] Build morning check-in card on mobile Today tab** — first card shown above fold each morning (before holistic and read-out cards). Fields: pain level (NRS face scale, not a slider — per MOBILE_UX_REVIEW.md), sleep quality (Poor/OK/Good), one intention (short text). Submits to `dailyCheckIns`. Acceptance criteria: client sees the card each morning before other content; data appears in counselor engagement view as a pain trend. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding F.
- 🔴 Design daily engagement rhythm: morning check-in, midday resource/practice, evening reflection — define default cadence and user controls
- 🔴 Write morning check-in prompts (pain level, mood, sleep, intention) — varies by week and individual progress
- 🔴 Write midday resource/practice library: breathing, grounding, values exercises, movement prompts — each 2–3 minutes
- 🔴 Write evening reflection prompts: what happened, what worked, what was hard
- 🔴 Write weekly check-in: more substantial reflection — progress against goals, barriers, next week focus
- 🔴 Build daily practice UI (mobile-optimised): check-in, resource delivery, reflection capture
- 🔴 Build "I'm struggling today" button — visible always, routes to immediate resource or counselor message
- 🟠 Build progress tracker: visual streak, weekly completions, milestone markers
- 🟠 **[Read-out voice] Client playback of own recording** — after voice read-out submit, show inline audio player so client can replay what they sent; extend `GET /api/reinforcements` to return today's `responseType`, `bodyText`, and `audioUrl` per read-out. Acceptance criteria: client sees "Recorded today" plus play control; replay works on Android APK.
- 🟠 **[Read-out voice] Counselor response review in workspace** — in client workspace Overview or Read-outs tab, list today's (and recent) client responses with text preview and `<audio>` playback for voice submissions. Acceptance criteria: counselor can hear client read-out recording without admin dossier; response count in engagement rollup matches playable entries.
- 🟠 Build milestone acknowledgement moments: completion of week 1, week 3, week 6
- 🟠 Define what daily engagement data feeds back to counselor dashboard

---

## TRACK 5 — Mobile & Push Communication

- 🔴 Decide: PWA (recommended for pilot — no app store, works globally) vs. native iOS/Android
- 🔴 Build PWA manifest and service worker for offline capability and home screen install
- 🔴 Implement Web Push notifications (HTTPS + service worker)
- 🔴 Build notification preference management: user controls frequency, time of day, types
- 🔴 Define notification templates: morning check-in reminder, midday practice nudge, counselor message alert, milestone, re-engagement
- 🔴 Build deep links: notification taps open the specific screen (not just the home page)
- 🟠 Build SMS fallback for markets where push notifications are unreliable (Twilio)
- 🟠 Evaluate WhatsApp as primary mobile touchpoint for India and global markets
- 🟠 Build re-engagement flow: user inactive 2+ days → personalised counselor-authored outreach

---

## TRACK 6 — Two-Way Messaging

- 🔴 Design messaging model: async chat between client and counselor
- 🔴 Build client-to-counselor messaging: compose, send, read
- 🔴 Build counselor-to-client messaging: compose, send, view delivery status
- 🔴 Build unread message notifications: badge count in app + push notification
- 🔴 Build full message thread history: client and counselor see same conversation
- 🔴 Define counselor response SLA: e.g. within 24 hours — show commitment to users
- 🟠 Build system-generated messages: plan updates, milestone acknowledgements, resource suggestions — LLM-authored, counselor-reviewed or auto-sent
- 🟠 Build counselor "away" indicator: when unavailable, what does the client see?
- 🟡 Evaluate peer support groups for similar pain archetypes

---

## TRACK 7 — Counselor Platform

- 🔴 **[SCOPE-D] Show all 6 weeks in mobile plan review** — `MOBILE_APP_UX.md` specifies Weeks 1–6 accordion on the mobile plan review screen; the actual build shows only Week 1. Add collapsed accordion for Weeks 2–6 (read-only on mobile; per-week approve scoped to Week 1 for initial review; Weeks 2–6 show "Edit on web" link). Acceptance criteria: counselor on mobile can see all 6 week themes and practices before approving. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding D. *(Patient-safety relevant — counselors currently approving blind on 5 weeks.)*
- 🔴 Build counselor registration flow: credentials, specialisations, languages, bio, photo
- 🔴 Build credential verification workflow: admin reviews and approves applications
- ~~🔴 Build counselor profile page: visible to clients on assignment or selection~~ → **Partial (2026-07-16):** assigned-only `YourCounselorCard` + `/provider/profile` editor + Calendly + ephemeral join link. **No client selection/marketplace** per `DECISIONS.md`. Photo + full registration flow still backlog.
- 🔴 Build counselor dashboard: assigned clients, flags, unread messages, pending plan reviews, upcoming sessions
- 🔴 Build counselor availability calendar: set weekly recurring hours, block dates, override slots
- 🔴 Build session booking: client views counselor's available slots and books a 1:1 session — **partial:** Calendly on counselor profile (`Book a session`); no in-app slot picker
- 🔴 Build pre-session brief: counselor sees client's recent check-ins, progress, and flags before a session
- 🔴 Build post-session note: counselor records outcome, plan adjustments, follow-up actions
- 🟠 Build client assignment model: auto-assign based on availability and specialisation, or client selects
- 🟠 Build caseload management: max clients, waitlist, pause new intake
- 🟠 Define session format: video (Whereby/Daily.co), phone, or async voice note
- 🟠 Build counselor supervision structure: platform clinical lead reviews counselor activity
- 🟡 Build counselor earnings / payment model if counselors are compensated per session or client

---

## TRACK 8 — Admin & Platform Operations

- 🔴 Build admin dashboard: user counts, active programs, counselor utilisation, escalations
- 🔴 Build escalation management: crisis or red-flag response triggers alert to admin and counselor
- 🔴 Build crisis resources: in-app help, crisis line visible at all times on every screen
- 🟠 Build content management: update program content and prompts without a code deploy
- 🟠 Build counselor performance review: response times, client feedback, completion rates
- 🟠 Build platform reporting: weekly metrics for clinical lead and business review
- 🟠 Implement data retention scheduled cleanup (90-day policy already defined in docs)
- 🟠 Build GDPR/data export: user can request all their data in a portable format
- 🟠 Build platform audit log: who accessed what, when

---

## TRACK 9 — Infrastructure & Technical

- 🔴 **[SCOPE-B-DEPENDENCY] Hold `sin1` region decision pending regulatory posture** — BACKLOG marks Singapore region as 🔴 pilot-critical, but this decision depends on Track 0 Decision #20 (regulatory posture / data residency). Do not implement until `DECISIONS.md` records a resolution on #20. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding B.
- 🔴 Set Vercel function region to `sin1` (Singapore) to match Neon `ap-southeast-1` — eliminates cross-region latency
- 🔴 Set up email delivery (Resend or SendGrid) — needed for verification, plan-ready, session confirmations
- 🔴 Set up error monitoring (Sentry)
- 🔴 Set up LLM integration: Claude API with prompt caching for cost efficiency
- 🟠 Design LLM batch job: trigger, review gate, delivery pipeline
- 🟠 Set up staging environment separate from production
- 🟠 Set up database backups on Neon
- 🟠 Implement database connection pooling for production load (currently max: 1)
- 🟠 Evaluate real-time messaging infrastructure: WebSockets or managed service (Pusher, Ably, Supabase Realtime)
- 🟠 Evaluate calendar/scheduling: custom build vs. Cal.com API integration
- 🟠 Implement CI/CD: merge to main triggers staging deploy; manual promote to production

---

## TRACK 10 — Already Built (Pilot Foundation)

The following exist and are production-deployed at https://pts-web-pied.vercel.app:

- [x] Auth: register, login, logout, password reset tokens
- [x] Basic intake form (needs full rebuild per Track 2)
- [x] Week 1 static plan (will be replaced by generated plans)
- [x] Daily checklist (needs content expansion per Track 4)
- [x] Weekly check-in (needs content expansion per Track 4)
- [x] Red-flags safety routing
- [x] Consent-gated data storage with encryption option
- [x] Counselor console showing real client data (auth-gated)
- [x] API error handling, rate limiting, structured logging, health check
- [x] Security headers, standalone output, Next.js CVEs patched
- [x] Deployed: Vercel + Neon PostgreSQL
- [x] GitHub: https://github.com/raak-tech/PTS

---

## TRACK 11 — Post-Program & Continuation

- 🟠 **[SCOPE-E] Build graduation screen at Week 6 completion** — when `computeProgramTime()` returns `programComplete: true`, show a graduation screen instead of empty Today/Program tabs. Content: acknowledgement of completion, summary of journey, transition to maintenance mode framing. Acceptance criteria: client who finishes Week 6 sees a meaningful end state, not a blank screen. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding E.
- 🟠 **[SCOPE-E] Build maintenance mode post-Week-6** — Program tab after graduation shows: last completed week, next monthly session booking prompt, and a "maintenance plan" lightweight card (per `PROGRAM_TEMPLATE.md` Week 6 which specifies a 4-week maintenance plan). Acceptance criteria: client has a clear next step after Week 6 rather than a retention cliff. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding E.
- 🟠 **[SCOPE-E] Monthly check-in cadence** — replace weekly check-in trigger with monthly after program completion. API: monthly check-in endpoint; mobile: prompt appears on program completion day +30. Acceptance criteria: clients in maintenance mode receive monthly check-in prompts, not weekly.

---

## TRACK 12 — Mobile UX Items (from MOBILE_UX_REVIEW.md)

*These UX review recommendations have no backlog items. Converting all 12 — two are patient-safety critical. See `SCOPE_AND_OPPORTUNITY_REPORT.md` Finding I and `MOBILE_UX_REVIEW.md` section 9.*

- 🔴 **[SCOPE-I] C7 safety check — split into 2 screens with rewritten copy** *(patient safety)* — currently a dense checkbox list on one screen. Split to: (a) red flag list displayed one at a time, not all at once; (b) consent + confirmation. Rewrite copy tone: "We ask this so your counselor can make sure your program is right for you." Acceptance criteria: no single-screen red flag checklist exists in the intake flow; copy is warm, not clinical.
- 🔴 **[SCOPE-I] Crisis notes acknowledgment gate before plan approve** *(patient safety)* — if a plan has crisis-level notes auto-applied, the Approve CTA must be blocked behind an explicit acknowledgment step. Counselor must check "I have read the crisis notes" before Approve is enabled. Acceptance criteria: a plan with crisis notes cannot be approved in one tap; the crisis content is surfaced and acknowledged.
- 🔴 **[SCOPE-I] Define `theme.ts` design tokens before any mobile screen development** — create `apps/mobile/src/theme.ts` with exported `colors`, `spacing`, `typography`, `radii` tokens mirroring the web app values before any new screen is built. Acceptance criteria: no hardcoded colour or spacing values in any new mobile screen component.
- 🟠 **[SCOPE-I] 6-box OTP split input** — replace single OTP text field with 6 individual digit boxes; auto-advance on entry; `autoComplete="one-time-code"` on each. Acceptance criteria: OTP screen uses split-box input on Android and iOS.
- 🟠 **[SCOPE-I] Pain input: NRS face scale instead of slider** — replace 0–10 slider in morning check-in with a visual face scale (faces mapped to numbers 0–10) showing previous day's value as a reference point. Acceptance criteria: no slider component used for pain level capture.
- 🟠 **[SCOPE-I] Mark practice done — full-width button, not checkbox** — practice completion uses a large full-width "Mark done" button followed by a "How did this feel?" prompt. No checkbox component. Acceptance criteria: practice completion is a milestone interaction, not a form element tap.
- 🟠 **[SCOPE-I] Remove message list screen (C19) for pilot** — single-counselor pilot does not need a conversation list. Tap Messages tab → go directly to thread with assigned counselor. Display counselor name and initials in thread header. Acceptance criteria: no intermediate list screen in client Messages tab for pilot.
- 🟠 **[SCOPE-I] Tab badge lifecycle defined** — specify when counselor Home tab badge clears (after viewing queue items), when Messages badge clears (after opening thread), and what triggers re-badge. Acceptance criteria: badge state documented and implemented consistently across both roles.
- 🟠 **[SCOPE-I] Locked week teaser cards** — locked weeks on Program tab show week theme and a silhouette of practices with a subtle lock icon and copy: "Week 2 unlocks when your counselor marks Week 1 complete." Acceptance criteria: no greyed-out empty cards; locked weeks have intentional teaser content.
- 🟠 **[SCOPE-I] Weekly check-in one-question-at-a-time flow** — present 4 weekly check-in prompts as sequential full-screen steps (same pattern as intake), not a wall of text inputs. Acceptance criteria: each check-in question is on its own screen with a thin progress bar.
- 🟠 **[SCOPE-I] Counselor "go to web workspace" bridge** — in the mobile counselor client detail screen, add a prominent link: "Record read-out and plan Week 2 on the web workspace" linking to `/provider/clients/[id]`. Acceptance criteria: counselor on mobile has a visible path to the web workspace for deep work.
- 🟠 **[SCOPE-I] Intake abandonment re-entry screen** — when a client re-opens the app mid-intake, show an explicit "Resume your assessment" screen with: step they left on, days since they started, "Continue" and "Start over" options. Acceptance criteria: no silent local state restoration; user is always told where they are in intake.

---

## Pilot Sprint Focus (updated 2026-07-02)

**Moved to [`PILOT_TODO.md`](./PILOT_TODO.md)** — see §1–§3 for current kickoff bar (Profile, client→counselor share, Week-1-first LLM model, read-out voice).

Historical note (2026-06-30): original sprint items included `planWeeks` migration, morning check-in, crisis gate, push notifications, graduation — track completion in `PILOT_TODO.md` §✅ and §5–§7.
