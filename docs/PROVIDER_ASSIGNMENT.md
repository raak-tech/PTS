# Provider assignment (counselor ↔ client)

**Last updated:** 2026-07-16
**Canonical queue:** [`PILOT_TODO.md`](./PILOT_TODO.md) §4

---

## Pilot model (current) — hybrid ready-pool

Counselors are linked to clients via the **`client_counselor`** table.

### Visibility

| Client state | Counselor Caseload |
|--------------|-------------------|
| Incomplete intake, unassigned | **Hidden** |
| Intake complete, unassigned | **Ready pool** (any counselor may claim) |
| Assigned | Only the assigned counselor |

Admins can assign/unassign from **Admin → client dossier → Allocate counselor** (`POST /api/admin/clients/[id]/assign`).

### When assignment happens

| Action | Claims / assigns? |
|--------|-------------------|
| Generate Week 1 draft (`POST /api/provider/generate-plan`) | Yes (first claim wins) |
| Edit a plan week (`PATCH …/week/{n}`) | Yes |
| Approve a plan week (`POST …/week/{n}`) | Yes |
| Legacy full-plan approve (`POST /api/plans`) | Yes (insert-if-absent) |
| Admin allocate | Sets / replaces assignment |

Implementation: `apps/web/src/lib/claim-client-counselor.ts` — `onConflictDoNothing()` so the **first claim wins**. Admin assign uses update/insert.

### Generate Week 1 gate

Requires completed intake (`intake_responses.completedAt`). Incomplete → `intake_incomplete` (no Generate button on Caseload).

### Client-facing effects

- **Message counselor** (Today, waiting-plan, StrugglingFab) is hidden until a counselor is mapped.
- **Your counselor** (assigned only): public profile via `GET /api/me/contacts` — see [`docs/kb/MOBILE.md`](./docs/kb/MOBILE.md). Not a directory/marketplace.
- **Push notification** to the assigned counselor when the client submits a `counselor-share` artifact.

---

## Test accounts

| Phone | Role | Assignment |
|-------|------|------------|
| `9998887776` | Client (new intake) | Hidden until intake complete; then ready pool |
| `9988776655` | Client (approved plan) | Mapped to counselor who approved |
| `9900000002` | Counselor | Sees ready-pool + own clients only |

---

## Historical note

An earlier demo used browser-local invite codes. That slice is **not** the production model. See `DECISIONS.md` 2026-07-03 for claim-on-first-action. Ready-pool after intake: 2026-07-16.
