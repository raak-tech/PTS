# Counselor Client Chart — IA & layer glossary

**Date:** 2026-07-15  
**Status:** Approved for implementation — **shipped** (see [`2026-07-15-counselor-chart-ia-ship.md`](2026-07-15-counselor-chart-ia-ship.md); KB [`../kb/COUNSELOR_WEB.md`](../kb/COUNSELOR_WEB.md))  
**Related:** Counselor work orchestration rethink; `docs/DECISIONS.md` (week-at-a-time, claim-on-action, AI draft / counselor author, Caseload+Chart 2026-07-15)

## Glossary — four data layers

| Layer | Name | Counselor question | Never client-facing until… |
|-------|------|--------------------|----------------------------|
| **1** | Client story | Who is this person? | Always visible to counselor; client sees only their own confirmable intake story |
| **2** | AI draft | What does the system recommend? | Week content is approved (Layer 3) |
| **3** | Counselor decisions | What have I decided? | Week approved / notes intentional |
| **4** | Lived action | What did they do? | After Week N is live |

### Layer 1 — Client story

Intake (pain source, description, activities affected, biggest change, goals, onset), safety flags, consent, flares, profile facts.  
Sources: `intake_responses`, `intake_sessions`, consent, flares, profile.

### Layer 2 — AI draft

Extraction summaries / confidence, formulation (pain_script cohort), Week N plan JSON drafts, watch points / themes.  
Sources: extract APIs, `formulations`, `plans` / `plan_weeks` (draft|edited).

### Layer 3 — Counselor decisions

Per-week edit + approve, holistic visibility, counselor notes, claim (`client_counselor`).  
Sources: plan week PATCH/POST approve, `counselor_client_notes`.

### Layer 4 — Lived action

Daily check-ins, calendar blocks, holistic completions, reinforcement / read-out responses, messages.  
Sources: `daily_check_ins`, calendar/holistic tables, `reinforcement_responses`, `messages`.

## Primary surfaces

### Caseload (`/provider/clients`)

Queue only. Sorted by urgency: safety → unread → week awaiting approval → generate needed → quiet.  
Each row: identity, Layer-1 one-liner, plan gate status, engagement chips (resilient — never infinite “Loading…”).  
Deep-links into Chart with `?tab=` / `?week=`.

### Client Chart (`/provider/clients/[id]`)

Single workplace. Persistent **Layer-1 context rail** on every mode.

| Mode (tab) | Primary layers | URL |
|------------|----------------|-----|
| Plan | 2 + 3 | `?tab=plan` |
| Activity | 4 | `?tab=activity` (alias: former overview activity + readouts patterns) |
| Messages | 4 | `?tab=messages` |
| Notes | 3 | `?tab=notes` (admin/counselor notes) |

Legacy: `overview` redirects into Chart with rail + activity summary; `readouts` maps to Activity.

### `/provider/plans`

Not a second home. Redirects to Caseload with `?filter=plans` (awaiting plan action).

## Week loop

1. Need Week N → AI draft (L2)  
2. Counselor reviews L1 + L4 + draft → edit/approve (L3)  
3. Client receives Week N → L4 accumulates  
4. Feeds Week N+1 draft  

## Theme & auth

- Light high-contrast console for counselor + admin Charts/Caseload.  
- Counselor/admin: email login. OTP: clients only.  
- Sign-out: POST only (no prefetchable GET revoke).

## Out of scope for this pass

Changing clinical gates, mobile client IA, or claim-on-first-action rules.
