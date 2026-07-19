# PTS — Current Action Queue

**Date:** 2026-07-17
**Product:** Pain Script is merged to `master` and is the sole product line.
**GTM:** B2B2C only; Sagar's Rehab is the first physio design partner.
**Build spec:** [`2026-07-17-clinic-b2b2c-buyer-layer.md`](2026-07-17-clinic-b2b2c-buyer-layer.md)

## Completed today

- Pain Script merged to `master`; control cohort parked.
- APK v34 built; awaiting Pixel device QA.
- YouTube Music M1 filters Hz/solfeggio/healing claims.
- Intake Tier 0 length/mash/rate/cache/core-field gates shipped.
- GTM v2.1 separates PTS program engagement from patient self-reported physio-exercise completion.
- Clinic B2B2C build spec, DPDP posture, and dashboard mockup synchronized into the repo.

## P0 — Before recruiting clinic patients

1. **Pixel QA (APK v34):** Spec H, onset type, flare ≠ crisis, and non-Hz music playback.
2. **Ramya §16 sign-off:** Music M1/M2, Ayurveda authority, SD_BEHAVIOUR, modality set, EAET.
3. **Crisis escalation SOP:** signposting, counselor SLA, escalation to Ramya, notification behavior.
4. **DPDP/contract gate:** legal review, grievance officer, clinic sharing addendum, breach SOP.
5. **Baseline instruments live before first enrollment:** pre-measure cannot be recovered later.

## P1 — Clinic buyer-layer build

1. **Run 1 (in build):** clinic tables, membership role, enrollment attribution, code foundation, Sagar's seed.
2. **Run 2:** clinician enrollment code + separate clinic-sharing consent.
3. **Run 3:** clinic-scoped, whitelisted referrer API/UI; explicit cross-clinic and counseling-content denial tests.
4. **Run 4:** TSK-11/RTS/PSEQ baseline + Week 6, PHQ-2/GAD-2, daily physio-exercise self-report.
5. **Run 5:** aggregate dashboard; `n<5` suppression; PTS engagement and exercise self-report remain separate.
6. **Run 6:** active-patient billing meter after the billing definition is approved.

## Decisions still required

- Exact active-patient definition (Run 6).
- Clinic-sharing consent placement (Run 2; separate enrollment consent is recommended).
- Whether Sagar's needs both referrer and clinic-admin views.
- Instrument length: minimum TSK-11 + RTS + PSEQ; whether to include PCS.
- Named grievance officer and approved clinic data-sharing addendum.
- Counselor hours/cost per patient at the 12-hour SLA.

## Parked

- D2C/paywall.
- Verified exercise adherence via physio-prescription ingestion.
- Owned-IP music M2 until §16.
- RAG counselor assist until a pilot spec exists.
- Control APK QA.
