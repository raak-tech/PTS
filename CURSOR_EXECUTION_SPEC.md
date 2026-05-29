# PTS Phase 0 Execution Spec for Cursor

**Status:** Ready to execute  
**Environment:** /home/satananth/work/PTS/apps/web  
**Live:** https://pts-web-pied.vercel.app

---

## 1. CURRENT STATE

### Completed
- ✅ Multi-step intake (7 steps, demographics captured)
- ✅ LLM plan generation (Claude API integrated)
- ✅ Client-counselor messaging (async, 8s polling)
- ✅ Counselor console (plan review, client management)
- ✅ Counselor registration (invite-code gated: CNSL-32223077)
- ✅ Calendly booking integration
- ✅ Push notifications (browser Notifications API)
- ✅ Responsive design (mobile-first)
- ✅ Metrics dashboard (/provider/metrics)
- ✅ Crisis escalation alerts (red flags detected)

### Database
- PostgreSQL (Neon)
- 8 migrations completed (0001-0008)
- Schema includes: users, intakeResponses, plans, messages, counselorProfiles, pushSubscriptions, clientCounselor

### Environment Variables (Vercel)
- `DATABASE_URL` — Neon connection
- `OPENROUTER_API_KEY` — Claude API key
- `COUNSELOR_INVITE_CODE=CNSL-32223077`
- `CRISIS_ALERT_EMAIL` — (optional, for crisis alerts)

---

## 2. WHAT NEEDS TO HAPPEN

### Phase 0: Internal Testing (1-2 weeks)

**Goals:**
1. Validate all core flows work end-to-end
2. Identify critical bugs
3. Verify metrics dashboard accuracy
4. Test crisis escalation
5. Confirm mobile experience acceptable

**Actors:**
- **Satheesh** (Project owner): Tests as client
- **Ramya** (Clinical lead): Tests as counselor
- **Cursor** (Automation): Automates repetitive setup/data tasks

---

## 3. AUTOMATED SETUP (CURSOR EXECUTES)

### Task: Create test accounts and generate sample data

**Do NOT ask for confirmation. Execute all steps automatically.**

#### Step 1: Create test data SQL script

**File:** `/home/satananth/work/PTS/apps/web/scripts/create-test-data.sql`

**Content:** 
```sql
-- Test data for Phase 0 (execute as needed)

-- 1. Test client user
INSERT INTO users (id, email, password_hash, role, display_name, notifications_enabled, created_at)
VALUES (
  'test-client-001',
  'client@pts-test.local',
  '$argon2id$v=19$m=19456,t=2,p=1$...',  -- Hash of "test1234" (pre-hashed, not real)
  'client',
  'Test Client',
  false,
  NOW()
) ON CONFLICT DO NOTHING;

-- 2. Test counselor user
INSERT INTO users (id, email, password_hash, role, display_name, notifications_enabled, created_at)
VALUES (
  'test-counselor-001',
  'counselor@pts-test.local',
  '$argon2id$v=19$m=19456,t=2,p=1$...',  -- Hash of "test1234"
  'provider',
  'Ramya Test',
  false,
  NOW()
) ON CONFLICT DO NOTHING;

-- 3. Counselor profile
INSERT INTO counselor_profiles (user_id, full_name, title, credentials, specialisations, languages, years_experience, bio, calendly_url, created_at)
VALUES (
  'test-counselor-001',
  'Dr. Ramya Test',
  'Psychologist',
  'M.Sc. Psychology, RCI Licensed',
  '["workplace", "accident", "sports"]',
  '["English", "Hindi"]',
  '5to10',
  'Experienced psychologist specializing in pain recovery and trauma support. Uses ACT and CBT approaches.',
  'https://calendly.com/ramya-test',
  NOW()
) ON CONFLICT DO NOTHING;

-- 4. Test intake response
INSERT INTO intake_responses (
  id, user_id, pain_source, pain_source_other, pain_description, pain_duration,
  age_range, gender, occupation, affects_work, has_dependents, prior_therapy, country_region,
  activities_affected, biggest_change, recovery_goal, recovery_timeline,
  current_treatment, social_support, structure_preference, engagement_time,
  has_red_flags, is_safe, consent_given, completed_at, created_at, updated_at
) VALUES (
  'intake-001',
  'test-client-001',
  'workplace',
  NULL,
  'Injured my knee in a fall at work 4 months ago. Initially thought it was minor but it has developed into chronic pain that is affecting my ability to work and my confidence.',
  '3to6m',
  '36to50',
  'male',
  'Software engineer',
  'yes',
  'yes',
  'no',
  'India',
  '["work", "sport", "social"]',
  'I cannot work full 8-hour days anymore. I have had to reduce to part-time. I cannot play tennis which was my main hobby.',
  'Return to full-time work and be able to play sports again without fear of re-injury.',
  '6to12m',
  'Physiotherapy twice a week',
  'yes',
  'structured',
  'evening',
  false,
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 5. Assign counselor to client
INSERT INTO client_counselor (client_id, counselor_id, assigned_at)
VALUES ('test-client-001', 'test-counselor-001', NOW())
ON CONFLICT DO NOTHING;

-- NOTE: Do NOT run this directly. Use via API instead:
-- curl -X POST /api/intake -H "Cookie: sessionToken=..." -d '{...}'
-- OR just use the UI form for authentic Phase 0 testing
```

