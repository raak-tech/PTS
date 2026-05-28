# Provider workflow v0

## Goal
Define the therapist/provider weekly review loop for PTS so the product works as a therapist support platform, not only a client self-help flow.

This is a conservative v0:
- no marketplace / matching
- no persistence by default (Sprint 1)
- storage only after explicit consent (see `docs/CONSENT_AND_RETENTION.md`)

## Weekly loop

### 1) Review the client summary
A provider opens the client record and reviews:
- intake summary
- current week plan
- daily checklist completion
- weekly check-in responses
- red-flags status
- any recent notes or missing activity markers

Data handling reminder:
- Red flags are high sensitivity and are **not stored by default**.
- Free-text reflections are **not stored by default**.

### 2) Triage the week
The provider decides one of three paths:
- continue the current plan
- make a small conservative adjustment
- pause coaching and route to red-flags guidance if needed

### 3) Update the plan
The provider may update:
- weekly focus
- daily micro-practices
- pacing guidance
- reflection prompts

Changes should be small and explicit. No outcome promises.

### 4) Send or draft a message prompt
The provider may prepare a short prompt for the client, such as:
- what felt easier this week?
- what felt harder?
- what small adjustment should we try next?

### 5) Record the outcome of the review
The workflow should capture a simple review artifact:
- reviewed at timestamp
- review status
- plan changed or unchanged
- red-flags escalation if any

Sprint 1 note:
- These artifacts are conceptual only (no persistence). The UI can simulate the workflow in local-only state.

## Inputs
- intake summary
- plan version
- daily checklist completion snapshot
- weekly check-in responses
- red-flags indicator
- provider notes (future, consent-gated)

## Outputs
- weekly review status
- updated plan text or template
- client-facing prompt
- escalation / referral flag when needed

## Edge cases

### Missed check-in
If the client misses a check-in:
- mark the review as incomplete
- keep the plan conservative
- do not assume improvement or deterioration
- invite the client to resume with a small next step

### Red flags present
If any red flag is present:
- stop the normal coaching flow
- show /red-flags guidance
- do not offer exercise or progression advice
- recommend in-person evaluation or emergency help as appropriate

### Low adherence
If the client has low adherence:
- ask what got in the way
- reduce the scope of the next week
- keep the next action small and realistic

### No new information
If there is nothing new to review:
- keep the current plan
- log that the weekly review was completed
- avoid unnecessary churn

## Minimal provider console screens

### A) Provider dashboard
Purpose: show the provider their current workload.

Required elements:
- assigned clients list
- review status indicator
- red-flags alert if present
- last check-in time

### B) Client detail view
Purpose: show a single client in context.

Required elements:
- intake summary
- current plan
- weekly check-in snapshot
- daily adherence snapshot
- red-flags status
- buttons for continue / adjust / escalate

### C) Weekly review panel
Purpose: let the provider perform the review in a structured way.

Required elements:
- review notes
- plan adjustment draft
- escalation checkbox or action
- save / complete review action

## Non-goals for v0
- marketplace matching
- therapist scheduling
- payments
- full EHR replacement
- rich asynchronous messaging

## Relationship to consent + retention
This workflow should stay compatible with `docs/CONSENT_AND_RETENTION.md`:
- no persistence by default
- storage only after explicit consent
- red-flags data treated as highly sensitive

## Minimal acceptance criteria (for Sprint 2 provider console)
- Provider can only see assigned clients.
- Provider dashboard shows (at minimum): review status + last check-in time.
- Provider can mark review complete without editing health claims or promising outcomes.
- Consent gates must be respected for any stored artifacts.

## Open questions
- What exact summary fields are required on the provider dashboard?
- Do providers edit a reusable weekly template, or only a client-specific plan?
- Which review artifacts are persisted once consent is enabled?
