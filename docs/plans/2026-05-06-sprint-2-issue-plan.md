# Sprint 2 Issue Plan

> Goal: turn the high-level Sprint 2 heading into a concrete, executable issue queue.

**Goal:** deliver the provider console and tighten consented persistence so providers can review assigned clients, make conservative plan updates, and work inside a clearly revocable storage model.

**Architecture:** keep the client flow working exactly as it does now, then layer provider-facing review screens on top of the consent-gated storage model. The Sprint 2 work should stay conservative: small, explicit updates; no marketplace/matching; no outcome promises; no persistence beyond the approved consent flow.

**Tech Stack:** Next.js app router, React, TypeScript, Drizzle ORM, PostgreSQL, Playwright.

---

## Sprint 2 issue queue

1. **#125 - Provider dashboard with assigned clients and review status**
   - Show workload, review status, red-flag alerts, and last check-in time.

2. **#126 - Client detail review panel with conservative weekly plan updates**
   - Show intake summary, plan snapshot, adherence snapshots, and review actions.

3. **#127 - Provider-client linking via invite code or admin assignment**
   - Define one concrete linking path and prevent access to unassigned clients.

4. **#128 - Granular consent controls and revocation behavior**
   - Separate provider access, reflections/free-text, and red-flags storage controls.

5. **#129 - Retention, export, and deletion audit trail for support data**
   - Make the persistence slice auditable and align it with the retention policy.

6. **#130 - Playwright coverage for provider workflow and consent controls**
   - Prove the provider and consent flows work together in the default suite.

---

## Open decisions to answer while implementing
- Do providers edit a reusable weekly template, or only a client-specific plan?
- What exact summary fields belong on the provider dashboard?
- Which review artifacts are persisted once consent is enabled?
- Should red-flags data stay off by default in Sprint 2, or get a separate explicit consent step later?

---

## Order to run
1. Provider dashboard (#125)
2. Client detail review panel (#126)
3. Provider-client linking (#127)
4. Consent controls / revocation (#128)
5. Retention/export/delete audit trail (#129)
6. Playwright coverage (#130)

