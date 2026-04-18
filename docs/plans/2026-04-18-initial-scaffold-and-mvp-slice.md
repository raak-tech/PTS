# Initial Scaffold + MVP Slice  Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to execute this plan task-by-task.

**Goal:** Turn this scaffold into a thin vertical slice for a pain-management therapy use case.

**Architecture:** Start with docs-first + safety/privacy constraints, then implement a minimal web intake  structured plan output flow. Keep components separable (web app  API) but dont overbuild.

**Tech Stack:** TBD (choose after brief). Candidate: Next.js (web) + FastAPI (API) + Postgres.

---

## Task 0: Confirm MVP slice (product)
**Objective:** Lock the smallest end-to-end user journey.

**Files:**
- Modify: `docs/PROJECT_BRIEF.md`

**Steps:**
1. Fill sections 15.
2. Define exactly one first session flow.

**Verify:** A reader can describe the MVP in 60 seconds.

---

## Task 1: Define safety boundaries & disclaimers
**Objective:** Ensure the MVP does not accidentally claim clinical authority.

**Files:**
- Modify: `docs/SAFETY_PRIVACY.md`

**Verify:** Boundaries + escalation paths are explicit.

---

## Task 2: Choose stack and create hello-world app skeletons
**Objective:** Create runnable web + API skeletons.

**Files:**
- Create: `apps/web/...`
- Create: `services/api/...`

**Verify:** `web` serves a page; `api` serves a health endpoint.

---

## Task 3: Implement Intake form  structured plan output (no persistence)
**Objective:** Collect minimal user inputs and produce a safe, structured response.

**Verify:** Manual test: submit intake; get a result with disclaimers.

---

## Task 4: Add persistence + consent (only if needed)
**Objective:** Decide if we store anything; implement consent + retention.

**Verify:** No data stored without explicit consent.
