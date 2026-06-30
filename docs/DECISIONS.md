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
