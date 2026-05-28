# Project Brief — PTS (Pain to Strength)

**Last updated:** 2026-05-28
**Status:** Active — controlled pilot in progress

---

## 1) One-liner
> PTS is a counseling-led recovery platform for anyone whose pain — from injury, accident, workplace incident, or sport — has changed how they live. We combine a personalised adaptive program, daily mobile support, and direct access to a human counselor to help people get back to the quality of life they had before.

---

## 2) The problem

When someone gets hurt, the medical system treats the body. Nobody treats everything else.

- The physio fixes the knee. Nobody helps with the fear of re-injury, the loss of the athlete's identity, or the anxiety of being unable to work.
- Pain from accidents, workplace incidents, and injuries almost always has a psychological dimension that physical treatment ignores.
- Psychological support for pain exists but is vastly underutilised — access barriers, cost, stigma, and the fact that medical referrals don't routinely include it.
- People fall back on generic content (apps, YouTube) that isn't personalised, isn't accountable, and doesn't have a human in the loop.

**The gap:** a counseling-led, technology-delivered pathway that works alongside physical treatment — not instead of it.

---

## 3) Who we serve

### Primary — Clients
Anyone whose pain has disrupted their life, including:
- **Workplace injury:** pain + financial stress + return-to-work pressure + potential legal process
- **Sports/activity injury:** identity loss, performance goals disrupted, fear of re-injury
- **Road accident / trauma:** potential PTSD overlay, physical + psychological impact
- **General injury:** sudden disruption to normal life, independence, relationships

What unites them: a before and an after. The goal is to close that gap.

### Secondary — Counselors
Licensed or credentialed practitioners who join the platform to:
- Manage a caseload of clients
- Deliver 1:1 sessions
- Review and guide AI-generated program plans
- Monitor daily engagement and respond to flags

---

## 4) Our promise

**To clients:** *"You got hurt. We help you get back to living."*
Not a medical service. Not diagnosis or prescribing. A counseling-led program that gives you structure, daily support, a human who knows your situation, and the tools to rebuild the life you had.

**To counselors:** A platform that handles the program structure and daily delivery so they can focus on the clinical relationship and the moments that matter.

---

## 5) How it works

### Client journey
1. **Discovery** — lands on marketing site, understands what PTS is and isn't
2. **Assessment** — conversational multi-step intake: situation, life impact, goals, preferences, safety screen
3. **Plan generation** — LLM generates a personalised 6+ week program from intake data; counselor reviews and approves
4. **Program delivery** — week-by-week adaptive program with daily practices, prompts, and reflection
5. **Daily engagement** — mobile push touchpoints through the day (morning check-in, midday practice, evening reflection)
6. **Counselor relationship** — async messaging, progress monitoring, 1:1 session booking
7. **Adaptation** — weekly check-in data feeds plan adjustment; counselor + algorithm in the loop
8. **Recovery** — milestone tracking, graduation, continuation or step-down

### Counselor journey
1. Register and credential verification
2. Profile live on platform
3. Set availability calendar
4. Assigned clients (or client-selected)
5. Review AI-generated plans, approve or edit
6. Monitor daily engagement dashboard
7. Respond to messages, handle flags
8. Conduct 1:1 sessions (video/phone)
9. Write post-session notes, adjust plan

---

## 6) Intervention model

- **Primary modality:** Counseling — acceptance-based, values-focused, practically oriented
- **ACT (Acceptance & Commitment Therapy):** values-based action, acceptance of pain, cognitive defusion, committed action — strong evidence base for pain
- **CBT micro-skills:** thought/behaviour patterns, coping strategies — used where appropriate
- **Not:** diagnosis, prescribing, medical triage, or a replacement for physical treatment
- **Safety:** red-flag routing built into intake and every check-in; crisis resources always visible

---

## 7) Technology model

- **Program engine:** LLM (Claude API) generates personalised program plans from intake data. Runs as a batch job. Counselor reviews before delivery to client.
- **Daily engagement:** adaptive prompts generated per user based on progress, week in program, and recent check-in data
- **Mobile:** Progressive Web App (PWA) — no app store required, works globally, installable on home screen
- **Push notifications:** Web Push + SMS fallback for daily touchpoints
- **Messaging:** async two-way in-platform between client and counselor
- **Calendar/booking:** counselor sets availability; clients book 1:1 sessions
- **Backend:** Next.js + PostgreSQL (Neon) + Drizzle ORM, deployed on Vercel

---

## 8) Clinical & safety boundaries

- Not medical advice
- Not for emergencies or acute crisis — crisis line always visible
- Not diagnosis or prescribing
- Not a replacement for physical/medical treatment
- Counselors are credentialed practitioners — credentials verified before activation
- Red-flag routing present at intake and every check-in
- All conversations monitored by clinical lead

---

## 9) Pilot definition

**Goal:** Validate that the core journey works — intake → plan → daily engagement → counselor relationship — with real users and real counselors.

**Scale:** 10–20 clients, 2–3 counselors, 6 weeks.

**What we're learning:**
- Does the intake collect enough to generate a meaningful plan?
- Does the generated plan resonate with clients?
- What do clients actually engage with daily?
- Where do they drop off?
- What does the counselor need that the platform doesn't yet provide?

**Pilot success definition:**
- 70%+ of clients who complete intake reach day 7 of their program
- Counselors can review and respond to a client caseload within the platform
- At least one 1:1 session booked and completed per client within the first 2 weeks
- No safety incidents mishandled

---

## 10) Non-goals (current phase)

- Not a therapist marketplace with client-side browsing and matching (post-pilot)
- Not a group therapy or peer support product (evaluate post-pilot)
- Not an EHR or clinical records system
- Not insurance billing or claims management
- Not a native iOS/Android app (PWA first)
- Not multi-language (English first; internationalisation post-pilot)

---

## 11) Key risks

| Risk | Mitigation |
|---|---|
| Scope creep into medical territory | Clear disclaimers; clinical lead reviews all content |
| Counselor availability bottleneck | Caseload limits; clear SLA set with counselors upfront |
| LLM-generated plans that miss the mark | Counselor review and approval gate before delivery |
| Low mobile engagement | WhatsApp as fallback channel evaluation; user-controlled notification preferences |
| Data privacy concerns | Consent-gated storage; GDPR-compliant deletion; data minimisation |
| Pilot drop-off before week 3 | Daily touchpoints; re-engagement flow; counselor-triggered outreach |
