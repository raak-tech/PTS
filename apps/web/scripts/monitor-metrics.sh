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
