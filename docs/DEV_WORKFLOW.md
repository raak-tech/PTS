# PTS Development Workflow — Analyze → Document → Code

**Version:** 1.0  
**Last updated:** 2026-07-02  
**Status:** Active — required for pilot execution work in `PILOT_TODO.md`  
**Supersedes:** Ad-hoc “code first, document later” for any multi-role or cross-surface change.

**Related:** `PILOT_TODO.md` (execution queue), `DECISIONS.md` (product/architecture decisions), `docs/plans/` (feature specs), `AUTOPILOT_POLICY.md` (automation boundaries).

---

## Why this exists

Build 11 shipped strong **API and client mobile** changes while **counselor web** still showed “6-week plan” copy and lacked read-out playback. Root cause: implementation started before all roles and surfaces were mapped.

**Rule going forward:** No coding on a `PILOT_TODO` item until the matching **feature spec** exists under `docs/plans/` and §9-style role matrix is filled in (or explicitly waived).

---

## When this workflow is required

| Trigger | Required? |
|---------|-----------|
| New feature touching **2+ surfaces** (e.g. mobile client + counselor web) | **Yes** |
| Change to **API contract** consumed by mobile and web | **Yes** |
| Copy/UX that affects **counselor clinical workflow** | **Yes** |
| Single-file bug fix with obvious scope | No — fix + note in `PILOT_TODO` |
| Docs-only change | No |
| Infra / dependency bump with no behaviour change | No |

When unsure, use the workflow. Cost is one short spec; benefit is avoiding misaligned surfaces.

---

## The four phases

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. ANALYZE  │ →  │ 2. SPECIFY  │ →  │ 3. REVIEW   │ →  │ 4. BUILD    │
│ roles/data  │    │ doc/plans   │    │ gate        │    │ + verify    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Phase 1 — Analyze (no code)

**Goal:** Understand impact across roles before proposing UI or API changes.

1. **Name the work package** — link to `PILOT_TODO.md` section/item (e.g. §9.2 Plan review queue).
2. **List surfaces** — client mobile, counselor web, counselor mobile, admin web, API, DB, push notifications, docs.
3. **Role journey map** — for each role, write *before → after* in 3–5 bullets (what they see, what they can do, what blocks them).
4. **Inventory current state** — what already exists (API fields, screens, copy). Grep/code read; do not assume.
5. **Gap table** — rows = surfaces, columns = feature aspects; cells = ✅ / ⚠️ / ❌.
6. **Dependencies & risks** — legacy paths (e.g. “Approve all weeks”), data migration, counselor habit change.
7. **Open questions** — list ambiguities; resolve in Phase 3 or record assumption in spec.

**Output:** Analysis section inside the feature spec (or draft issue). **No PR yet.**

---

### Phase 2 — Specify (document)

**Goal:** Single source of truth for what will be built.

Create or update: `docs/plans/YYYY-MM-DD-<short-name>.md`

**Required sections:**

| Section | Content |
|---------|---------|
| **Summary** | 2–3 sentences: problem, outcome, linked `PILOT_TODO` items |
| **Product rules** | Non-negotiable behaviour (e.g. Week-1-first, comment gate) |
| **Role impact** | Table: Role × Surface × Before × After |
| **API / data** | Endpoints, schema fields, who reads/writes |
| **UI changes** | Screen-by-screen: component, copy, states, errors |
| **Out of scope** | Explicit deferrals |
| **Acceptance criteria** | Testable checkboxes per role |
| **Test plan** | Test accounts, manual steps, regression areas |
| **Doc updates** | `PROVIDER_WORKFLOW.md`, `DECISIONS.md`, etc. |

Update `PILOT_TODO.md`:
- Link spec from the work item (`Spec: docs/plans/...`)
- Set status: `📋 Spec ready` → `🔨 In build` → `✅ Done`

If the change **amends a prior decision** (e.g. Week-1-first vs full 6-week generate), add an entry to `DECISIONS.md` *in Phase 2*, not after code ships.

