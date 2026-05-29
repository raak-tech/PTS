# TRACK 0: Strategy & Foundation — Pilot Launch Decisions

**Status:** Pilot sprint complete. Foundation decisions pending before controlled launch.

These 8 items must be finalised before recruiting pilot users/counselors. Mostly documentation and stakeholder alignment — some have technical implications.

---

## #17. Finalise product name and brand positioning

**Current state:** "PTS" in all code and UI. Full name "Pain to Strength" is implied but not consistently used.

**Decision needed:**
- Confirm: "PTS" vs. full name "Pain to Strength"
- Confirm: positioning statement for marketing & internal alignment

**Options:**
- **PTS (Pain to Strength)** — Clean, memorable, clinical feel. Good for B2B/counselor credibility.
- **Strength** or **Recovery** (standalone) — Aspirational, less clinical. Easier to rebrand later.

**Action:** Decide + update marketing site and all copy consistently.

---

## #18. Define three user personas and pilot focus

**Current state:** PROJECT_BRIEF mentions 4 archetypes: workplace injury, sports injury, accident/trauma, general injury.

**Decision needed:**
- Pick 1–2 archetypes as **primary pilot focus** (recruit 10–20 users in these cohorts first)
- Document each persona: demographics, pain journey, goals, barriers, therapeutic focus

**Suggested structure per persona:**
```
Name: [e.g. Arjun, 28, knee surgery]
Pain source: [workplace injury / sports / accident / chronic]
Situation: [what happened, timeline]
Impact: [work, relationships, mobility, identity]
Goals: [what recovery looks like]
Barriers: [cost, stigma, access, etc.]
Therapeutic focus: [values, re-engagement, fear, etc.]
```

**Why it matters:**
- Guides LLM prompt refinement (each persona needs different plan focus)
- Shapes counselor selection and training
- Informs success metrics

**Action:** Define 3 personas, identify which are pilot priorities.

---

## #19. Define counseling vs. therapy — scope boundaries

**Current state:** Code/copy uses "counseling" but needs clinical alignment with Ramya.

**Decision needed:**
- Clarify what PTS **is:** counseling, coaching, support, recovery facilitation?
- Clarify what PTS **is not:** therapy, diagnosis, medical triage, crisis intervention
- Document scope boundaries in ToS, intake disclaimers, error messaging

**Example language (draft):**
```
PTS is a counseling-led recovery support program for people whose pain 
has disrupted their life. Our counselors help you understand the psychological 
and practical challenges that come with pain, and guide you toward values-based 
recovery. We are NOT a medical service and cannot diagnose, prescribe, or 
treat medical conditions. We work alongside your medical care team.
```

**Why it matters:**
- Legal/liability (what we can be sued for vs. what counselors own)
- Intake copy and consent language
- Scope of counselor training and responsibilities
- Red-flag routing (when to escalate vs. handle in-app)

**Action:** Work with Ramya to finalise language. Update all copy, intake, and ToS.

---

## #20. Confirm regulatory posture for India + global markets

**Current state:** Data on Neon (US-based PostgreSQL). No formal compliance review.

**Decision needed:**
- **India compliance:** Does PTS need to comply with specific mental health regulations? Is it a "health service" under Indian law?
- **Data residency:** Can data stay in US (Neon) or must it move to India?
- **Clinical disclaimer:** What legal disclaimers are required before launch?
- **Global:** Are there other markets we intend to launch in? Do they have specific regs?

**Questions for legal/compliance review:**
- Is PTS classified as a "health service" in India? (affects regulatory burden)
- What clinical disclaimers are required in India vs. globally?
- Can user data stay on US infrastructure or must it be India-based?
- Do we need professional liability insurance? At what coverage?

**Why it matters:**
- Affects go-live timeline (could be 2–8 weeks if legal review is needed)
- Determines disclaimer and consent copy
- May require infrastructure changes
- Affects counselor credentialing and liability

**Action:** Engage legal/compliance. Document findings in COMPLIANCE.md.

---

## #21. Define counselor credentialing criteria

**Current state:** /register/counselor form captures credentials, but we don't have acceptance criteria.

**Decision needed:**
Specify: **What qualifications must a counselor have to join?**

**Options (pick one or combine):**
- **Strict:** Master's in psychology/counseling + registration with professional body (RCI, BACP, etc.) + liability insurance. This = slow, vetted, defensible.
- **Moderate:** Diploma in counseling + 2+ years practising experience. Broader pool, still professional.
- **Open:** Anyone with lived experience in pain recovery + basic training. Fast, inclusive, higher risk.

**Suggested criteria (draft):**
- M.Sc. / Diploma in Psychology / Counselling (or equivalent)
- OR Licensed counselor / psychologist with professional registration
- 2+ years experience with pain, trauma, or recovery support
- Liability insurance (we can recommend providers)
- Background check (if launched in India/EU)

**Why it matters:**
- Affects liability and insurance cost
- Determines pilot pool size and recruitment timeline
- Shapes how we market ("credentialed counselors" vs. "trained supporters")
- Legal: who is responsible if a counselor provides poor care?

**Action:** Decide criteria. Update /register/counselor form copy and validation.

---

## #22. Define platform liability boundaries (in writing)

**Current state:** Disclaimers exist in intake but aren't comprehensive.

**Decision needed:**
Write a **Liability Statement** that answers: Who is responsible for what?

