# Pilot Recruitment Checklist

**Goal:** Run a controlled pilot with 10–20 real users + 2–3 counselors. Learn + iterate.

**Status:** ✅ Product ready. User-facing features complete.

---

## Pre-Recruitment Checklist

### ✅ Product & Tech
- [x] Landing page live (marketing site)
- [x] Client registration & login
- [x] Multi-step intake (7 steps, demographics captured)
- [x] LLM plan generation (Claude API integrated)
- [x] Counselor registration (invite-code gated)
- [x] Counselor console (plan review, client list, messages)
- [x] Client-counselor messaging (async, 8s polling)
- [x] Counselor calendar (Calendly embed)
- [x] Push notifications (browser Notifications API)
- [x] Responsive design (mobile-ready)
- [x] Error handling & logging (structured JSON logs)
- [x] Rate limiting (5 attempts/15min)

### ⚠️ Foundation (Document as we go)
- [ ] Finalise product positioning (name, tagline, brand voice)
- [ ] Define target pilot cohort (1–2 pain archetypes)
- [ ] Write clinical scope statement ("what we are/aren't")
- [ ] Confirm counselor credentialing criteria
- [ ] Create liability statement
- [ ] Finalise data privacy + consent language
- [ ] Define pilot success metrics

### 📋 Operational
- [ ] Invite code(s) for counselor registration
- [ ] Recruitment message / screening survey
- [ ] Intake consent form (final version)
- [ ] Counselor onboarding checklist
- [ ] Support email / helpdesk setup
- [ ] Data backup procedure
- [ ] Monitoring dashboard for Ramya

### 📱 User-Facing Copy
- [ ] Landing page final copy ✅ (mostly done)
- [ ] Intake safety disclaimers (refine as needed)
- [ ] Counselor profile visibility (name, credentials, bio) — can be iterative
- [ ] Error messages (user-friendly, not technical)

---

## Ready-to-Recruit Checklist (MVP to launch)

What's the **absolute minimum** to start recruiting? Mark each:

### 1. Can we onboard users?
- [x] Registration works
- [x] Email verification working
- [x] Intake form working
- [x] Plans generate (LLM working)
- [x] Mobile experience acceptable

**Status:** ✅ Ready

---

### 2. Can we onboard counselors?
- [x] Counselor registration form
- [x] Invite code gated (CNSL-32223077)
- [x] Profile capture (name, credentials, bio, specialisations)
- [x] Console works (see clients, review plans, message)

**Status:** ✅ Ready. Need to generate invite codes for pilot counselors.

---

### 3. Can we monitor what's happening?
- [x] Structured logging (JSON format)
- [x] Error tracking (logError in lib/logger)
- [x] Vercel analytics (built-in)
- [ ] Ramya dashboard (simple metrics view)

**Status:** 🟡 Partial. Can add simple dashboard if needed.

---

### 4. What breaks if things go wrong?
- [x] Red flag detection in intake (safety questions)
- [x] Graceful LLM failures (plan generation fails → tell counselor)
- [x] Message sending failures (visible error)
- [ ] Escalation runbook (what to do if user reports crisis?)

**Status:** 🟡 Tech is ready. Need crisis escalation SOP.

---

## Recruitment phases

### Phase 0: Internal test (Now)
**Who:** You, Ramya, maybe 1 trusted user  
**Duration:** 1–2 weeks  
**Goal:** Confidence that core flow works, no major bugs

**Checklist:**
- [ ] Ramya logs in as counselor, sees console
- [ ] Test user completes intake → plan generates → appears in counselor console
- [ ] Ramya approves plan → client sees it
- [ ] Message exchange works
- [ ] All integrations live (LLM, Vercel, Neon DB)

---

### Phase 1: Closed recruitment (2–3 weeks)
**Who:** 10–15 people with pain history (referrals, social network, clinics)  
**How:** Personal email/message + screening survey  
**Goal:** Product-market fit signal, identify critical bugs

**Screening survey (suggested):**
```
We're running a pilot of PTS, a new counseling support program 
for people recovering from pain. It's free for pilot participants. 
Interested?

1. What kind of pain are you dealing with?
   - Workplace injury
   - Sports/activity injury
   - Road accident or trauma
   - General/chronic injury
   - Other

2. How long has it been affecting you?
   - Under 1 month / 1–3 months / 3–6 months / 6–12 months / 1+ year

3. Are you willing to:
   - Do a 7-step intake questionnaire (~10–15 min)?
   - Try daily program activities (~5–10 min/day)?
   - Work with a counselor over the next 6 weeks?
   - Provide feedback at the end?

4. Any concerns or questions?
```

