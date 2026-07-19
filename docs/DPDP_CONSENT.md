# Data Protection & Consent — Pain to Strength (DPDP posture)

**Date:** 2026-07-17
**Audience:** two readers — (a) a clinic partner (e.g. Sagar's Rehab) doing due diligence, and (b) internal build/ops. Plain-language on top; obligations below.
**Regulatory context:** India's **Digital Personal Data Protection Act, 2023** and the **DPDP Rules, 2025** (notified 13–14 Nov 2025). Compliance is phased: procedural provisions are live now; **consent-manager** rules apply from **Nov 2026**; the **substantive obligations** (notice, consent, security safeguards, breach reporting, data-principal rights) apply from **~May 2027**. The pilot runs inside this runway — but the design below is built to those obligations now so nothing has to be retrofitted before scale.

---

## 1. Plain-language summary (for the clinic)

- Pain to Strength collects a patient's information **only to run their recovery program**, and only after the patient agrees.
- The patient explicitly opts in to share **engagement and progress** with your clinic. That's all you see — **never their private counseling conversations, notes, or reflections.**
- The patient can withdraw consent and delete their data at any time.
- We are **not a medical service** and don't hold your clinical records; your rehab prescription stays yours.

---

## 2. Roles under DPDP

| Party | Role | Meaning |
|---|---|---|
| The patient | **Data Principal** | Owns their rights; gives/withdraws consent |
| Pain to Strength | **Data Fiduciary** | Decides purpose + means; carries the compliance obligations |
| The clinic (Sagar's) | **Recipient of a limited, consented data set** | Receives only opt-in aggregate/engagement data; does not receive counseling content |
| OpenRouter + selected LLM provider | **Processor / subprocessor** | Processes intake to generate a plan draft; provider routing, retention, and contractual terms must be verified before the clinic pilot |

---

## 3. What we collect, why, and for how long

| Data | Purpose | Retention |
|---|---|---|
| Intake responses (situation, impact, goals, **health/pain info**) | Generate the personalised program | Raw intake **90 days**, then deleted; approved plan retained as program record |
| Daily engagement (PTS check-ins, practice completion, read-outs) | Deliver + adapt the program; derive **PTS program engagement** | Program lifetime; deletable on request |
| Self-reported exercise item ("did you do your physio exercises?") | A patient-reported adherence signal (self-report, not verified) | Program lifetime; aggregate shared with clinic |
| Messages with counselor, reflections | Counseling relationship | Program lifetime; **never shared with clinic** |
| Outcome measures (TSK-11, PSEQ, return-to-sport, mood screens) | Measure change; clinic ROI (aggregate) | Program lifetime; clinic sees **aggregate only** |
| Phone/OTP identity | Authentication | Account lifetime |

**Data minimisation:** the clinic-facing surface is a whitelisted projection (engagement + high-level progress). Counseling content is technically walled off at the API layer, not just hidden in the UI.

---

## 4. Consent design (two separate, specific consents)

DPDP requires consent that is **free, specific, informed, unconditional, and unambiguous**, with an easy withdrawal path. We capture two distinct opt-ins, each independently withdrawable:

1. **Program consent** (at intake): "I agree my information is used to build and run my recovery program, including processing by an AI service to draft my plan."
2. **Clinic-sharing consent** (at enrollment): "I agree to share my **engagement and progress** with [Clinic] so they can support my recovery. This does **not** include my private counseling conversations."

Withdrawal of (2) stops clinic sharing without ending the program. Withdrawal of (1) triggers data deletion / program close.

---

## 5. Data Principal rights (built into the product)

Access · Correction · **Erasure** (delete account → hard wipe, already implemented) · Withdraw consent · Grievance redressal · Nominate (per DPDP). A single in-app "Manage my data" path should route all of these; a named **Grievance Officer** contact is published before recruitment.

---

## 6. Security & governance

- Consent-gated storage; access controls by role; **counseling content unreachable by clinic/referrer accounts** (authorization-enforced).
- Audit logging of sensitive access (extends existing `/admin/audit`).
- Breach-notification process defined before go-live (DPDP requires notifying the Board + affected principals).
- **Cross-border transfer:** production database and function regions must be verified and documented (the repo targets Neon `ap-southeast-1` / Vercel `sin1`, but production configuration still needs confirmation). DPDP permits transfer except to countries the government restricts; the clinic addendum must disclose the verified locations. **India data residency remains on the pre-scale checklist.**
- **LLM retention:** do not promise zero retention until OpenRouter routing/privacy controls and the selected model provider's contract are confirmed. Record the approved provider path in ops documentation before recruitment.

---

## 7. What we ask of the clinic (Sagar's)

- Enroll only patients who complete the in-app consent — **do not collect PTS data on our behalf** outside the app.
- Use the clinic dashboard for care support only; **don't attempt to identify individuals** from aggregate views.
- Route any patient data request (access/deletion) to us — we're the Data Fiduciary.
- Sign a short **Data Processing / Sharing Addendum** alongside the pilot agreement.

---

## 8. Pilot vs. pre-scale (what's done vs. what's owed)

| Item | Pilot (now) | Before scale / paid B2B |
|---|---|---|
| Two-layer consent + withdrawal | **Required — build in Run 2/4** | Same |
| Erasure / account delete | ✅ implemented | Same |
| Grievance Officer named + published | Required | Same |
| Clinic Data Sharing Addendum | Lightweight, signed | Formal DPA |
| Breach-notification SOP | Documented | Tested |
| LLM processor/subprocessor + retention terms | Verify before recruitment | Formal processor terms |
| India data residency | Disclosed, deferred | **Resolve** |
| Consent Manager (DPDP) | Not required yet | Required from **Nov 2026** |
| DPO / formal audits | Not yet | If classified Significant Data Fiduciary |

---

## 9. One-paragraph answer if a clinic asks "is our patients' data safe?"

> "Patients share their information only to run their own recovery program, and only after explicit, specific consent. You see their engagement and progress so you can support them — never their private counseling conversations. Patients can correct or delete their data at any time. We operate as the Data Fiduciary under India's DPDP Act and its 2025 Rules, handle all data requests ourselves, and will sign a data-sharing addendum with you as part of the pilot."

---

*Draft for review with Ramya + legal. Not legal advice; confirm classification (health-service status, Significant Data Fiduciary threshold) with counsel before public launch.*