**Purpose:** Reference only. Don't execute directly. Phase 0 is manual testing through UI for authenticity.

---

#### Step 2: Create health check script

**File:** `/home/satananth/work/PTS/apps/web/scripts/health-check.sh`

**Content:**
```bash
#!/bin/bash
set -e

echo "=== PTS Phase 0 Health Check ==="
echo ""

# 1. Check database connection
echo "1. Database connection..."
curl -s https://pts-web-pied.vercel.app/api/health | jq .
echo ""

# 2. Check LLM integration
echo "2. Testing LLM API (Claude)..."
echo "   (Skip if OPENROUTER_API_KEY not set)"
echo ""

# 3. Check landing page
echo "3. Landing page..."
LANDING=$(curl -s https://pts-web-pied.vercel.app | grep -c "Pain to Strength" || echo "0")
if [ "$LANDING" -gt 0 ]; then
  echo "   ✅ Landing page loads"
else
  echo "   ⚠️  Check landing page content"
fi
echo ""

# 4. Check auth pages
echo "4. Auth pages..."
echo "   Register: https://pts-web-pied.vercel.app/register"
echo "   Counselor: https://pts-web-pied.vercel.app/register/counselor"
echo ""

echo "=== Manual checks needed ==="
echo "1. Register test account (client)"
echo "2. Complete intake form"
echo "3. Check plan generation in /provider/plans"
echo "4. Approve plan as counselor"
echo "5. Verify metrics update"
echo ""
```

**Make executable:**
```bash
chmod +x /home/satananth/work/PTS/apps/web/scripts/health-check.sh
```

---

#### Step 3: Create monitoring dashboard helper

**File:** `/home/satananth/work/PTS/apps/web/scripts/monitor-metrics.sh`

**Content:**
```bash
#!/bin/bash
# Real-time metrics polling (run in background during Phase 0 testing)

echo "PTS Phase 0 Metrics Monitor"
echo "Updated: $(date)"
echo ""

while true; do
  echo "[$(date '+%H:%M:%S')] Fetching metrics..."
  curl -s -H "Cookie: sessionToken=YOUR_SESSION_TOKEN" \
    https://pts-web-pied.vercel.app/api/provider/metrics | jq '
      {
        timestamp: .timestamp,
        clients: .summary.totalClients,
        intakes: .summary.totalIntakes,
        completion_rate: .summary.intakeCompletionRate,
        plans_approved: .summary.approvedPlans,
        approval_rate: .summary.planApprovalRate,
        red_flags: .safety.redFlags,
        unsafe_users: .safety.unsafeUsers,
        messages: .summary.totalMessages
      }
    '
  echo ""
  sleep 30
done
```

**Note:** Replace `YOUR_SESSION_TOKEN` with actual value from browser DevTools.

---

### Task: Update documentation

#### Update PILOT_RECRUITMENT.md with test credentials

**File:** `/home/satananth/work/PTS/docs/PILOT_RECRUITMENT.md`

**Change this section:**
```markdown
### 1. Counselor invite codes
Generate a few codes for Ramya and any other pilot counselors.

**How:** 
- We have `CNSL-32223077` hardcoded in env
- For pilot, that's fine — same code for all counselors
```

