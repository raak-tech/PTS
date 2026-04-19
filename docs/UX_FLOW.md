# Client UX Flow (wire-level) — PTS

**Last updated:** 2026-04-19

Scope: client-side web UX for Sprint 1 routes:
- `/` (intake)
- `/plan`
- `/daily`
- `/check-in`
- `/red-flags`

Product posture reminders (must be consistent across routes):
- Support + structure only; **not medical advice**.
- **Not for emergencies**.
- No outcome guarantees.
- Sprint 1: **no persistence** of user-entered health/personal data (session-only UI state; no backend; no analytics).

---

## 1) Primary user journey (happy path)

### A. Start → Intake (`/`)
1) User lands on `/`.
2) Reads brief framing:
   - “Get a Week 1 Plan”
   - “lightweight, no-storage preview”
   - disclaimers: not medical advice; not for emergencies.
3) User completes required fields:
   - Primary pain area (text)
   - Primary goal for the next 2 weeks (text)
4) User leaves red-flags checkbox **unchecked**.
5) User taps **Generate Week 1 Plan**.
6) App routes to `/plan`.

### B. Plan → Daily (`/plan` → `/daily`)
1) User reads Week 1 overview (conservative pacing, consistency > intensity).
2) User clicks **Open Daily Checklist**.
3) App routes to `/daily`.
4) User checks items; sees progress count update.
5) Optional: user writes a short reflection (textarea).
6) User can return to `/plan` or `/`.

### C. Plan → Weekly check-in (`/plan` → `/check-in`)
1) User clicks **Open Weekly Check-in**.
2) App routes to `/check-in`.
3) User answers prompts; sees progress count update.
4) User returns to `/plan`.

---

## 2) Safety diversion journey (red flags)

### Intake routes to safety (`/` → `/red-flags`)
1) User checks **“I have possible red flag symptoms”**.
2) User submits intake.
3) App routes to `/red-flags`.
4) User reads “what to do next” guidance and returns to intake.

### Plan links to safety (`/plan` → `/red-flags`)
- From `/plan`, user can reach red-flags guidance (via safety/guardrails entry points).

---

## 3) Route specs (wire-level)

### Route: `/` (Intake)
**Primary goal:** collect minimal inputs + route user safely.

**Key UI blocks (top → bottom):**
- H1: “Get a Week 1 Plan”
- Intro paragraph: “lightweight, no-storage preview…”
- Disclaimers:
  - **Not medical advice.**
  - **Not for emergencies.**
- Form fields:
  1) `Primary pain area` (required, single-line text)
     - Helper: “Short and specific is fine. This stays on your device in Sprint 1.”
     - Placeholder: “e.g., Lower back”
  2) `Primary goal for the next 2 weeks` (required, single-line text)
     - Helper: “Something measurable and realistic… stays on your device…”
     - Placeholder: “e.g., Sleep better and return to short walks”
  3) `I have possible red flag symptoms` (checkbox)
     - Helper examples: weakness, bladder/bowel loss, fever + severe back pain, major trauma, unexplained weight loss.
- Primary CTA: **Generate Week 1 Plan**

**Validation / error states:**
- On submit with empty pain area:
  - Show inline error text: “Primary pain area is required.”
  - Set `aria-invalid=true` and focus the pain input.
- On submit with empty goal:
  - Show inline error text: “Primary goal for the next 2 weeks is required.”
  - Set `aria-invalid=true` and focus the goal input.

**Routing logic:**
- If red-flags checkbox checked → `router.push('/red-flags')`
- Else → `router.push('/plan')`

**Data rules:**
- Do not store/transmit inputs.

---

### Route: `/plan` (Week 1 Plan)
**Primary goal:** present a conservative Week 1 structure and route to daily/weekly tools.

**Key UI blocks:**
- H1: “Your Week 1 Plan”
- Framing paragraph: planning/reflection support only; not a substitute for professional care.
- Section: “Next step”
  - Links:
    - **Open Daily Checklist** → `/daily`
    - **Open Weekly Check-in** → `/check-in`
- Section: “Overview”
  - Copy: conservative start; static in Sprint 1; no personalization.
