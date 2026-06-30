# PTS — Scope Completeness & Business Opportunity Report

**Date:** 2026-06-30  
**Method:** Deep research — 111 agents, 28 sources fetched, 97 claims extracted, 25 adversarially verified (5 confirmed, 20 killed)  
**Audience:** Satheesh, Ramya, and any investor/partner conversations  

---

## PART 1 — Scope Completeness Audit

### Overall verdict

The document corpus has a coherent product vision, but contains **three classes of critical gap** that must be resolved before development begins:

1. The per-week approval and counselor plan-editing requirement exists in only one document and is absent from every actionable artefact (backlog, schema, sprint plan)
2. Eight Track 0 strategic decisions remain openly unresolved, and at least seven of them directly block pilot-critical build items
3. The dual auth model (web email/password vs mobile OTP) creates an undefined cross-surface user path with no resolution anywhere

---

### Finding A — Per-week approval + counselor plan editing: not threaded through documents
**Severity: Blocks pilot**

`PROJECT_STATUS_REVIEW.md` defines this requirement in full: `planWeeks` table schema, per-week status lifecycle (draft / edited / approved), client visibility gated to approved weeks only, and the counselor inline editing workflow. It is explicitly named as *"non-negotiable before first pilot user."*

However:
- `BACKLOG.md` references it only as a single opaque 🟠 pre-launch item with no acceptance criteria
- `PROVIDER_WORKFLOW.md` describes a weekly review loop but has no mention of the `planWeeks` table or inline editing
- `SPRINTS.md` has no sprint containing this work
- `schema.ts` has only a `plans` table with a two-value `status` field (`draft` / `approved`) — no `planWeeks` table, no per-week status column

**Resolution required:** Add `planWeeks` as a 🔴 pilot-critical backlog item with full acceptance criteria. Add a DB migration task. Update `PROVIDER_WORKFLOW.md` and `SPRINTS.md` to include this work before any other provider UI work begins.

---

### Finding B — Eight Track 0 decisions unresolved, blocking 7+ pilot items
**Severity: Blocks pilot**

`TRACK0_DECISIONS.md` lists decisions #17–#24. `DECISIONS.md` records only 4 decisions (all April–May 2026), none of which resolve any Track 0 item. Specific blocking chains:

| Decision | What it blocks in BACKLOG |
|---|---|
| #19 Counseling vs therapy scope | Track 1 FAQ copy, Track 2 consent language, Track 7 counselor profile copy |
| #21 Credentialing criteria | Track 7 "Build credential verification workflow" (🔴) |
| #20 Regulatory posture (India/global) | Track 9 Singapore server region, data residency — yet BACKLOG already specifies `sin1` as 🔴 without awaiting this decision |
| #23 LLM data policy | Track 3 plan generation consent screen (clients must consent to LLM processing) |
| #24 Pilot metrics | Not defined anywhere with acceptance criteria; `PROJECT_BRIEF.md` defines different success criteria to `TRACK0_DECISIONS.md`, creating a contradiction |

**Resolution required:** Run the 1-week decision sprint described in `TRACK0_DECISIONS.md` before recruiting pilot users. Document outcomes in `DECISIONS.md`. Until #20 is resolved, the Singapore region decision should not be treated as final.

---

### Finding C — Dual auth creates undefined cross-surface path
**Severity: Blocks pilot**

`MOBILE_APP_UX.md` specifies OTP-only authentication (+91 India). The web app uses email/password. `PROJECT_STATUS_REVIEW.md` flags this explicitly: *"there is no clear path for a client who starts on mobile and wants to continue on web."*

For a mobile-OTP-first India pilot, any client who receives a web link (e.g. a plan-ready email) would be unable to authenticate on web. No backlog item addresses auth unification or cross-surface resume. The `schema.ts` `users` table supports both (phone nullable), but the flow is undefined.