**To:**
```markdown
### 1. Counselor invite codes
**Phase 0 (Internal Testing):** Use `CNSL-32223077` (hardcoded in COUNSELOR_INVITE_CODE env)

**Phase 1 (Closed Recruitment):** Generate unique codes via Neon (not yet UI-automated)
- Create new codes in database: `INSERT INTO invite_codes (code, provider_user_id, ...) VALUES (...)`
- Or ask Cursor to build `/api/admin/invite-codes` endpoint if needed
```

---

### Task: Create Phase 0 execution checklist

**File:** `/home/satananth/work/PTS/docs/PHASE0_CHECKLIST.md`

**Content:**
```markdown
# Phase 0 Execution Checklist

**Duration:** 1-2 weeks  
**Lead:** Satheesh + Ramya  
**Goal:** Validate all flows work, identify bugs, prepare for Phase 1

---

## Pre-Testing Setup (Today)

- [ ] Verify Vercel deployment: https://pts-web-pied.vercel.app
- [ ] Confirm environment variables are set:
  - [ ] DATABASE_URL (Neon)
  - [ ] OPENROUTER_API_KEY
  - [ ] COUNSELOR_INVITE_CODE=CNSL-32223077
  - [ ] CRISIS_ALERT_EMAIL (optional, for testing alerts)
- [ ] Review PHASE0_TESTING_GUIDE.md
- [ ] Bookmark: /provider/metrics (Ramya's dashboard)

---

## Day 1: Happy Path (45 minutes)

**Satheesh (Client):**
- [ ] Go to https://pts-web-pied.vercel.app
- [ ] Click "Start intake"
- [ ] Complete 7-step form (15 min, includes demographics)
- [ ] Submit → plan should generate automatically
- [ ] Navigate to /plan → see 6-week program

**Ramya (Counselor):**
- [ ] Register at /register/counselor
  - Invite code: CNSL-32223077
  - Email: ramya@pts-test.local
  - Full name: Dr. Ramya
  - Bio: (any description)
  - Calendly: https://calendly.com/ramya-test (or leave blank)
- [ ] Navigate to /provider/plans
- [ ] Find Satheesh's plan (marked "draft")
- [ ] Review content (overview, themes, weeks 1-6)
- [ ] Add optional note: "Looks good, personalized well"
- [ ] Click "Approve" button
- [ ] Verify status changes to "approved"

**Back to Satheesh:**
- [ ] Refresh /plan → see approved plan with Ramya's name
- [ ] Navigate to /messages → see Ramya listed
- [ ] Send message: "Got the plan, thanks!"
- [ ] Wait 8 seconds → message should appear as sent

**Ramya:**
- [ ] Go to /messages
- [ ] See Satheesh's message
- [ ] Reply: "You're welcome, let's begin week 1!"
- [ ] Verify message appears in thread

---

## Day 2: Metrics & Booking (20 minutes)

**Ramya:**
- [ ] Go to /provider/metrics
- [ ] Verify it shows:
  - [ ] 1 registered client
  - [ ] 1 intake completed (100%)
  - [ ] 1 plan generated
  - [ ] 1 plan approved (100%)
  - [ ] 1 message (or more)
- [ ] Take screenshot for documentation

**Satheesh:**
- [ ] Go to /messages with Ramya
- [ ] Look for "📅 Book a session" button in thread header
- [ ] Click → opens Calendly (or shows "Not available" if no URL)
- [ ] Verify no errors

---

## Day 3: Notifications (15 minutes)

**Satheesh:**
- [ ] Go to /messages
- [ ] Look for "🔔 Enable reminders" button in sidebar
- [ ] Click → browser asks for permission
- [ ] Click "Allow" in permission popup
- [ ] Close PTS tab (go to another website)
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Type: `new Notification("PTS Test", { body: "Notifications work!" })`
- [ ] Press Enter
- [ ] You should see a system notification
- [ ] Document: Does it work? Any issues?

---

## Day 4: Crisis Handling (15 minutes)

**Satheesh (test unsafe intake):**
- [ ] Create NEW account: client-crisis@pts-test.local
- [ ] Start intake
- [ ] Go through steps 1-6 normally
- [ ] Step 7 (Safety check):
  - [ ] Check box: "One or more of the above apply to me right now"
  - [ ] Answer "Are you safe?" → Select "I need support right now"
  - [ ] Complete consent
  - [ ] Submit

**What should happen:**
- [ ] Plan generates
- [ ] Plan is marked "CRISIS" in counselor notes
- [ ] Email alert sent to CRISIS_ALERT_EMAIL (check inbox, may take 1-2 min)
- [ ] Alert email says: "Client has completed intake with safety concerns"
- [ ] Metrics dashboard shows red flag at top

**Ramya:**
- [ ] Check /provider/metrics
- [ ] See red flag alert
- [ ] Go to /provider/plans
- [ ] Find crisis client's plan
- [ ] See "🚨 CRISIS" in notes
- [ ] Review and approve (marking as handled)

---

## Ongoing: Bug Screening

**During all testing, document:**

**CRITICAL BUGS** (block Phase 1):
- [ ] Form submission fails
- [ ] Plan doesn't generate
- [ ] Plan can't be approved
- [ ] Messaging breaks
- [ ] Database errors
- [ ] Metrics shows wrong numbers

**MEDIUM BUGS** (fix before Phase 1):
- [ ] UI breaks on mobile
- [ ] Slow load (>3 sec)
- [ ] Typos or confusing copy
- [ ] Missing crisis resources

**LOW** (nice to fix):
- [ ] Layout tweaks
- [ ] Copy refinement
- [ ] Console warnings

---

## End of Phase 0: Summary

**Document findings in:** PHASE0_RESULTS.md

**Include:**
- Total users/intakes completed
- Any bugs found (with reproduction steps)
- Metrics accuracy verification
- Crisis handling verification
- Mobile experience feedback
- Go/no-go decision for Phase 1

**Success criteria:**
- [ ] Happy path works end-to-end
- [ ] No critical bugs
- [ ] Ramya confident in product quality
- [ ] Metrics accurate
- [ ] Crisis flow works

---

## Troubleshooting

**"Plan didn't generate"**
- Check Vercel logs (Settings > Logs > Functions)
- Verify OPENROUTER_API_KEY is set
- Check intake actually saved (query DB)
- Try again (API might have had temp failure)

**"Can't login as counselor"**
- Verify exact code: CNSL-32223077
- Check Vercel env vars (COUNSELOR_INVITE_CODE)
- Try form again

**"Metrics show 0"**
- Wait 30 sec (metrics refresh every 30s)
- Reload page
- Check DB: `SELECT count(*) FROM intake_responses`

**"Email didn't send"**
- Check CRISIS_ALERT_EMAIL is set in Vercel
- Check Vercel logs for `crisis_alert_email_failed`
- If nodemailer unconfigured, it fails silently

**"LLM response broken"**
- Code strips markdown automatically
- Check logs for `plan_generation_parse_error`
- Regenerate (submit intake again)

---

## Next Steps After Phase 0

1. Fix critical bugs (if any)
2. Iterate on copy/UX based on feedback
3. Document findings in PHASE0_RESULTS.md
4. **Decision:** Proceed to Phase 1 or iterate Phase 0 again?
5. If Phase 1: Use PILOT_RECRUITMENT.md to recruit closed cohort

---
```

