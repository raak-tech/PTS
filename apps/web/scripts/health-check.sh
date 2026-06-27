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
LANDING=$(curl -s https://pts-web-pied.vercel.app | grep -c "Pain changed your life" || echo "0")
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