---

### Phase 3 — Review gate

**Goal:** Confirm alignment before coding.

**Minimum for pilot (you + agent):**

- [ ] Spec exists and is linked from `PILOT_TODO.md`
- [ ] Role impact table covers **client, counselor web, counselor mobile** (and admin if relevant)
- [ ] Acceptance criteria are testable with listed test accounts
- [ ] Out-of-scope is explicit (prevents scope creep mid-build)
- [ ] No unresolved **blocking** open questions (assumptions OK if labeled)

**Optional for larger changes:** Satheesh/Ramya sign-off on counselor workflow copy.

**Waivers:** Rare. Record in spec: `REVIEW_WAIVED: <reason> <date>`. Autopilot may not waive counselor-clinical workflow changes.

**Output:** Spec status → `Approved for build` (checkbox in spec header).

---

### Phase 4 — Build and verify

**Goal:** Implement only what the spec describes; close the loop.

1. Implement in **dependency order** (API → web → mobile, unless spec says otherwise).
2. **One work package per dev run** when possible (matches APK drop rhythm).
3. After build: run acceptance criteria; mark items in spec and `PILOT_TODO.md`.
4. Update **feature inventory** in `PILOT_TODO.md` §9 (or relevant section).
5. Deploy web if API changed; note build number if mobile changed.

**Definition of done:** All acceptance criteria checked; `PILOT_TODO` updated; outdated docs listed in spec marked updated or ticketed.

---

## How to adhere consistently

### Document map (what goes where)

| Need | Document |
|------|----------|
| *What to build next* | `PILOT_TODO.md` |
| *How to build process-wise* | `DEV_WORKFLOW.md` (this file) |
| *Why we chose X* | `DECISIONS.md` |
| *How counselors work* | `PROVIDER_WORKFLOW.md` |
| *Detailed feature design* | `docs/plans/YYYY-MM-DD-*.md` |
| *Long-term product tracks* | `BACKLOG.md` |

### Agent / Cursor instructions

When starting a `PILOT_TODO` item, the agent should:

1. Read `DEV_WORKFLOW.md` and the linked spec (create spec if missing).
2. Refuse to write production code until Phase 3 gate is satisfied **or** user explicitly waives with reason recorded.
3. After coding, update spec acceptance criteria and `PILOT_TODO.md` in the same session.

**User phrase to enforce:** *“Follow DEV_WORKFLOW — spec first”* or *“§9 spec approved, proceed to build.”*

### Per dev run ritual (≈15 min before code)

1. Pick items from `PILOT_TODO.md` kickoff bar.
2. Confirm spec exists / write analysis for gaps.
3. Review role table aloud (or in chat) — client + counselor paths.
4. Approve build scope (what’s in / out this run).
5. Code → verify → update docs.

### Anti-patterns (avoid)

- Shipping API + client mobile without counselor visibility for the same data.
- Updating LLM behaviour without updating plan review UI copy.
- Marking `PILOT_TODO` done when only one surface is complete.
- Changing product rules without `DECISIONS.md` entry.

---

## Templates

### Feature spec header

```markdown
# <Title>

**Status:** Draft | Approved for build | Done  
**PILOT_TODO:** §X — item name  
**Created:** YYYY-MM-DD  
**Build target:** web deploy / APK N / both

## Summary
...
```

### Role impact row

| Role | Surface | Before | After |
|------|---------|--------|-------|
| Client | Mobile Today | … | … |
| Counselor | Web `/provider/plans` | … | … |

### PILOT_TODO item link

```markdown
- [ ] **Task name** — brief. Spec: `docs/plans/2026-07-02-....md`. Status: 📋 Spec ready
```

---

## Current application: Section 9

Section 9 (counselor web & mobile alignment) has a full spec:

**→ [`docs/plans/2026-07-02-section-9-counselor-alignment.md`](plans/2026-07-02-section-9-counselor-alignment.md)**

Do not start §9 coding until that spec is marked **Approved for build**.