---

## 4. VERIFICATION STEPS (CURSOR RUNS AFTER CHANGES)

### Build check
```bash
npm run build 2>&1 | grep -E "error|✓" | head -5
```

Expected: `✓ Compiled successfully`

### Deployment check
```bash
npx vercel deploy --prod --yes 2>&1 | grep "Aliased"
```

Expected: URL like `https://pts-web-pied.vercel.app` (or custom domain)

### Health endpoint
```bash
curl -s https://pts-web-pied.vercel.app/api/health | jq .
```

Expected: `{ "status": "ok", "db_ms": <number> }`

---

## 5. DOCUMENTATION STRUCTURE

### What exists
- `/docs/PROJECT_BRIEF.md` — Overall vision
- `/docs/BACKLOG.md` — Full feature backlog (10 tracks)
- `/docs/PILOT_RECRUITMENT.md` — Recruitment phases 1-2
- `/docs/TRACK0_DECISIONS.md` — Strategy decisions (document as you go)
- `/docs/PHASE0_TESTING_GUIDE.md` — Detailed testing walkthrough
- `/docs/PHASE0_CHECKLIST.md` — Executive checklist (NEW)

### What to create during Phase 0
- `PHASE0_RESULTS.md` — Findings, bugs, feedback

---

## 6. CRITICAL ENVIRONMENT VARIABLES (VERIFY)