**Resolution required:** Add a backlog item: define auth surface boundaries for the pilot. Options: (a) mobile-only pilot — no web client access; (b) add OTP login to web; (c) allow phone-verified users to set a password post-registration. Decision must feed into the intake consent screen and session handling.

---

### Finding D — MOBILE_APP_UX.md and PROJECT_STATUS_REVIEW.md directly contradict on plan review
**Severity: Degrades quality (clinical safety risk)**

`MOBILE_APP_UX.md` (May 2026) describes P4 Plan review as showing "Weeks 1–6 expandable accordion." `PROJECT_STATUS_REVIEW.md` (June 2026) states the mobile plan review shows only Week 1. `MOBILE_UX_REVIEW.md` then recommends adding the accordion as a new feature — implying it does not currently exist.

The status review is more recent and codebase-verified. `MOBILE_APP_UX.md` is out of date on this point.

**Resolution required:** Update `MOBILE_APP_UX.md` Screen P4 to reflect actuality. Add "show all 6 weeks in mobile plan review" as a 🔴 backlog item. This is a patient-safety issue — counselors approving plans without seeing Weeks 2–6.

---

### Finding E — Post-Week-6 state is undefined everywhere and unbuilt
**Severity: Degrades quality (pilot retention risk)**

`PROGRAM_TEMPLATE.md` defines Week 6 as "consolidation, maintenance, and next steps" with a 4-week maintenance plan as the primary Week 6 CTA. However:
- No backlog item exists for: graduation screen, post-Week-6 app state, maintenance mode, monthly check-in, or plan extension
- `MOBILE_APP_UX.md` has no post-Week-6 screens in its inventory
- `MOBILE_UX_REVIEW.md` lists this as open question OQ-3

The program template implies a continuation feature that has no corresponding implementation or backlog item.

**Resolution required:** Add backlog items for: (a) graduation screen at Week 6 completion; (b) maintenance mode state in the mobile Program tab; (c) monthly check-in cadence API. These are required before any pilot client completes Week 6.

---

### Finding F — Schema missing `dailyCheckIns` table despite morning check-in defined as core clinical data
**Severity: Degrades quality**

`MOBILE_APP_UX.md`, `MOBILE_UX_REVIEW.md`, and `PROJECT_STATUS_REVIEW.md` all define the morning check-in (pain level, sleep quality, intention) as a primary screen and clinical data source. `PROJECT_STATUS_REVIEW.md` explicitly calls for a `dailyCheckIns` table.

`schema.ts` has `weeklyCheckIns`, `eveningReflections`, `dailyReinforcements`, `dailyCalendarEntries`, `dailyScheduleFeedback` — but no `dailyCheckIns`. The counselor's engagement dashboard therefore has no longitudinal pain-level data.

**Resolution required:** Add `dailyCheckIns` migration to the pre-pilot schema sprint. Add morning check-in card to the mobile Today tab as a🔴 item.

---

### Finding G — PROVIDER_WORKFLOW.md and PROJECT_STATUS_REVIEW.md contradict on the weekly planning model
**Severity: Blocks pilot (determines which UI to build)**

`PROVIDER_WORKFLOW.md` describes counselors authoring weekly updates from scratch each week. `PROJECT_STATUS_REVIEW.md` defines an LLM-first model where the counselor edits AI-generated content inline and approves per week.

These produce different UX surfaces, different data models, and different clinical responsibility allocation. No document resolves which is canonical.