**Template:**
```
PTS PLATFORM RESPONSIBILITY:
- Program structure and daily delivery quality
- Counselor credentialing and background check
- Red-flag detection and crisis escalation
- Data security and privacy

COUNSELOR RESPONSIBILITY:
- Quality of advice and guidance
- Safety assessment and crisis response
- Ethical conduct and professional standards
- Adherence to codes of conduct

CLIENT/USER RESPONSIBILITY:
- Seeking appropriate medical care (we are not medical)
- Disclosing safety risks (self-harm, abuse, etc.)
- Understanding this is support, not treatment
- Reporting counselor misconduct

NOT OUR RESPONSIBILITY:
- Diagnosing medical/psychological conditions
- Prescribing medication or medical treatment
- Emergency mental health crisis (user responsibility to call helpline)
- Counselor misconduct (except removal from platform)
```

**Why it matters:**
- Determines what we insure
- Shapes ToS and user consent
- Guides error handling and escalation
- Informs counselor training and conduct policies

**Action:** Draft Liability Statement. Review with legal. Embed in ToS and intake.

---

## #23. Agree LLM data handling policy

**Current state:** Intake data → Claude API → plan generated. No formal data policy documented.

**Decision needed:**
Answer these questions:

1. **What data goes to LLM?**
   - Only intake responses? (recommended for pilot)
   - Or also messages, reflections, progress data?

2. **User consent language:**
   - Currently: "...data being used to build your personalised program"
   - Is this explicit enough, or does it need "...sent to external AI service"?

3. **Data retention:**
   - Delete LLM prompts after plan is generated? (recommended)
   - Keep a copy for future plan regeneration?
   - How long before permanent deletion?

4. **Data minimisation:**
   - Do we send all intake fields or a summary?
   - Example: send "pain affecting work: yes" or full context?

**Suggested policy (draft):**
```
DATA HANDLING FOR PLAN GENERATION:
- User intake data is sent to Claude API to generate personalised program
- User consents to this in intake (checkbox: "I understand my data is used...")
- Anthropic (Claude provider) has zero-retention policy on prompts
- We store the generated plan in our database indefinitely
- Raw intake data is stored for 90 days then deleted (or until plan approved?)
- User can request data deletion anytime (plan becomes read-only)
```

**Why it matters:**
- User trust and transparency
- Privacy regulation compliance (GDPR, India rules)
- Anthropic's existing policies may already cover us
- Informs consent checkbox language

**Action:** Decide policy. Update Privacy Policy and intake consent language.

---

## #24. Define pilot success metrics

**Current state:** None defined. Hard to know when pilot is "working."

**Decision needed:**
Define **specific metrics** across 4 dimensions:

### 1. **Activation** (Did users complete intake?)
- % of registrants who complete intake
- Target: >60% (benchmark: SaaS onboarding ~40–70%)
- Tracked: users registered vs. intake_responses.completedAt

### 2. **Engagement** (Are users using the program?)
- % of users active by week 2 (completed ≥1 practice)
- Avg daily push notification click-through rate
- % of users who read week 1 plan
- Target: >40% return by week 2

### 3. **Counselor utilisation** (Is support working?)
- Avg response time to client messages
- % of plan reviews completed within SLA (e.g., 24hrs)
- Client satisfaction with counselor responsiveness
- Target: >80% respond within 24 hours

### 4. **User-reported outcome** (Is recovery happening?)
- Pre/post survey (intake vs. week 6)
- NPS or satisfaction question ("How likely to recommend?")
- Self-reported progress on recovery goal
- Safety: no critical incidents unreported

**Suggested metrics to track in DB:**
```
users: registeredAt, activatedAt, lastActiveAt
intake_responses: completedAt, hasRedFlags
messages: createdAt, readAt, responseTime (by counselor)
plans: createdAt, approvedAt, approvalTimeHours
push_subscriptions: createdAt, clickThroughRate(derived)
```

**Success criteria (rough):**
- If >50% activation + >30% week-2 engagement = proceed to scale
- If <30% activation = pause, diagnose dropout, iterate
- If counselor SLA >50% miss = hiring/training issue

**Why it matters:**
- Tells us if pilot is working
- Guides decision to scale or pivot
- Identifies where users drop off
- Tracks safety (critical)

**Action:** Decide metrics. Build tracking dashboard in /provider for Ramya to monitor.

---

## Summary table

| Task | Depends on | Owner | Deadline |
|------|-----------|-------|----------|
| #17 Product name | None | Satheesh | Before marketing |
| #18 Personas | #17 positioning | You/Ramya | Before recruit |
| #19 Scope/therapy | Ramya input | You + Ramya | Before ToS |
| #20 Regulatory | Legal review | Legal + You | Before launch |
| #21 Credentials | Ramya + liability | You + Ramya | Before recruit |
| #22 Liability | #19 scope | Legal + You | Before ToS |
| #23 Data policy | Privacy lead | You | Before recruit |
| #24 Metrics | #18 personas | Ramya + You | Before recruit |

---

## Recommended order of work

1. **Alignment (1 day):** #17 (name) + #18 (personas) — shapes everything else
2. **Clinical (1 day):** #19 (scope) + #21 (credentials) — work with Ramya
3. **Legal (2–3 days):** #20 (regulatory) + #22 (liability) — engage legal
4. **Policy (1 day):** #23 (data) — document existing LLM approach
5. **Analytics (1 day):** #24 (metrics) — build dashboard

**Total:** ~1 week to finalise all foundation items.

Then: **Recruit pilot users & counselors** (2–3 weeks) → **Live pilot** (6 weeks).