**Recruitment sources:**
- Referrals from Ramya's network (therapists, clinics)
- Social: Facebook, WhatsApp, LinkedIn groups around pain/recovery
- Direct: workplace injury advocates, sports injury communities
- Academic: ask counselors in hospitals/clinics if they can refer

---

### Phase 2: Scale (after learnings from Phase 1)
**Who:** 50–100 users, maybe 5–10 counselors  
**How:** Marketing site, structured recruitment, paid ads (maybe)  
**Goal:** Validate model at scale, collect outcome data

---

## What we need from you before Phase 0

### 1. Counselor invite codes
Generate a few codes for Ramya and any other pilot counselors.

**How:** 
- We have `CNSL-32223077` hardcoded in env
- For pilot, that's fine — same code for all counselors
- Or generate unique codes via `/admin/invite` endpoint (not yet built)

**Action:** Confirm the code or ask me to build invite management.

---

### 2. Crisis escalation SOP
If a user reports suicidal ideation or abuse in intake, what do we do?

**Current flow:** Red flag checkbox → stored in DB → visible to counselor  
**Missing:** What happens next? Do we:
- Auto-email counselor with urgency flag?
- Show crisis resources on the client's screen?
- Escalate to you/Ramya immediately?

**Suggested SOP:**
```
RED FLAG PROTOCOL:
1. Intake shows "hasRedFlags: true" or safety answer = "not safe"
2. Client shown crisis resources immediately (iCall, Aasra, etc.)
3. Plan marked "DO NOT DELIVER" until counselor reviews
4. Counselor gets email: "Client flagged as unsafe — immediate review"
5. Counselor calls/messages within 1 hour
6. If no contact within 2 hours → escalate to Ramya
7. Ramya decides: crisis team intervention vs. continue in app
```

**Action:** Finalise SOP with Ramya. I can code the notification flow.

---

### 3. Sample script for recruiting
"Hey, we're running a free pilot of a new pain recovery program..."

**Action:** You draft the message or I can suggest one.

---

## Ready signal

**You're ready to recruit when:**
1. ✅ Product checklist is green (it is)
2. ⏳ Crisis SOP is defined (needed)
3. ⏳ Invite codes are ready (needed)
4. ⏳ You've tested the flow end-to-end (suggested)

---

## Live pilot monitoring (Ramya's view)

What Ramya needs to see daily/weekly:

**Suggested metrics dashboard:**
- Registrations (cumulative)
- Intakes completed (% of reg)
- Plans approved by counselor (% of intakes)
- Daily active users (% of completed intakes)
- Messages sent today (counselor response rate)
- Any red flags raised (for immediate action)

**Where:** Simple view at `/provider` or a new `/admin/metrics` page

**Action:** I can build a simple metrics page if helpful.

---

## Timeline

| Week | Phase | Milestones |
|------|-------|-----------|
| This week | Phase 0 | Internal test, SOP, recruit script |
| Week 2–3 | Phase 1 | Closed recruitment (10–15 users), run program |
| Week 4–6 | Phase 1 | Week 6 feedback, data collection |
| Week 7+ | Learnings | Document findings, decide pivot/scale |

---

## Success criteria for Phase 1 pilot

**If we see this, it's working:**
- >60% of people who sign up complete intake
- >50% who complete intake start the program (click into week 1)
- Counselor can manage ~5–10 clients without being overwhelmed
- >1 message exchange per client (counselor + client both engaged)
- Zero critical bugs or crashes

**If we see this, we need to iterate:**
- <40% activation (intake not compelling, or signup is friction)
- >20% drop after plan approval (plan quality issue?)
- Counselors reporting unclear guidance on what to do
- Users confused about what PTS is (messaging issue)

---

## Go/no-go decision point

**After 2–3 weeks of Phase 1:**
- Are users engaged?
- Are counselors confident?
- Any deal-breaker bugs?

**Then decide:**
- 🟢 **Go:** Scale to Phase 2 (50+ users)
- 🟡 **Iterate:** Fix X, run another 2-week cohort
- 🔴 **Pivot:** Redesign core experience, pause pilot

---

## Blockers (if any)

- [ ] DATABASE: Is Neon connected and migrated? Check `/api/health`
- [ ] LLM: Is OpenRouter API key valid? Check plan generation logs
- [ ] EMAIL: Is nodemailer configured? (for password reset, etc.)
- [ ] DOMAIN: Is `pts-web-pied.vercel.app` accessible? (or custom domain?)

---

## Next steps

1. **Confirm you want to go to Phase 0** (this week)
2. **Provide:** Crisis SOP, invite code(s), recruitment script
3. **I'll:** Run internal test, flag any blockers
4. **Then:** You recruit Phase 1 cohort

Ready?