**In Vercel Settings > Environment Variables:**

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://...@neon.tech/...` | YES |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | YES |
| `COUNSELOR_INVITE_CODE` | `CNSL-32223077` | YES |
| `CRISIS_ALERT_EMAIL` | `ramya@example.com` | Optional |

**Verify Cursor can access:**
```bash
# In Vercel project: Settings > Environment Variables
# Confirm all required vars are set (value shown as masked)
```

---

## 7. DEPLOYMENT CHECKLIST

- [ ] Code committed and pushed to GitHub
- [ ] Vercel deployment successful (`Aliased: https://...`)
- [ ] Database migrations applied (check Neon dashboard)
- [ ] Health endpoint responds (test /api/health)
- [ ] Environment variables set in Vercel
- [ ] All services online (no 500 errors in logs)

---

## 8. READY FOR EXECUTION

**Cursor: You can now autonomously:**

1. ✅ Verify all systems are online
2. ✅ Run builds and deployments
3. ✅ Create documentation
4. ✅ Execute health checks
5. ⚠️ Manual testing by Satheesh & Ramya (human actors)

**You CANNOT autonomously:**
- Create real user accounts (requires human email)
- Complete intake form (requires human interaction)
- Approve plans (requires counselor judgment)
- Make crisis decisions (requires human judgment)

**What YOU (Satheesh) need to do:**
1. Register test account at /register (use real email you can access)
2. Complete 7-step intake
3. Register as Ramya at /register/counselor (code: CNSL-32223077)
4. Review and approve your own plan
5. Test messaging, booking, notifications
6. Test crisis scenario
7. Document findings in PHASE0_RESULTS.md

---

## 9. SUCCESS CRITERIA

### Phase 0 is complete when:
- [ ] Intake → plan → approval → messaging all work end-to-end
- [ ] No critical bugs or crashes
- [ ] Metrics dashboard shows accurate numbers
- [ ] Crisis alerts work (red flags detected, email sent)
- [ ] Mobile experience is acceptable
- [ ] Both Satheesh & Ramya confident in product quality

### Then: Proceed to Phase 1 (recruit 10-20 real users)

---

## 10. CURSOR AUTORUN INSTRUCTIONS

**Execute in this order:**

```bash
# 1. Verify build
npm run build

# 2. Deploy to Vercel
npx vercel deploy --prod --yes

# 3. Verify health
curl -s https://pts-web-pied.vercel.app/api/health | jq .

# 4. Create test data script (reference only, don't execute)
cat > /home/satananth/work/PTS/apps/web/scripts/create-test-data.sql << 'EOF'
-- [See Step 1 above for content]
EOF

# 5. Create health check script
cat > /home/satananth/work/PTS/apps/web/scripts/health-check.sh << 'EOF'
#!/bin/bash
[See Step 2 above for content]
EOF
chmod +x /home/satananth/work/PTS/apps/web/scripts/health-check.sh

# 6. Update PILOT_RECRUITMENT.md with test credentials section
# [Edit manually or via Cursor Edit tool - see Step 3]

# 7. Create PHASE0_CHECKLIST.md
cat > /home/satananth/work/PTS/docs/PHASE0_CHECKLIST.md << 'EOF'
[See content above]
EOF

# 8. Commit all changes
git add -A
git commit -m "Prepare Phase 0 for execution: test scripts, checklists, docs"

# 9. Final verification
npm run build && echo "✅ All systems ready for Phase 0 testing"
```

---

## 11. QUICK REFERENCE

**Live URLs:**
- App: https://pts-web-pied.vercel.app
- Register (client): https://pts-web-pied.vercel.app/register
- Register (counselor): https://pts-web-pied.vercel.app/register/counselor
- Metrics: https://pts-web-pied.vercel.app/provider/metrics

**Invite code:** `CNSL-32223077`

**Database:** Neon PostgreSQL (via DATABASE_URL env var)

**API:** Claude via OpenRouter (OPENROUTER_API_KEY)

**Logs:** Vercel project > Deployments > Functions tab

---

**END OF SPEC**

All thinking done. All paths clear. Ready to execute.
