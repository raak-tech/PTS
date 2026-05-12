# Sprint 2 Issue Plan

> Goal: turn the high-level Sprint 2 heading into a concrete, executable issue queue.

**Goal:** deliver the provider console and tighten consented persistence so providers can review assigned clients, make conservative plan updates, and work inside a clearly revocable storage model.

**Architecture:** keep the client flow working exactly as it does now, then layer provider-facing review screens on top of the consent-gated storage model. The Sprint 2 work should stay conservative: small, explicit updates; no marketplace/matching; no outcome promises; no persistence beyond the approved consent flow.

**Tech Stack:** Next.js app router, React, TypeScript, Drizzle ORM, PostgreSQL, Playwright.

---

## Sprint 2 live backlog

### Now
1. **#135 - Provider dashboard with assigned clients and review status**
   - Show workload, review status, red-flag alerts, and last check-in time.
2. **#136 - Client detail review panel with conservative weekly plan updates**
   - Show intake summary, plan snapshot, adherence snapshots, and review actions.
3. **#137 - Provider-client linking via invite code or admin assignment**
   - Define one concrete linking path and prevent access to unassigned clients.
4. **#138 - Granular consent controls and revocation behavior**
   - Separate provider access, reflections/free-text, and red-flags storage controls.
5. **#139 - Retention, export, and deletion audit trail for support data**
   - Make the persistence slice auditable and align it with the retention policy.
6. **#140 - Playwright coverage for provider workflow and consent controls**
   - Prove the provider and consent flows work together in the default suite.

### Next
7. Automatic 90-day retention cleanup after last activity.
8. Explicit lifecycle matrix for intake, plan, daily checklist, weekly check-in, and red-flags data.
9. Minimal admin compliance workflow for export / deletion fulfillment and audit handling.
10. Weekly provider review loop with structured artifacts and conservative plan adjustments.

### Later
11. Monitoring, logging, and automated quality gates for critical workflows.
12. Identity model expansion and provider-client reassignment/scaling rules.
13. Matching / marketplace-layer exploration only after the support workflow is stable.

---

## Open decisions to answer while implementing
- Do providers edit a reusable weekly template, or only a client-specific plan?
- What exact summary fields belong on the provider dashboard?
- Which review artifacts are persisted once consent is enabled?
- Should red-flags data stay off by default in Sprint 2, or get a separate explicit consent step later?

---

## Order to run
1. Provider dashboard (#135)
2. Client detail review panel (#136)
3. Provider-client linking (#137)
4. Consent controls / revocation (#138)
5. Retention/export/delete audit trail (#139)
6. Playwright coverage (#140)
7. Retention cleanup
8. Lifecycle matrix
9. Admin compliance workflow
10. Weekly provider review loop

