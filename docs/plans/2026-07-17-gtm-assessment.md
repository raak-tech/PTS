# Pain to Strength — GTM Assessment

**Date:** 2026-07-17
**Grounded in:** `PROJECT_BRIEF.md`, `DECISIONS.md`, `TRACK0_DECISIONS.md`, `PILOT_RECRUITMENT.md`, `BACKLOG.md`.
**Framing:** This is a working assessment, not a plan of record. It names the motion I'd run and the gaps that will bite before you can scale past the pilot.

---

## 1. Where you actually are

You've made most of the hard *product* decisions and very few of the hard *commercial* ones. Decided: brand ("Pain to Strength"), mobile-only client / web counselor, two pilot personas (general health disruption + sports/activity injury, Chennai), counseling-led scope, 12h SLA, credentialing, no marketplace, external live sessions, scale-via-program+RAG rather than 1:1 human headcount.

**Undecided and load-bearing for GTM:** who pays, how much, through what channel, and whether counselors are compensated. `BACKLOG.md` Track 0 still lists "business model (D2C / B2B / both)" and "pricing and access model" as open 🟠, and `DECISIONS.md` has **no pricing entry**. The pilot as currently specced measures engagement, not willingness-to-pay or outcome. That's the core gap.

---

## 2. The motion I'd run

**Primary wedge — physio / ortho clinic referral, D2C in Chennai.** Your own brief is the pitch: *"the physio fixes the knee; nobody helps with the fear of re-injury, the identity loss, the anxiety."* That is a referral handoff at the exact moment of need, from a clinician who already has the patient's trust and no product to hand them for the psychological half. This beats social/network recruitment on CAC, intent, and defensibility. It is missing today: there is no clinician referral link, no partner view, no "refer a patient" surface. Build the referral as a product, not a favour.

**Why not the alternatives first:**
- **Broad D2C / paid social** — high CAC into a stigmatised, low-intent audience; save it for after you have outcome proof.
- **B2B (employer / insurer / TPA)** — biggest TAM (workplace-injury and motor-accident claims in India), but you deferred the workplace persona for legal reasons, and it needs data residency + regulatory posture you've explicitly parked. Right *second* act, wrong *first*.
- **Sports academies / gyms / sports-med** — a clean, motivated cohort and a good secondary channel once the clinic playbook works.

**Sequence:** clinic-referral D2C pilot (prove outcome + willingness-to-pay) → productise the referral channel + 2–3 anchor clinics → then open a B2B conversation (employer/insurer) *armed with outcome data*.

---

## 3. What's missing — the honest list

**A. Monetisation is undefined.** No price, no payer, no willingness-to-pay test. The deferred note ("pay after Week 1 approval") is a *placement* instinct, not a model. **Add a price test to the pilot** even if the pilot is free — a fake-door ("after the free pilot this would be ₹X/month — would you continue?") or a paid second cohort. Without this you'll scale a thing you can't charge for.

**B. No outcome measurement.** For a pain product this is the whole ballgame — it's your D2C conversion proof, your clinic-referral credibility, and eventually your B2B/insurer wedge. Current pilot metrics are all *process* (activation, retention, SLA). Add validated instruments at intake and Week 6: **Pain Self-Efficacy Questionnaire (PSEQ)**, **Pain Catastrophizing Scale (PCS)**, **Brief Pain Inventory (BPI)** for interference, plus **PHQ-2/GAD-2** for mood. A pre/post delta is the single most valuable artifact the pilot can produce.

**C. Acquisition is a channel, not an engine.** Recruitment leans on Ramya's network + social. That gets you 10–20 people, not a business. The engine is the clinic-referral loop in §2 — it needs a build (referral link, attribution, a light partner dashboard) and a value exchange for the referrer.

**D. Counselor supply economics.** You've correctly named human time as the scarce factor and bet on RAG to relieve it — but counselor **compensation is undefined** (BACKLOG Track 7, 🟡). Unpaid pilot goodwill does not scale into supply. Model caseload economics now: revenue per client ÷ counselor hours per client (formulation + Week-1 + weekly edits + sessions + messages) at your 12h SLA. That ratio decides whether the unit works and how much RAG has to offload.

**E. Retention isn't built.** Drop-off before Week 3 is your listed top risk; the re-engagement flow is unbuilt. Daily engagement *is* the product — a retention hole is a product hole, not a growth afterthought.

**F. No competitive positioning.** You're adjacent to EAP/mental-health apps (Wysa, Intellect, Amaha/InnerHour, YourDOST in India) and to MSK digital-care (Hinge Health, Sword, Kaia globally). Your differentiator is real and narrow: **pain-specific + counseling-led + human-in-the-loop + works alongside physio.** Write that positioning down and pressure-test it, or you'll get pattern-matched to "another therapy app."

**G. Regulatory / data at scale.** Fine to defer for a small pilot (your call is defensible). But India's **DPDP Act** and data residency come due *before* any paid public launch or B2B contract — and B2B buyers will ask on day one. Put a "revisit before B2B / paid launch" stake in the ground so it doesn't ambush a deal.

**H. Crisis SOP.** Operational safety gap for real users (see action queue P0 #4). This is table stakes before recruitment, and it's also a *trust* asset in the clinic pitch — clinicians won't refer if they can't see the safety net.

---

## 4. The one strategic question underneath all of it

You want clients to feel they *"always interact with a human,"* and you've architected RAG/program to avoid the human becoming the growth bottleneck. Those pull in opposite directions, and you've half-resolved it by gating humans where they matter (formulation, Week 1, safety, sessions). Good — but the *actual variable that decides your economics and your ceiling is unknown*: **how much human contact does a client need to get the outcome and stay?**

Your current pilot won't answer that. It measures whether people engage, not how much human touch the outcome required. I'd make that the pilot's headline learning objective: instrument **human-touch dosage** (counselor messages, session minutes, edit effort per client) against **retention and outcome delta**. If good outcomes hold at low human dosage, your RAG scale thesis is validated and you can price aggressively. If they only hold at high dosage, you have a services business wearing a software costume — better to know at n=15 than n=500.

---

## 5. Concrete pilot additions (cheap, high-signal)

1. **Outcome instruments** at intake + Week 6 (PSEQ, PCS, BPI, PHQ-2/GAD-2).
2. **Willingness-to-pay probe** (fake-door price or paid second cohort).
3. **Human-touch dosage tracking** per client (messages, session minutes, edit time) joined to retention/outcome.
4. **One clinic partner** for referral — even one physio/ortho practice — to test the channel that has to work.
5. **Counselor economics one-pager** — hours per client at 12h SLA × pilot caseload → revenue needed per client to make it sustainable.

---

## 6. Decisions I need from you to go further

1. **Payer & model:** D2C subscription, per-program fee, or B2B-first? And is the pilot free, price-tested, or paid?
2. **Primary channel:** commit to clinic-referral as the wedge, or keep it network/social for now?
3. **Human-touch dosage:** are you willing to make "minimum human contact for a good outcome" the pilot's headline question — and instrument for it?
