# Decision Log

Use this to record decisions that affect architecture, product scope, safety/privacy posture, and why we made them.

## Template
- **Date:** YYYY-MM-DD
- **Decision:**
- **Why:**
- **Alternatives considered:**
- **Consequences / follow-ups:**

## Decisions
- **Date:** 2026-04-18
- **Decision:** Create initial repo scaffold under `/home/satananth/projects/PTS`.
- **Why:** Establish a stable place to capture scope + safety/privacy constraints and iterate quickly.
- **Alternatives considered:** Start inside Hermes runtime (rejected), keep as unstructured notes (rejected).
- **Consequences / follow-ups:** Pick MVP stack, write first vertical-slice plan in `docs/plans/`.

- **Date:** 2026-04-19
- **Decision:** Delivery model is a structured 6-week program; Sprint 1 ships a self-serve client web flow (no persistence) with safety guardrails.
- **Why:** Matches the project brief: program cadence first, minimal data posture, and clear boundaries (not medical advice; no outcome guarantees).
- **Alternatives considered:** Unlimited chat-first product (rejected for scope/safety), outcome-based metrics in MVP (rejected; process-first).
- **Consequences / follow-ups:** Primary MVP metric is activation (intake completed -> user reaches /plan). Defer data storage + analytics until explicit consent + retention policy.
- **Refs:** Decision brief: `docs/plans/2026-04-19-sprint-0-delivery-model-and-metric.md` (tracks issue #5)

- **Date:** 2026-05-03
- **Decision:** Add a pilot-ready email/password auth slice (register, login, logout) backed by secure HTTP-only cookie sessions.
- **Why:** Unblocks early client pilot logins while keeping the current data posture conservative and leaving password reset for a follow-up slice.
- **Alternatives considered:** Waiting for the full consent/persistence phase (too slow for pilot momentum), or adding an external auth provider first (extra integration overhead).
- **Consequences / follow-ups:** Password reset and any route protection beyond the pilot shell remain follow-up work; auth now exists as the foundation for client onboarding.

- **Date:** 2026-05-05
- **Decision:** Switch the web app's default development backend from SQLite to PostgreSQL and run a local Postgres instance for the repo.
- **Why:** The project now has auth, consent, and support-storage flows that are easier to develop and validate against a real Postgres backend.
- **Alternatives considered:** Keep SQLite as the default (rejected), use a managed external database (rejected for local iteration).
- **Consequences / follow-ups:** Keep `DATABASE_URL` override support, document the local DB endpoint, and treat Postgres as the default backend in future work.

- **Date:** 2026-06-30
- **Decision:** Clients never access the web app — mobile app (OTP) is the only client-facing surface, permanently.
- **Why:** Clean surface separation: clients live on mobile, counselors and admin live on web. No cross-surface auth complexity. This is a permanent product model, not a pilot constraint.
- **Alternatives considered:** Adding OTP to web for clients (rejected — unnecessary complexity, no user need identified). Web client access post-pilot (rejected — permanent decision).
- **Consequences / follow-ups:** All client-facing features build to mobile only. Web codebase client routes can be removed post-pilot. SCOPE-C auth boundary resolved — no work needed.

- **Date:** 2026-06-30
- **Decision:** Brand name is "Pain to Strength" — full name used in all marketing, UI headings, and communications. "PTS" used as abbreviation where space is constrained (app header, tab labels, meta titles).
- **Why:** Full name communicates the product's purpose and emotional promise directly. More resonant for clients, more credible for B2B conversations.
- **Alternatives considered:** PTS-only (rejected — too opaque for new users); PTS as primary with full name secondary (rejected — undersells the brand).
- **Consequences / follow-ups:** Update app name in app.config.ts, web metadata, landing page nav, and all "PTS" references in UI copy to "Pain to Strength". Abbreviate to PTS only in constrained spaces.

- **Date:** 2026-06-30
- **Decision:** Pilot success metrics: (1) Activation — 70% of clients who complete intake reach Day 7. (2) Week-2 retention — 40% of activated clients still using app by Day 14. (3) Counselor response SLA — maximum 12 hours; any breach auto-escalates to admin portal.
- **Why:** 70%/40% are realistic benchmarks for a supported digital health program. 12-hour SLA (vs 24) reflects that clients in pain cannot wait a full day for a response; admin escalation ensures no breach goes unnoticed.
- **Alternatives considered:** 24-hour counselor SLA (rejected — too slow for a pain population in distress).
- **Consequences / follow-ups:** Build SLA tracking into admin dashboard — flag message threads where counselor has not replied within 12 hours. Add escalation alert to admin portal. Track all three metrics in the pilot metrics dashboard.

- **Date:** 2026-06-30
- **Decision:** LLM data policy: (a) existing intake consent language is sufficient — no change needed. (b) Raw intake responses retained for 90 days then deleted.
- **Why:** Current consent language ("data used to build your personalised program") is appropriate for a counseling support tool. 90-day retention gives counselors enough history to support ongoing clients while minimising data exposure.
- **Alternatives considered:** More explicit AI disclosure language (reviewed and rejected — current language is adequate for pilot scope). Longer retention (rejected — data minimisation principle).
- **Consequences / follow-ups:** Implement 90-day scheduled cleanup job for intakeResponses table. No changes to intake consent copy needed.

- **Date:** 2026-06-30
- **Decision:** Pilot personas — two archetypes: (1) General health disruption, (2) Sports/activity injury.
- **Why:** General health disruption is the broadest and most recruitable cohort in Chennai. Sports/activity injury is well-defined, motivated, and has a clear recovery goal. Together they cover the psychological and physical recovery spectrum without overstretching counselor expertise in the pilot.
- **Alternatives considered:** Workplace injury (deferred — legal/compensation complexity adds risk to pilot); road accident/trauma (deferred — PTSD overlay requires higher clinical skill threshold).
- **Consequences / follow-ups:** LLM prompt architecture and plan templates should be validated against these two archetypes first. Pilot recruitment materials should target these personas explicitly.

- **Date:** 2026-06-30
- **Decision:** Platform scope language approved as drafted: "Pain to Strength is a counseling-led recovery support program. Our counselors help you understand the psychological and practical challenges that come with pain and guide you toward values-based recovery. We are not a medical service and cannot diagnose, prescribe, or treat medical conditions. We work alongside your medical care team."
- **Why:** Agreed by Satheesh and Ramya. Clearly positions counseling support without medical claims.
- **Alternatives considered:** None — draft approved without modification.
- **Consequences / follow-ups:** Use this exact language in intake consent, FAQ, ToS, landing page, and all user-facing copy where scope needs to be clarified.

- **Date:** 2026-06-30
- **Decision:** Counselor credentialing criteria: M.Sc. or Diploma in Psychology or Counselling (or equivalent) + minimum 1 year experience with pain, trauma, or recovery support. No liability insurance requirement (not applicable in India).
- **Why:** 1 year experience is achievable for the pilot counselor pool in India. Liability insurance is not a recognised or available product for individual counselors in India — removing it avoids a false barrier.
- **Alternatives considered:** 2 years experience (relaxed to 1 year for India pilot realities); liability insurance requirement (removed — not applicable in Indian market).
- **Consequences / follow-ups:** Update counselor registration form copy and admin credential verification checklist to reflect these exact criteria.

- **Date:** 2026-06-30
- **Decision:** Platform liability boundaries: Pain to Strength is responsible for program structure, counselor credentialing, and data security. The counselor is responsible for quality of guidance, safety assessment, and ethical conduct. Pain to Strength is not responsible for medical diagnosis, prescribing, emergency crisis intervention, or counselor misconduct beyond removal from the platform.
- **Why:** Crisis escalation removed from platform responsibility — the platform surfaces crisis resources and routes to helplines, but cannot commit to clinical crisis intervention. That responsibility sits with the counselor and the client's own support network.
- **Alternatives considered:** Platform responsible for crisis escalation (rejected — operationally undeliverable and outside counseling scope).
- **Consequences / follow-ups:** Update ToS and intake safety copy to reflect that crisis resources are provided but the platform does not intervene directly. Crisis strip and red-flag routing remain as safety features but are framed as signposting, not intervention.

- **Date:** 2026-06-30
- **Decision:** Weekly planning model confirmed: AI generates full 6-week plan draft from client intake. Counselor reviews, edits inline, and approves week by week — releasing each week to the client only after counselor sign-off. AI is the first draft; counselor is the author and responsible party.
- **Why:** Agreed by Satheesh and Ramya. This model makes PTS scalable (AI handles drafting) while keeping clinical responsibility with the counselor (human edits and approves every week before the client sees it).
- **Alternatives considered:** Counselor authors each week from scratch (rejected — not scalable); full AI approval without counselor edit (rejected — clinical responsibility must sit with a human).
- **Consequences / follow-ups:** SCOPE-G resolved. PROVIDER_WORKFLOW.md updated to v1.0 reflecting LLM-first model. Build inline editing before any plan approval UI work begins.

- **Date:** 2026-06-30
- **Decision:** No legal review required before pilot launch. Data residency on US-based infrastructure (Neon PostgreSQL via Vercel) is acceptable for the pilot. Local dev continues to use local PostgreSQL.
- **Why:** Standalone mental health apps currently fall outside CDSCO regulatory framework in India — no legal review needed for a small controlled pilot. US data residency is acceptable given the current unregulated environment and small pilot scale.
- **Alternatives considered:** Legal review before launch (rejected — adds timeline without clear regulatory requirement at this stage); India-based data residency (deferred — not required for pilot, revisit at scale).
- **Consequences / follow-ups:** Revisit data residency decision before any public launch or B2B employer contracts. The SCOPE-B-DEPENDENCY hold on the Singapore region (sin1) in Track 9 is now resolved — confirm Neon database region and set Vercel function region to match. Verify production DATABASE_URL is correctly set in Vercel dashboard.

- **Date:** 2026-07-02
- **Decision:** Pilot dev workflow: **Analyze → Document → Review → Build** (`DEV_WORKFLOW.md`). Multi-surface or multi-role changes require a feature spec in `docs/plans/` and review gate approval before coding. `PILOT_TODO.md` links specs; completion updates both spec and todo.
- **Why:** Build 11 exposed counselor web lagging client/API because implementation preceded cross-role analysis. Prevents misaligned surfaces and duplicate rework.
- **Alternatives considered:** Code-first with post-hoc docs (rejected — caused §9 gaps); heavy PRD for every bugfix (rejected — workflow scoped to multi-surface work).
- **Consequences / follow-ups:** Section 9 uses `docs/plans/2026-07-02-section-9-counselor-alignment.md`. Agents and autopilot follow `DEV_WORKFLOW.md` for pilot items. Amend `AUTOPILOT_POLICY.md` plan-first rule to reference this doc.

- **Date:** 2026-07-02
- **Decision:** **Amend SCOPE-G (2026-06-30):** Initial LLM plan generation after intake produces **Week 1 only**. Weeks 2–6 are generated one at a time after counselor week comment + `regenerate-week`. The 2026-06-30 wording (“AI generates full 6-week plan draft”) applies only to the **program arc**, not the first API response.
- **Why:** Clinical gate: counselor reviews Week 1 before client starts; each subsequent week uses enriched engagement data. Implemented in build 11 API; counselor UI alignment is §9.
- **Alternatives considered:** Keep generating 6 weeks on intake (rejected — contradicts product rule agreed in pilot todo §3).
- **Consequences / follow-ups:** Update `PROVIDER_WORKFLOW.md` (§9.8). Plan review queue copy and generation progress strings must match. Legacy 6-week JSON in DB for already-approved clients is read-only history — **no bulk “approve all weeks” UI** going forward.

- **Date:** 2026-07-02
- **Decision:** **No “Approve all weeks”** in the program process. Counselors approve **one week at a time** only (Week 1, then Week 2, …). Remove bulk-approve UI from counselor web plan review and counselor mobile plan review.
- **Why:** Week-1-first model requires counselor review and comment between weeks; bulk approve bypasses clinical gates and releases content the client should not see yet.
- **Alternatives considered:** Hide bulk approve for new plans only (rejected — user confirmed never in process).
- **Consequences / follow-ups:** §9.1 removes `approveAll` from `PlanReviewClient.tsx` and mobile `plan-review/[id].tsx`. Per-week approve via `POST /api/provider/plans/{planId}/week/{n}` remains the only release path.

- **Date:** 2026-07-03
- **Decision:** **Counselor claim-on-first-action:** `client_counselor` row is created when a counselor first generates Week 1, edits a week, or approves a week. `onConflictDoNothing()` — first claim wins. Counselor queues scope to unclaimed-or-mine clients.
- **Why:** Pilot showed global counselor queues and clients messaging counselors before any mapping existed. Claim ties ownership to clinical action; scoping reduces queue noise.
- **Alternatives considered:** Admin-assigned mapping only (rejected — adds ops overhead); invite-code linking (rejected — superseded demo model).
- **Consequences / follow-ups:** Mobile hides "Message counselor" until mapped. `PROVIDER_ASSIGNMENT.md` documents the model. Push on new `counselor-share` goes to assigned counselor only.

- **Date:** 2026-07-16
- **Decision:** **Counselor mobile = Bridge mode** relative to web Caseload + Client Chart. Phone: Queue, messages, Week 1 approve, L1 snippets, read-out playback, deep-links with `?tab=`. Web: Formulation, WeekEditor, Apply/edit weeks 2–6, Notes, holistic visibility. Do not ship cosmetic controls on phone (e.g. holistic switches that do not POST).
- **Why:** Align mobile with Chart IA without porting the full workplace; stop thin Apply and fake holistic toggles from bypassing clinical gates.
- **Alternatives considered:** Basic-only shrink (queue+messages+web only — deferred); Chart-lite tab shell on phone (deferred — more build, less bridge clarity).
- **Consequences / follow-ups:** Spec `docs/plans/2026-07-16-counselor-mobile-bridge.md`; update `docs/kb/MOBILE.md`.

- **Date:** 2026-07-16
- **Decision:** **No counselor marketplace.** Counselor–client matching stays claim / admin allocate / clinical fit — never client shopping or open directory browse. Assigned clients may see a **read-only counselor profile** (trust + Calendly booking only). Long-term scale path is **program + RAG / model improvement**, not more 1:1 human hours; human counselor time is treated as a scarce limiting factor (“I want to always interact with a human” must not become the growth bottleneck).
- **Why:** Marketplace adds selection overhead and implies unlimited human capacity. Product bet is counseling-led gates where they matter (formulation, Week 1, safety, hard cases, booked sessions) while daily support and knowledge improve via retrieval/AI so more people can be helped without proportional counselor headcount.
- **Alternatives considered:** Client-facing counselor directory / request-a-counselor (rejected as primary model — may only appear later as admin-assisted fit, not marketplace); grow purely by hiring counselors 1:1 with clients (rejected as scale path).
- **Consequences / follow-ups:** Do not build counselor browse/match UI. Profile = post-assignment trust surface (`YourCounselorCard` / `profile/counselor`; `GET /api/me/contacts` public fields only). Prefer RAG over expanding live-session volume as the default growth lever. Live video stays external (Calendly + `sessionJoinUrl` ephemeral rooms), not in-app Meet/Zoom. Ship note: [`docs/plans/2026-07-16-intake-counselor-client-bridge-ship.md`](docs/plans/2026-07-16-intake-counselor-client-bridge-ship.md).

- **Date:** 2026-07-16
- **Decision:** **Hybrid ready-pool** for counselor Caseload: incomplete intake clients are **hidden**; after intake completes, unassigned clients enter a **ready pool** (claim via Generate Week 1); assigned clients stay on their counselor only. Admins may allocate/reassign (`POST /api/admin/clients/[id]/assign`).
- **Why:** OTP-only and mid-draft accounts polluted Caseload; Generate Week 1 ran before intake was clinically usable. Hybrid keeps self-serve claim after intake while allowing admin load-balancing.
- **Alternatives considered:** Show all new signups to any counselor (rejected); admin-only allocation with no ready pool (rejected — too much ops friction for pilot).
- **Consequences / follow-ups:** `isClientVisibleToProvider` requires completed intake for unassigned visibility. `POST /api/provider/generate-plan` returns `intake_incomplete` without `completedAt`. Documented in `PROVIDER_ASSIGNMENT.md` + `COUNSELOR_WEB.md`.

- **Date:** 2026-07-16
- **Decision:** **Incomplete intake Account exit** on mobile: every intake step + waiting-plan expose **Sign out** (pause; server draft kept) and **Delete account** (hard wipe, double confirm). No Today/Program tabs until intake complete.
- **Why:** Clients could not reach Profile sign-out while routed to intake; trapped on wrong phone or abandoned flows.
- **Alternatives considered:** Unlock Profile tabs during intake (rejected — empty/broken destinations); single “Leave” control (rejected — conflates pause vs delete).
- **Consequences / follow-ups:** `POST /api/support/delete` uses `delete-client-account.ts` full wipe. `AccountExitMenu` + `Screen.showAccountExit`.

- **Date:** 2026-07-16
- **Decision:** **Client notifications by journey stage:** intake-completion nudges only while `!intakeComplete`; program daily reminders only after intake complete **and** plan approved (`syncClientNotifications`).
- **Why:** Program “check-in on Today” reminders fired during incomplete intake — wrong surface and copy.
- **Alternatives considered:** Same reminder schedule for all signed-in users (rejected).
- **Consequences / follow-ups:** `localNotifications.ts`; hook on login, refresh, completeIntake.

- **Date:** 2026-07-16
- **Decision:** **External live sessions only:** clients book via counselor **Calendly**; counselors paste optional **ephemeral join link** (`sessionJoinUrl`) for the next session. PTS never hosts video; no personal email/phone on client-facing counselor card.
- **Why:** Confidentiality without building Meet/Zoom; keeps identity/clinical data in PTS, media in external tool.
- **Alternatives considered:** In-app WebRTC (deferred); permanent personal Meet room on profile (rejected).
- **Consequences / follow-ups:** Migration `0034`; `/provider/profile` editor; `Join session` on `YourCounselorCard`.

- **Date:** 2026-07-16
- **Decision:** **APK builds on explicit request only** — agents finish a coherent mobile batch, deploy web/API when needed, do not run Gradle/APK install unless the user asks.
- **Why:** Iteration speed; avoid 10+ minute builds after every small change.
- **Alternatives considered:** Auto-build after every mobile change (rejected for this pilot phase).
- **Consequences / follow-ups:** `MOBILE.md`, `AGENTS.md`, `.cursor/rules/mobile-expo.mdc`, `.cursor/rules/pts-knowledge-base.mdc`.

- **Date:** 2026-07-17
- **Decision:** **Pain Script (`PainModelLearned`) is the sole product path.** Merge into `master` and stop maintaining a separate control/legacy cohort as the pilot product. Cohort B / pain-script is the only client experience going forward.
- **Why:** Pilot will run one coherent product; dual-branch A/B and master-control APK are deferred indefinitely.
- **Alternatives considered:** Keep A/B against master control (rejected for this pilot); leave branch unmerged (rejected — ops and docs drift).
- **Consequences / follow-ups:** Merge `PainModelLearned` → `master`; update `PILOT_TODO.md` to the corrected action queue; park control-APK §5 QA unless explicitly revived.

- **Date:** 2026-07-17
- **Decision:** **Music M1 quality filter** — YouTube resolver sanitizes search terms and drops titles matching Hz / solfeggio / “sound healing” / manifestation patterns; purpose-based instrumental queries are the default. LLM prompts forbid those search terms.
- **Why:** Live YouTube results skewed to pseudoscientific frequency-healing videos, conflicting with “no healing claims” music guidance.
- **Alternatives considered:** Manual curator-only catalog (deferred to M2); leave unfiltered (rejected).
- **Consequences / follow-ups:** Owned-IP M2 still after §16 Ramya sign-off. Probe `/api/health/youtube`.

- **Date:** 2026-07-17
- **Decision:** **Intake Tier 0 gates promoted into the live extract path** — max length 4000, stronger mash/diversity checks, per-user extract rate limit (20/hour via `llm_usage`), identical-text cache (memory + `intake_sessions`), and round-3 escape requires core fields (`painDescription`, `biggestChange`, `recoveryGoal`) rather than a blind force-through.
- **Why:** Protect OpenRouter spend and plan quality before pilot recruitment.
- **Alternatives considered:** Leave deferred until traffic (rejected — cheap and high leverage now).
- **Consequences / follow-ups:** Tier 1 on-topic classifier still deferred; see `docs/plans/2026-07-17-action-queue-corrected.md`.