**Resolution required:** This is the single most important architectural decision before the counselor workspace is built. Agree the model (LLM-first with counselor editing is strongly recommended — it is what the product brief describes and what Ramya's clinical role implies), update `PROVIDER_WORKFLOW.md` to reflect it, and retire the scratch-authoring framing.

---

### Finding H — Intake trigger timing marked 🟠 but intake completion screen assumes 🔴 behaviour
**Severity: Degrades quality**

`BACKLOG.md` Track 2 marks "Define what triggers plan generation: immediate or after counselor review signal" as 🟠 (pre-launch, not pilot-critical). But `MOBILE_APP_UX.md` Screen C8 says "Counselor reviews within ~24 hours; message when plan is ready" — implying counselor-review-triggered generation. If trigger timing is deferred (🟠), the intake completion screen copy is wrong.

**Resolution required:** Promote to 🔴 and decide: is plan generation immediate on intake submit, or does the counselor trigger it? The answer changes the C8 screen copy, the waiting-for-plan state, and counselor notification requirements.

---

### Finding I — Six MOBILE_UX_REVIEW.md recommendations have no backlog items
**Severity: Degrades quality (two items patient-safety relevant)**

The UX review's section 9 change list has not been converted into backlog items. Missing entries include:
- 6-box OTP split input
- C7 safety check split into 2 screens with rewritten copy (**patient safety**)
- NRS face scale replacing pain slider
- Crisis notes acknowledgment gate before plan approval (**patient safety**)
- `theme.ts` design tokens before any screen build
- Tab badge lifecycle definition

**Resolution required:** Convert all 12 MOBILE_UX_REVIEW.md section 9 items into backlog entries before Expo development begins. The two patient-safety items (C7 split, crisis acknowledgment gate) should be 🔴.

---

### Consolidated gap table

| Gap | Severity | Document to update | Backlog action |
|---|---|---|---|
| planWeeks table + per-week approval | Blocks pilot | BACKLOG, SPRINTS, PROVIDER_WORKFLOW, schema | Add 🔴 item with schema migration |
| Track 0 decisions (#17–#24) unresolved | Blocks pilot | DECISIONS | 1-week decision sprint before recruitment |
| Dual auth cross-surface path undefined | Blocks pilot | BACKLOG, MOBILE_APP_UX | Add 🔴 auth boundary decision item |
| Mobile plan review shows Week 1 only | Clinical safety | MOBILE_APP_UX, BACKLOG | Add 🔴 item: all 6 weeks in mobile review |
| Post-Week-6 state undefined | Pilot retention | BACKLOG, MOBILE_APP_UX | Add 🟠 items: graduation, maintenance mode |
| dailyCheckIns table missing | Clinical data | schema, BACKLOG | Add to pre-pilot schema sprint |
| Weekly planning model ambiguous | Blocks UI build | PROVIDER_WORKFLOW | Resolve with Ramya, update PROVIDER_WORKFLOW |
| Intake trigger timing wrongly deferred | Copy/UX gap | BACKLOG | Promote to 🔴, decide the model |
| 6 UX review items not in backlog | Quality/safety | BACKLOG | Convert all 12 items, 2 as 🔴 |

---

## PART 2 — Business Opportunity Assessment

*Note on methodology: all market size figures from commercial research firms (Towards Healthcare, InsightAce Analytic, Grand View Research, IMARC) failed adversarial verification (0-3 votes) and are excluded. Only findings from primary sources or secondary sources that survived 2-3 majority votes are included below. Do not cite specific market size numbers in investor materials without commissioning primary research.*

---

### The India opportunity — what the evidence actually supports

**Treatment gap (confirmed, high confidence — 3-0 vote)**

India's treatment gap for common mental disorders is **85%** and for severe mental disorders **73.6%** (National Mental Health Survey 2016, NIMHANS — the most recent national survey, now a decade old but widely cited). Approximately 197 million Indians (1 in 7) had a mental disorder in 2017 (WHO estimate). This is the structural market gap: most people who need psychological support do not receive it.

**Pain burden (confirmed, medium confidence — 3-0 vote with caveats)**

A 2024 meta-analysis (Journal of Occupational Health, Oxford Academic — 59 studies, 2005–2023) found a pooled 12-month low back pain prevalence of **60%** among Indian occupational workers (95% CI 0.54–0.66). *Caveat: I²=97% statistical heterogeneity — treat as indicative, not precise. Do not cite as a point estimate.* Low back pain is the most prevalent specific disorder globally, stated at 568 million affected (GBD 2019 — confirmed 3-0).

**Practical framing for PTS:** India has an enormous underserved population at the intersection of pain and psychological needs, with near-zero access to counselor-led support outside private clinics in metro areas. Mobile-first delivery with OTP access directly addresses the access barrier.

**Regulatory context (unverified but materially important)**

Research surfaced evidence that standalone mental health apps in India currently fall outside the CDSCO regulatory framework — no centralised regulatory body oversees them. This is opportunistic for a rapid pilot launch but is not a long-term stable position. This directly connects to Track 0 Decision #20 (regulatory posture), which remains unresolved.

**Pricing benchmarks — India (unverified, directional only)**

Online therapy platforms in India charge approximately ₹800–₹2,875 per session (vs ₹1,800–₹4,500 for in-person). Mental health counsellors specifically (the closest comparable to PTS counselors) charge ₹800–₹2,070 per session. India B2B2C mental health market projected at USD 3.9 billion by FY29 (growing 1.7x), with large corporates budgeting INR 10,000–20,000 per employee annually for wellness. *These figures are from secondary analyst sources and were not selected for adversarial verification — use as directional benchmarks only.*

---

### Competitive landscape

**Woebot — effectively exited B2C (confirmed)**

Woebot announced in April 2025 it was closing its consumer-facing app. The B2C chatbot-only model has not been commercially viable. This removes one category of competitor and validates that pure-AI without human support is a fragile market position.

**Wysa — closest comparable, FDA Breakthrough Device designation**

Wysa is an India-origin AI mental health chatbot that has received FDA Breakthrough Device designation for chronic musculoskeletal pain. It offers optional human coaching ($19.99/session) layered on top of its AI. It does not offer: counselor-reviewed personalised programs, week-by-week adaptive planning, or holistic integration (yoga/Ayurveda/music). Its B2B pricing is not publicly verified.

**SilverCloud (now Amwell) — claims failed verification**

SilverCloud's marketing claims ("80% improvement," "65% recovery rate," "as effective as face-to-face therapy") all failed adversarial verification (0-3 votes). Its core model is CBT/iCBT program delivery, web-first, no async counselor relationship in the standard product.

**Hinge Health — US B2B MSK, not a direct competitor but instructive**

Hinge Health generated $390M in revenue in 2024 (33% YoY growth, 77% gross margin) in the employer-paid digital MSK care space. Its model is physical therapy + coaching + app. It is US-only and does not offer psychological/counseling support or holistic integration. Its scale demonstrates the B2B MSK digital health market is real and investable — but at a price point and market not directly applicable to India.

**No direct competitor exists** combining: (a) human counselor in the loop, (b) AI-generated personalised psychological recovery program, (c) counselor weekly editing and approval, (d) holistic integration (yoga/Ayurveda/music), (e) mobile-first for India, (f) OTP access for low-friction enrollment.

---

### Evidence base for PTS's core design choices

**Human counselor contact increases program commencement: 91% vs 60% (medium confidence — 2-1 vote)**

A CONSORT-compliant RCT (Gardner et al. 2022, JMIR, n=89) compared telephone-supported vs self-guided online pain management programs. Commencement rate: 91% vs 60% (p=.001). The counselor contact effect is on *starting* the program, not on completion rates once started. This directly supports PTS's counselor-in-the-loop design as an engagement mechanism above all else.

*Caveats: single-site, n=89, single clinician, COVID-19 context. The 2-1 vote reflects these limitations.*

**Digital-only pain interventions produce small-to-medium effect sizes — room for counselor-augmented differentiation (high confidence — 3-0 vote)**

Meta-analyses consistently find Hedges' g approximately -0.26 to -0.54 for internet/smartphone-based psychosocial pain interventions. PTS's differentiation argument: pure-digital tools are limited by engagement dropout AND small effect sizes. A human counselor + adaptive plan addresses both. *This also means PTS should not make dramatic clinical outcome claims — position around process quality, access, and engagement, not cure.*

**High attrition in stacked digital programs supports PTS's focused design (medium confidence — 2-1 vote)**

An RCT (PMC8705416) found only 39% of participants completing 1-year follow-up in a program combining internet ACT with multimodal pain rehabilitation. The authors noted that combining two full programs "may not be optimal." PTS's single counselor-led program (rather than a stack of separate modules) is consistent with this finding.

---

### Four open commercial questions (unanswered by this research)

1. **India willingness-to-pay for B2C digital counseling support (not therapy).** No verified data survived. The ₹800–₹2,875/session pricing is for therapy/counseling sessions, not a program subscription. What clients will pay monthly for a 6-week program with async counselor access is unknown and needs pilot validation.

2. **Employer/insurer reimbursement pathways in India.** The B2B2C market projection (INR 10,000–20,000 per employee wellness budget) is from an unverified secondary source. No verified data on whether Indian employers pay for digital pain recovery programs specifically vs. generic EAP/wellness programs.

3. **Whether therapist-supported digital interventions show meaningfully better effect sizes than self-guided.** The IASP fact sheet states therapist support shows "the most consistent positive impact" but this claim failed adversarial verification (0-3). It is the key clinical differentiation claim PTS would want to substantiate before investor presentations — requires commissioning a proper literature review.

4. **India-specific regulatory trajectory.** The current unregulated status is a launch advantage but not stable. Any digital health platform with counselor-delivered services should monitor CDSCO and DPDP Act developments.

---

### PTS's genuine competitive advantages — a realistic assessment

| Advantage | Basis | Defensibility |
|---|---|---|
| Counselor-in-the-loop at scale via AI | AI does the drafting, counselor does the clinical editing — enables caseloads that would be impossible with manual authoring | Medium — replicable but requires both clinical lead and AI integration |
| Holistic integration (yoga/Ayurveda/music) | Culturally resonant in India; no comparable platform offers this | High in India specifically — poor fit for Western markets without adaptation |
| India-origin, India-priced, India-language | End-to-end designed for the Indian market — OTP auth, INR pricing, counselor trained in Indian clinical context | High for India pilot — low moat globally |
| Week-by-week adaptive program (when built) | The most clinically defensible model: plan reflects client's actual Week 1 progress, not Day 1 predictions | High — no competitor does this with human counselor approval |
| Mobile-first, 5-minute daily touchpoints | Right format for a population managing pain across work and home | Low — format is replicable |

**Bottom line for investor framing:** The opportunity is real, the treatment gap is documented, and the competitive space is genuinely open in India. The business model risk is willingness-to-pay — pilot data on conversion and retention is what will de-risk or challenge the B2C model, and B2B employer interest is the commercial hedge worth pursuing early.

---

## Sources (Part 2 — primary and secondary, verified claims only)

- National Mental Health Survey 2015–16, NIMHANS — treatment gap data
- GBD 2019 — low back pain global prevalence
- Journal of Occupational Health 2024 (Oxford Academic) — Indian worker LBP meta-analysis
- Gardner et al. 2022, JMIR — RCT: telephone support vs self-guided pain program
- Pfeifer et al. 2020, PMC7694405 — effect sizes for digital psychosocial pain interventions
- IASP Fact Sheet — digital health psychosocial interventions for chronic pain
- PMC8705416 (JCM, Dec 2021) — internet ACT + multimodal rehabilitation RCT attrition
- Wysa FDA Breakthrough Device designation announcement (wysa.io)
- Hinge Health S-1 breakdown (hospitalogy.com) — revenue, gross margin data
- therapyroute.com 2025 India therapy cost guide — pricing benchmarks (unverified, directional)
- RedSeer Report — India B2B2C mental health market (unverified, directional)
- ORF: Mind Matters — India mental health tech overview
- bhbusiness.com — Woebot consumer app closure (April 2025)