- Section: “Weekly focus”
  - Copy: consistency > intensity; keep effort comfortable; scale down if symptoms spike.
- Section: “Reflection prompt”
  - Bullet prompts (3 items).
- Section: “Daily Micro-practices”
  - List:
    - “2 minutes: breathing / grounding”
    - “5 minutes: gentle movement (comfortable range only)”
    - “2 minutes: values-based action (one small step)”
- Section: “Weekly check-in (preview)”
  - 3 bullet preview questions.
- Section: “Red flags: when to seek care”
  - Brief warning + examples.
- Guardrails component (repeated copy + **link to `/red-flags`**).

**Error states:**
- None (static page). Ensure links are present and not broken.

---

### Route: `/daily` (Daily checklist)
**Primary goal:** help users practice adherence with a tiny daily checklist (session-only).

**Key UI blocks:**
- H1: “Daily Checklist”
- Local-only note: “checkmarks stay in this browser session only (no storage, no syncing).”
- Progress counter: `completed/total`
- Section: “Today’s micro-practices”
  - Button: “Reset checklist” clears checkmarks and reflection.
  - Checklist items (3) with checkboxes:
    - grounding
    - movement
    - values-based action
- Optional reflection textarea:
  - Label: “Reflection (optional)”
  - Placeholder: “Optional. Not saved.”
- Guardrails component (with `/red-flags` link).
- Footer links:
  - “Back to Week 1 Plan” → `/plan`
  - “Back to intake” → `/`

**Error states:**
- None required; keep controls resilient.

---

### Route: `/check-in` (Weekly check-in)
**Primary goal:** capture a lightweight weekly reflection (session-only) that can later become therapist-visible.

**Key UI blocks:**
- H1: “Weekly Check-in”
- Local-only note (no storage, no syncing).
- Progress counter: `completed/total`
- Section: “Prompts”
  - Button: “Reset answers” clears textareas.
  - Prompts (3) as labeled textareas:
    1) “What did you do most days this week?”
    2) “What felt easier vs harder?”
    3) “What is one small adjustment you will try next week?”
- Guardrails component (with `/red-flags` link).
- Link: “Back to plan” → `/plan`

**Error states:**
- None required (optional completion). Avoid blocking submission since nothing is saved.

---

### Route: `/red-flags` (Safety guidance)
**Primary goal:** make safety boundaries concrete; instruct user to seek in-person evaluation.

**Key UI blocks:**
- H1: “Red flags: when to seek care”
- Disclaimers:
  - safety guidance only; not medical advice
  - not for emergencies; use local emergency services if urgent
- Section: “Examples of red flag symptoms” (list)
- Section: “What to do next” (list)
  - pause preview; seek in-person evaluation
  - emergency services if rapidly worsening / unsafe
- Link: “Back to intake” → `/`

**Error states:**
- None.

---

## 4) UX validation checklist (build-ready)

### Content + scope
- [ ] “Not medical advice” + “Not for emergencies” shown on `/` and `/red-flags`.
- [ ] Guardrails are visible on `/plan`, `/daily`, `/check-in`.
- [ ] No outcome promises; language is process-focused (adherence, pacing, reflection).

### Navigation
- [ ] `/` submit routes:
  - [ ] red-flags checked → `/red-flags`
  - [ ] otherwise → `/plan`
- [ ] `/plan` links to `/daily` and `/check-in`.
- [ ] `/daily` provides links back to `/plan` and `/`.
- [ ] `/check-in` provides link back to `/plan`.
- [ ] `/plan` or guardrails provide a visible link to `/red-flags`.

### Validation + accessibility
- [ ] Intake required fields show inline errors on submit.
- [ ] Error messages use `role="alert"`; inputs set `aria-invalid`.
- [ ] Focus moves to first invalid input on submit.
- [ ] Labels are present and properly associated with inputs.

### Data posture
- [ ] No backend calls; no persistence beyond in-memory React state.
- [ ] No analytics/telemetry events.
- [ ] Copy clearly states “local-only / not saved” where relevant.

### Resilience
- [ ] Reset buttons clear session state without reload.
- [ ] Refreshing the page clears state (expected in Sprint 1); copy does not imply persistence.
