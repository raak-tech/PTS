# PTS — Plan CEO Review (gstack-style)

**Date:** 2026-04-18
**Repo:** `/home/satananth/projects/PTS`
**Inputs:** `docs/plans/2026-04-18-office-hours-chat.md`

## Mode
**SELECTIVE EXPANSION**: Keep the MVP wedge tight (musculoskeletal chronic pain) but expand around distribution + product packaging so this can become a real business.

---

## What is the 10-star product here?
A product that makes chronic musculoskeletal pain feel *less like a life sentence* by giving clients a **structured, therapist-led program** that reliably increases:
- functional capacity (sleep/work/mood/relationships)
- perceived control/self-efficacy
- adherence to skills and movement practices

…and does it in a way that feels culturally fluent for Indian expats, with India-based providers.

10-star means: the client says, *“This finally fits my life and I can actually stick to it. My pain isn’t gone, but it’s no longer running my life.”*

---

## Who is the user (MVP wedge)
**Primary client (MVP):** people with **chronic musculoskeletal pain** (back/neck/shoulder/hip/knee etc.), from varied causes/events (not desk-only), who want sustained therapist guidance.

**Target geo/culture:** global clients, with initial advantage on **Indian expats**.

**Second user (provider):** India-based therapists who want a protocolized program they can deliver consistently.

---

## What are they doing today (status quo) — and why it fails
Status quo typically looks like:
- episodic doctor/physio visits with low continuity
- YouTube stretches / generic meditation apps
- pain meds during flare-ups
- self-help content without accountability

Why it fails:
- adherence collapses without structure/accountability
- pain experience is biopsychosocial; people treat only one slice
- cultural mismatch (language, family dynamics, stigma, expectations)

---

## The narrow wedge (what we ship first)
A **6-week therapist-led chronic pain track** for musculoskeletal pain:
- CTA-first core, with CBT micro-skills
- physio-adjacent coaching checklists (standardized, safe, non-diagnostic)
- weekly cadence + daily micro-practices
- optional flare-up protocol for in-the-moment support (with strict safety boundaries)

### What makes this wedge strong
- It matches your real intervention model (periodic, sustained)
- It’s narrow enough to operationalize with providers
- It yields measurable signals quickly (adherence, interference scores, retention)

---

## The hard question: what exactly is the product?
If you don’t decide this, you’ll drift into “marketplace + generic content”. Pick one product shape early:

**Recommended product shape (v1):**
- **Hybrid program**: structured track + therapist check-ins (not unlimited chatting)
- Deliverables are explicit (weekly plan, practice checklist, reflection prompts)

This reduces provider variability and makes outcomes more legible.

---

## Distribution & go-to-market (where you can actually win)
**Initial wedge distribution:**
1) Therapist-led referrals + existing networks
2) Indian expat communities (associations, FB groups, WhatsApp groups)
3) Content that is culturally specific (e.g., family expectations, work stress, stigma)

Avoid early: broad “wellness app” marketing.

---

## Key risks (and how to de-risk fast)
1) **Too broad** (“any chronic pain”):
   - Mitigation: enforce musculoskeletal wedge + 6-week track.
2) **Scope confusion: therapy vs coaching vs medical**:
   - Mitigation: clear disclaimers + eligibility + red-flag routing.
3) **Provider quality variance**:
   - Mitigation: protocolized track + supervision / QA rubric.
4) **Measurement ambiguity**:
   - Mitigation: pick 2–3 core outcomes and 2–3 process metrics.

---

## MVP definition (what we build in software)
### Client-side
- Intake (pain interference, history-lite, goals, red flags)
- Track assignment (6-week template)
- Daily practice checklist + reflections
- Weekly check-in form
- Optional flare-up protocol (short)

### Provider-side (minimum viable)
- View client intake summary
- View track template
- Send weekly plan / check-in prompts (could be manual at first)

### Data posture
Start conservative:
- Default **no persistence** unless required
- If persistence: explicit consent + retention policy + audit logs

---

## Next forcing decision (answer in chat)
To move from strategy to build plan, pick ONE:

1) **Delivery model for v1**
   - A) 1:1 therapist check-ins (scheduled)
   - B) group cohorts (therapist-led)
   - C) hybrid (group + limited 1:1)

2) **Outcome metric to optimize for 6 weeks**
   - A) pain interference (sleep/work)
   - B) self-efficacy / control
   - C) adherence (as leading indicator)

Once you choose these, I’ll run an engineering plan (stack + tasks) and we can start scaffolding the app/API for real.
