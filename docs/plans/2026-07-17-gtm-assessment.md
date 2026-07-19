# Pain to Strength — GTM Assessment (v2.1)

**Date:** 2026-07-17
**Grounded in:** `PROJECT_BRIEF.md`, `DECISIONS.md`, `TRACK0_DECISIONS.md`, `PILOT_RECRUITMENT.md`, `BACKLOG.md` + GTM decisions locked this session.

## Decisions locked this session
1. **B2B2C only — no direct-to-consumer.** The middle-B aggregates and delivers users (CAC collapses) and is the payer (no charging a pain patient with cost + stigma barriers). Fits the "no marketplace / scale via program + RAG / human time is scarce" thesis.
2. **First design partner = physio / sports-med network** (Sagar's Rehab, Adyar, Chennai).
3. **Pricing unit = per active patient / month.**

---

## 1. The model

The **clinic is the buyer and the distribution channel**; the **patient is the end user**; **PTS is the psychological support layer alongside the physio's physical rehab.** The physio rebuilds the body; PTS works on the fear of re-injury, identity loss, motivation, and consistency that decide whether the patient follows through.

## 2. What you're selling (ROI to the clinic) — stated honestly

Physio home-exercise non-adherence runs ~30–50% and is the biggest reason rehab outcomes disappoint. **The honest claim:** PTS moves the *psychological drivers* of that non-adherence — it does **not** measure or verify the physio's exercise prescription (PTS's daily practices are psychological, not the rehab exercises). So what PTS actually improves and can prove:
- **Fear of re-injury (TSK-11) ↓** — an under-treated driver of dropout and repeat episodes
- **Pain self-efficacy (PSEQ) ↑** and **return-to-sport readiness ↑**
- **Consistency / reduced mid-rehab dropout** (retention)
- **A patient self-reported signal on doing their exercises** (labeled self-report, not device-verified)

These are causally upstream of the clinic's return-to-sport rate and time-to-function. Position it as *"we move the mindset that drives your outcomes, and we measure it,"* not *"we raise your exercise adherence."* (Verifying actual exercise completion = ingesting the physio's plan = the post-pilot wedge.)

> **Do not over-claim adherence.** Reporting PTS-engagement as rehab-exercise adherence is the one thing a sports-med clinician will catch instantly and it poisons trust in every other number. Keep PTS engagement and self-reported exercise adherence as two clearly separate, labeled metrics.

## 3. What this forces you to build (net-new, buyer-side)

Everything shipped is end-user (mobile client) or internal ops (`/admin`). B2B2C flips the customer; the buyer-side product barely exists. See the build brief (`docs/plans/2026-07-17-clinic-b2b2c-buyer-layer.md`):
- **Physio-referrer role + clinic org layer** — thin, not a second counselor Chart.
- **Clinic outcomes dashboard** — aggregate, de-identified. *This is the product you sell.*
- **Clinician-initiated enrollment** replacing self-serve signup.
- **Per-active-patient billing meter.**
- **Outcome instruments + a self-reported exercise-adherence item** (the honest adherence figure).

## 4. Outcome measurement (now contractual)

At intake + Week 6: TSK-11, return-to-sport readiness, PSEQ, PHQ-2/GAD-2. Daily: a single self-reported "did you do your exercises?" item. A pre/post delta joined to retention is the renewal case and, later, the insurer/employer wedge.

## 5. Clinical + data boundary

PTS is *alongside* physio, explicitly **not medical**. The physio sees engagement + high-level progress, **not** private counseling content — enforced at the API layer.

## 6. Regulatory / data — can no longer be parked

**DPDP Rules 2025 were notified 13–14 Nov 2025**, phased: consent-manager rules from Nov 2026, substantive obligations ~May 2027. A clinic partner will still want a data/consent answer and a sharing addendum now. Move "revisit before B2B" to **"resolve before first signed contract."** See `DPDP_CONSENT.md`.

## 7. The pilot — new shape

Old model (Ramya's network + social recruitment) is irrelevant. New gate = **Sagar's Rehab as design partner:**
1. Co-design the cohort (e.g. post-op ortho / ACL / chronic overuse).
2. Enrol at the **end of the first physio consult**.
3. Agree the **2–3 outcome measures the clinic cares about** up front (kinesiophobia, return-to-sport, dropout).
4. Run 6 weeks; deliver an outcomes read-out.
5. **Bake a per-active-patient price probe into the read-out.**

## 8. What you can reuse (most of the product)

Client mobile app, Pain Script model, counselor Chart, ready-pool + admin-allocate, Your-counselor card, external sessions via Calendly. The new build is the thin **buyer-side layer** + **instruments**, not a rebuild.

## 9. Open decisions

1. **Active-patient definition** (drives revenue) — see build brief Run 6.
2. **Counselor economics under the clinic funnel** — model hours-per-patient at the 12h SLA against the per-patient price.
3. **When to build verified adherence** (physio-plan ingestion) — the post-pilot wedge that makes the adherence claim literally true.
4. **Downstream payer later** — clinic pays, or clinic is a channel to an insurer/employer (B2B2B2C)? Changes the pricing ceiling.

## 10. Still-standing strategic question (unchanged by channel)

*How much human contact does a good outcome actually require?* Instrument **human-touch dosage** (counselor messages, session minutes, edit effort per patient) against retention + outcome delta. If outcomes hold at low dosage, the RAG scale thesis and your per-patient margin both work. Learn it at n=15, not n=500.
