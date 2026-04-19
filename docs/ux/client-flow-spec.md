# Client UX Flow Spec (Draft)

Status: draft skeleton to unblock Sprint 1 UI work.
Scope: client-facing flow only (no provider console).
Non-goals: persistence, payments, messaging, analytics.

## Safety / scope boundaries
- This product is not medical advice.
- No guaranteed outcomes language.
- Red-flag routing is a placeholder: show clear guidance and encourage appropriate care.

References:
- docs/SAFETY_PRIVACY.md
- docs/SPRINTS.md (Sprint 1 acceptance criteria)

## Primary user and context
- Primary user: person with musculoskeletal chronic pain seeking a structured plan.
- Context: mobile-first, short sessions, high drop-off risk.

## Top-level IA (pages)
1. Landing / Start
2. Intake
3. Week plan (Week 1)
4. Daily checklist (Day view)
5. Weekly check-in
6. Help / safety

## Core happy-path (wire-level)
### Flow A: first-time user
1) Landing -> Start
2) Intake -> Summary -> Generate Week 1 plan
3) Week plan -> (pick a day) -> Daily checklist
4) Weekly check-in -> Week plan refresh (local-only)

### Flow B: returning within same session (no persistence)
- If local session state exists: resume at Week plan.
- Else: restart at Landing.

## Intake (minimal)
Goal: capture only what is needed to render a reasonable Week 1 plan.

Recommended sections (keep short):
- Pain area (single select)
- Duration (range)
- Current activity tolerance (simple scale)
- Constraints / equipment (checkboxes)

Validation:
- All questions optional except pain area.
- Clear inline errors; never block on long forms.

## Week plan page
Contents:
- Week objective (neutral language, no promises)
- Daily items list (7 days)
- Safety notice and link to Help / safety

Interactions:
- Select a day -> opens Daily checklist
- Edit: not in Sprint 1 (out of scope)

## Daily checklist
Contents:
- 3-7 actionable items (checkboxes)
- Pain rating / notes: optional and local-only

Interactions:
- Check/uncheck items
- End-of-day summary state

## Weekly check-in
Contents:
- Simple questions: adherence, perceived difficulty, pain trend
- Output: adjust next week plan locally (no persistence)

## Empty states and errors
- No JS / crash: show a basic fallback message and a restart button.
- Mid-flow refresh: if local state missing, route to Landing with an explanation.

## Open questions (need decisions)
- What is the delivery model (self-serve vs therapist-guided) for MVP copy tone?
- What is the primary success metric for Sprint 1?
- Which pain areas are in-scope for Sprint 1 (back/neck/knee/etc.)?
