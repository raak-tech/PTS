# Decision Log

Use this to record decisions that affect architecture, product scope, safety/privacy posture, and why we made them.

## Template
- **Date:** YYYY-MM-DD
- **Decision:**
- **Why:**
- **Alternatives considered:**
- **Consequences / follow-ups:**

## Decisions
- **Date:** 2026-04-18
- **Decision:** Create initial repo scaffold under `/home/satananth/projects/PTS`.
- **Why:** Establish a stable place to capture scope + safety/privacy constraints and iterate quickly.
- **Alternatives considered:** Start inside Hermes runtime (rejected), keep as unstructured notes (rejected).
- **Consequences / follow-ups:** Pick MVP stack, write first vertical-slice plan in `docs/plans/`.

- **Date:** 2026-04-19
- **Decision:** Delivery model is a structured 6-week program; Sprint 1 ships a self-serve client web flow (no persistence) with safety guardrails.
- **Why:** Matches the project brief: program cadence first, minimal data posture, and clear boundaries (not medical advice; no outcome guarantees).
- **Alternatives considered:** Unlimited chat-first product (rejected for scope/safety), outcome-based metrics in MVP (rejected; process-first).
- **Consequences / follow-ups:** Primary MVP metric is activation (intake completed -> user reaches /plan). Defer data storage + analytics until explicit consent + retention policy.
