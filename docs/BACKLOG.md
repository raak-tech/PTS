# PTS Backlog

**Last updated:** 2026-05-28
**Format:** Track → Item. Priority: 🔴 Pilot-critical · 🟠 Pre-launch · 🟡 Post-pilot

See `PROJECT_BRIEF.md` for full product context.

---

## TRACK 0 — Strategy & Foundation

- 🔴 Finalise product name and brand positioning
- 🔴 Define the three user personas in detail: (a) workplace injury, (b) sports/activity injury, (c) accident/trauma — agree which the pilot focuses on
- 🔴 Define what "counseling" means on this platform vs. "therapy" — agree the language with the clinical lead and document scope boundaries
- 🔴 Confirm regulatory posture for India launch and target global markets (data residency, clinical disclaimers, consent requirements)
- 🔴 Define therapist/counselor credentialing criteria — what qualifications are required to join the platform
- 🔴 Define platform liability boundaries in writing — what it is and is not responsible for
- 🔴 Agree LLM provider and data handling policy for user content sent to LLM (consent language, data minimisation, retention)
- 🔴 Define pilot success metrics: activation, engagement, retention, counselor utilisation, user-reported outcome
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
- 🔴 Build counselor plan review interface: view generated draft, edit sections, add notes, approve
- 🔴 Build plan delivery to client: "Your plan is ready" notification + plan view in app
- 🟠 Define plan adaptation logic: how does the plan update based on weekly check-in data?
- 🟠 Build plan version history: counselor and client can see plan evolution
- 🟠 Define escalation rules: which check-in responses trigger counselor alert vs. automatic resource delivery

---

## TRACK 4 — Daily Engagement & Program Delivery

- 🔴 Design daily engagement rhythm: morning check-in, midday resource/practice, evening reflection — define default cadence and user controls
- 🔴 Write morning check-in prompts (pain level, mood, sleep, intention) — varies by week and individual progress
- 🔴 Write midday resource/practice library: breathing, grounding, values exercises, movement prompts — each 2–3 minutes
- 🔴 Write evening reflection prompts: what happened, what worked, what was hard
- 🔴 Write weekly check-in: more substantial reflection — progress against goals, barriers, next week focus
- 🔴 Build daily practice UI (mobile-optimised): check-in, resource delivery, reflection capture
- 🔴 Build "I'm struggling today" button — visible always, routes to immediate resource or counselor message
- 🟠 Build progress tracker: visual streak, weekly completions, milestone markers
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

- 🔴 Build counselor registration flow: credentials, specialisations, languages, bio, photo
- 🔴 Build credential verification workflow: admin reviews and approves applications
- 🔴 Build counselor profile page: visible to clients on assignment or selection
- 🔴 Build counselor dashboard: assigned clients, flags, unread messages, pending plan reviews, upcoming sessions
- 🔴 Build counselor availability calendar: set weekly recurring hours, block dates, override slots
- 🔴 Build session booking: client views counselor's available slots and books a 1:1 session
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

## Pilot Sprint Focus (next 2–3 weeks of build)

The minimum to run a meaningful pilot with real users and counselors:

1. Rewrite intake as multi-step conversational flow (Track 2)
2. Build client-counselor messaging thread (Track 6)
3. Build counselor calendar + session booking — Calendly embed acceptable for pilot (Track 7)
4. Connect Claude API for plan generation in draft mode — counselor reviews before delivery (Track 3)
5. Build Web Push notifications for daily check-in reminders (Track 5)
