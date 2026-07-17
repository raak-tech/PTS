# Counselor mobile — Bridge mode

**Date:** 2026-07-16  
**Status:** Approved — implemented 2026-07-16  
**Related:** Web Chart IA [`2026-07-15-counselor-chart-ia.md`](2026-07-15-counselor-chart-ia.md); [`docs/kb/COUNSELOR_WEB.md`](../kb/COUNSELOR_WEB.md); [`docs/kb/MOBILE.md`](../kb/MOBILE.md)

## Goal

Tighten counselor **phone** so it bridges to the web **Caseload + Client Chart** workplace. Phone remains for quick clinical actions; web remains for deep work.

## Role matrix

| Capability | Counselor phone | Counselor web Chart |
|------------|-----------------|---------------------|
| Queue / Caseload urgency | Queue tab (Caseload-lite) | Caseload home |
| Layer-1 Client story | Snippet before Generate / Approve | Full Chart rail |
| Generate Week 1 | Yes + formulation escape to web | Yes on Caseload |
| Formulation review | Link only | Full UI |
| Week 1 approve | Yes | Yes |
| Weeks 2–6 edit / approve | Open Chart `?tab=plan&week=N` | WeekEditor |
| Read-out playback | Yes | Yes |
| Read-out record/edit | Prefer “Edit on web”; keep light if already present | Primary |
| Notes / Activity deep dive | Open Chart tabs | Notes / Activity |
| Messages | Native threads | Chart Messages |

## Layer map

| Layer | Phone | Web |
|-------|-------|-----|
| 1 Story | Snippet on Queue + plan-review | Chart rail |
| 2 Draft | Generate Week 1; view Week 1 | Formulation + WeekEditor |
| 3 Decisions | Week 1 approve only | Edit/approve all weeks, notes |
| 4 Lived | Engagement teaser + playback | Activity tab |

## Invariant

Every clinical dead-end offers **Open on web Chart** with `?tab=` (and formulation URL when generate fails for Pain Script).

## P0

1. `counselorWeb.ts` — `chartUrl`, `formulationUrl`, `caseloadUrl`
2. Generate-fail → formulation / Chart Alert actions
3. Layer-1 snippet (pain source, goal, safety) on pending intakes + plan-review
4. Remove cosmetic holistic switches; point to web Plan
5. Demote Apply week on client detail → Open Chart primary
6. Open Chart CTAs with tabs across Queue / Clients / Profile / Engagement
7. Queue badge: `markQueueViewed` on focus

## P1

1. Clients tab subtitle as directory vs Queue as home
2. Client detail Chart-lite: Story → Today → Messages → Plan/web; playback kept; heavy authoring → web
3. Engagement loading never infinite
4. KB / DECISIONS / PILOT_TODO / CAPTURE_LOG

## Out of scope

Formulation UI, WeekEditor, Notes CRUD, Chart tab shell, email login on mobile, “basic only” shrink.
