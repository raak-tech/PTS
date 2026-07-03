# Provider assignment (counselor ↔ client)

**Last updated:** 2026-07-03  
**Canonical queue:** [`PILOT_TODO.md`](./PILOT_TODO.md) §4

---

## Pilot model (current)

Counselors are linked to clients via the **`client_counselor`** table. There is **no invite-code flow** in production.

### When assignment happens

The **first counselor who acts** on a client claims them:

| Counselor action | Claims client? |
|------------------|----------------|
| Generate Week 1 draft (`POST /api/provider/generate-plan`) | Yes |
| Edit a plan week (`PATCH …/week/{n}`) | Yes |
| Approve a plan week (`POST …/week/{n}`) | Yes |
| Legacy full-plan approve (`POST /api/plans`) | Yes (insert-if-absent) |

Implementation: `apps/web/src/lib/claim-client-counselor.ts` — `onConflictDoNothing()` so the **first claim wins**.

### Queue scoping

Counselor lists (pending intakes, plans queue, clients, engagement) show clients that are:

- **Unclaimed** (no `client_counselor` row), or  
- **Assigned to the signed-in counselor**

Other counselors do not see claimed clients in their queues.

### Client-facing effects

- **Message counselor** (Today, waiting-plan, StrugglingFab) is hidden until a counselor is mapped.
- **Push notification** to the assigned counselor when the client submits a `counselor-share` artifact.

---

## Test accounts

| Phone | Role | Assignment |
|-------|------|------------|
| `9998887776` | Client (new intake) | Unmapped until a counselor generates Week 1 |
| `9988776655` | Client (approved plan) | Mapped to counselor who approved |
| `9900000002` | Counselor | Sees unclaimed + own clients only |

---

## Historical note

An earlier demo used browser-local invite codes. That slice is **not** the production model. See `DECISIONS.md` 2026-07-03 for claim-on-first-action.
