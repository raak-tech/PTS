# PTS — Corrected Action Queue

**Purpose:** Re-ordered pickup list correcting Cursor's ranking against the *actual* current state.
**Reality check:** Cursor's list is anchored to `master` (build 14, early July). The live product frontier is the **`PainModelLearned`** branch — 15 commits ahead of master, updated 2026-07-17, pain-pilot **APK v33**. Several of Cursor's "highest impact" items are already shipped there.
**Date:** 2026-07-17

---

## What Cursor got wrong (already shipped on the branch)

| Cursor item | Reality |
|---|---|
| #2 Waiting-plan empty wait | **Largely built.** "Your counselor" card (public profile via `/api/me/contacts`), hybrid ready-pool, intake-only nudges, and today's commit *"connect intake readiness with counselor support."* Left: copy polish. |
| #5 Book / Join session empty states | **Built (Jul 16).** Join session CTA, counselor profile, Calendly + ephemeral `sessionJoinUrl`. |
| #6 Week 2+ generation + release | **Done (Run I).** Per-week sub-tabs, comment gate, `apply-week` propagation fix. Not "strong next." |
| #3 Today rhythm | **Mostly built.** Evening still-to-do, read-only program week, morning check-in (SCOPE-F). Only *device smoke* remains. |
| #12 RAG for counselor | **Not in any spec/backlog.** Cursor-invented scope. Ignore for now (it is the long-term scale bet, not a pilot task). |

---

## P0 — Gates to running the pilot at all (not features)

1. **Cohort / merge decision.** **Settled 2026-07-17:** Pain Script is the sole product; merge `PainModelLearned` → `master`. Control/legacy APK parked.
2. **Pain Script device QA on Pixel (APK v33).** Spec H device smoke (waiting-plan `formulationSummary`, week `personalizationBasis`, flare ≠ crisis) + Phase E `onsetType` end-to-end intake→formulation→plan. API is 9/9 but *not device-signed-off*.
3. **§16 clinical sign-off with Ramya.** Five open decisions: music M1/M2 direction, Ayurveda dietary sign-off authority, SD_BEHAVIOUR boundary, pilot modality set + authors, EAET staging. Cheapest high-impact item on the board — a meeting, not a sprint. Unblocks trustworthy holistic cards and all music work.
4. **Crisis escalation SOP + notification flow.** Still open (`PILOT_RECRUITMENT.md`). Platform decision is signposting-only, but the counselor-alert path (red flag → block delivery → counselor within SLA → escalate to Ramya) needs finalising and the notification coded. **Safety gate before any real user.**
5. **Pilot ops hygiene.** Generate pilot counselor invite codes, stand up Ramya's metrics dashboard (activation / intake→plan / DAU / SLA / red flags), finalise recruitment + screening script.

## P1 — Client-felt quality for pilot Week 1

6. **Music M1 quality tuning** *(Cursor #1 — keep at top of feature work).* **Done 2026-07-17:** search-term sanitize + Hz/healing title filter + purpose-based instrumental queries + prompt bans. Still needs device smoke + Ramya §16.
7. **Intake Tier 0 free gates** *(Cursor #8).* **Done 2026-07-17:** length cap, mash heuristics, rate limit, hash cache, round-3 core-field escape.
8. **Today rhythm device smoke** *(residue of Cursor #3).* Weekly check-in one-question flow + morning NRS on device.
9. **Counselor reply / "I'm struggling" response state** *(Cursor #4).* Make sent / waiting / replied obvious; keep crisis route clear. Trust lives here.

## P2 — After pilot signal

10. **Inactive re-engagement (2+ days)** *(Cursor #7).* Retention lever; not built (BACKLOG Track 5).
11. **Owned-IP music library M2** *(Cursor #11).* Correct sequence — only after M1 quality is good and §16 signs off.
12. **Payment / paywall gate.** Implement "pay after Week 1 approval" once the pricing model is decided (see GTM doc — currently undefined).

## Parked (correct calls by Cursor)

- **MSG91 real OTP, Sentry, staging** *(Cursor #10)* — go-live week only.
- **Control-APK §5 device QA** — only if cohort A runs.
- **RAG for counselor assist** *(Cursor #12)* — strategic scale bet, no pilot impact, no spec yet.

---

## One-line summary

Cursor's *instincts* (music quality, clinical sign-off) are right; its *ranking* is ~a week stale — re-recommending shipped work and missing the two things that actually gate the pilot: the **cohort/merge decision** and **Pain Script device QA**.
