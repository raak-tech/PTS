# PTS Knowledge Base

**Purpose:** Durable project memory for humans and Cursor agents — incidents, pitfalls, ops recipes, and product constraints so we do not relearn the same failures.

**Source of truth for execution:** [`../PILOT_TODO.md`](../PILOT_TODO.md)  
**Architecture decisions:** [`../DECISIONS.md`](../DECISIONS.md)  
**Build process:** [`../DEV_WORKFLOW.md`](../DEV_WORKFLOW.md)

---

## Contents

| Doc | What belongs here |
|-----|-------------------|
| [`INCIDENTS.md`](INCIDENTS.md) | Production/device crashes, broken releases, root cause, fix, prevention |
| [`MOBILE.md`](MOBILE.md) | Expo Router, APK/iOS builds, keyboard, auth on device |
| [`INTAKE.md`](INTAKE.md) | One-box intake, LLM extract quality, confirm UX |
| [`COUNSELOR_WEB.md`](COUNSELOR_WEB.md) | Counselor web Caseload + Client Chart IA, logout/auth pitfalls |
| [`OPS.md`](OPS.md) | Vercel, Neon, env sharing, test accounts, deploy commands |
| Current build plans | [`../plans/2026-07-17-clinic-b2b2c-buyer-layer.md`](../plans/2026-07-17-clinic-b2b2c-buyer-layer.md) · [`../plans/2026-07-17-action-queue-corrected.md`](../plans/2026-07-17-action-queue-corrected.md) |
| Ship notes | [`../plans/2026-07-16-intake-counselor-client-bridge-ship.md`](../plans/2026-07-16-intake-counselor-client-bridge-ship.md) |
| [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md) | Periodic human + agent review of this KB |
| [`CAPTURE_LOG.md`](CAPTURE_LOG.md) | Append-only log of KB updates (who/what/when) |

---

## Continuous capture (agents + humans)

### When you **must** write to the KB

After any of these, update the matching doc **in the same PR/commit session** (or immediately after):

1. App crash, blank screen, or “open and dies” on mobile/web
2. Fix that took more than one attempt / wrong root cause
3. Deploy/env pitfall (wrong API URL, empty secrets, region, cron)
4. New invariant (“never do X”) discovered in Expo/Next/RN
5. User-facing UX lesson that should constrain future design

### How to capture

1. Prefer updating an existing section over inventing a new file.
2. Use the templates in each file (status, date, symptoms, cause, fix, prevention).
3. Append one line to [`CAPTURE_LOG.md`](CAPTURE_LOG.md).
4. If the lesson should change agent behaviour forever, also mirror a **short** rule in `.cursor/rules/` (keep rules under ~50 lines).

Cursor skill: **capture-learning** (`.cursor/skills/capture-learning/SKILL.md`).

### What does **not** go here

- Active task lists → `PILOT_TODO.md`
- Long feature specs → `docs/plans/`
- Strategic backlog → `BACKLOG.md`
- Secrets / API keys → never commit; point to Vercel / secret manager

---

## Review mechanisms

| Cadence | Owner | Action |
|---------|-------|--------|
| **After every incident fix** | Agent + you | Capture in INCIDENTS + CAPTURE_LOG |
| **Before each APK / EAS iOS build** | Agent | Run `apps/mobile` `npm run check:routes`; skim MOBILE + INCIDENTS |
| **Weekly (pilot)** | Human | Walk [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md); prune stale/wrong entries |
| **Monthly** | Human + agent | Skill **kb-review**: flag contradictions vs code, merge duplicates, archive outdated |

Mark reviewed entries with `Reviewed: YYYY-MM-DD` in the entry footer.

---

## Agent entry point

Repo root [`AGENTS.md`](../../AGENTS.md) and `.cursor/rules/pts-knowledge-base.mdc` require agents to consult this KB before mobile/release work and to capture new learnings after incidents.
