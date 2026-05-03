# Consent + Retention (PTS)

This document defines how PTS handles consent, storage, retention, deletion, and data minimization.

**Status:** Draft (must be approved before adding persistence beyond ephemeral UI state)

---

## 1) Principles (non-negotiable)

1) **Data minimization by default**
- If we can deliver the product without storing something, we do.
- Store the minimum necessary for provider workflow and continuity of care.

2) **Explicit informed consent**
- Storage only happens after explicit user consent.
- Consent must be understandable and revocable.

3) **Separation of concerns**
- Client experience must work even if provider console is not yet enabled.
- Sensitive content is treated with stricter defaults.

4) **Safety posture**
- PTS is not medical advice.
- PTS is not for emergencies.
- Red flags block coaching flow.

---

## 2) Roles

- **Client:** program participant.
- **Provider:** therapist/coach supporting a client.
- **Admin:** operational role (support + compliance). (May be future, but must exist conceptually.)

---

## 3) Data classes + sensitivity

### A) Intake (moderate sensitivity)
**Examples:** pain area, duration, constraints, goals, preferences.

### B) Plan (low to moderate sensitivity)
**Examples:** week plan text, daily checklist template, pacing guidelines.

### C) Daily checklist completion (moderate sensitivity)
**Examples:** checkmarks, adherence progress, optional reflection note.

### D) Weekly check-in (moderate sensitivity)
**Examples:** perceived difficulty, confidence, barriers.

### E) Red flags (high sensitivity; special handling)
**Examples:** potential emergency symptoms, serious warning signs.

---

## 4) What is stored (and what is NOT)

### Default: no persistence
Until consent is granted, we only allow **ephemeral UI state**.

### After consent: minimal persistence for continuity + provider workflow
If consent is granted, we may store:
- Intake summary (not raw free-text by default)
- Plan version(s)
- Daily checklist completion events (date/time + item id)
- Weekly check-in responses

### Never store by default
- Red flags answers (store only if we add an explicit, separate consent step + clear rationale).
- Full raw reflection notes (store only if explicitly consented; otherwise keep local-only).

---

## 5) Consent UX requirements

Consent must be:
- **Explicit:** a checkbox or equivalent affirmative action.
- **Informed:** clearly states what is stored, for how long, and why.
- **Granular (preferred):** separate toggles for:
  - provider access
  - saving reflections/free-text
  - storing red-flags related data (default off)
- **Revocable:** client can withdraw consent.

Withdrawal behavior:
- New data stops being stored immediately.
- Existing stored data is handled per retention rules (see deletion).

---

## 6) Retention policy (initial)

Unless overridden by jurisdiction-specific requirements:
- Retain client program data for **90 days** after last activity.
- Then delete automatically.

Provider notes (if introduced later):
- Retain for **180 days** after last activity (subject to review).

Red flags:
- Default: not retained (not stored).

---

## 7) Deletion + export requirements

### Client controls
- Export: client can export their stored plan + check-in summary in a human-readable format.
- Delete: client can request deletion of stored data.

### Provider controls
- Provider can export a client summary for session use.
- Provider cannot bypass client deletion.

### Admin controls
- Admin can fulfill deletion/export requests and audit actions.

---

## 8) Security + access control baseline

- Auth required for any persisted data access.
- Role-based access control (RBAC): client sees own data; provider sees assigned clients.
- Audit log required for provider/admin actions on client data.
- Secrets never committed.

---

## 9) Open decisions (must be answered before implementation)

1) Identity model
- Email/password? magic link? provider-invited clients? OAuth?

2) Provider-client linking
- How does a provider get access to a client? invite code? assignment by admin?

3) Storage scope
- Do we store reflections/free-text? default off? separate consent?

4) Jurisdiction posture
- Any HIPAA/PHI requirements in target market? (If yes, tighten retention + controls.)

---

## Acceptance Criteria for enabling persistence

We can implement persistence only after:
- This doc is merged, and
- we have explicit answers for the Open Decisions section, and
- we implement consent UI + tests for:
  - consent gating
  - export
  - delete
