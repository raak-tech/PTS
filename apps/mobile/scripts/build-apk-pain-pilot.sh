#!/usr/bin/env bash
# Build APK B — Pain Script pilot cohort (side-by-side with control APK).
set -euo pipefail
cd "$(dirname "$0")/.."

export EXPO_PUBLIC_PILOT_COHORT=pain_script
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://pts-web-pied.vercel.app}"

echo "→ Building Pain Script pilot APK (cohort B)"
echo "   API: $EXPO_PUBLIC_API_URL"
echo "   Package: com.pts.mobile.painscript"

./scripts/build-apk-gradle.sh

cp -f android/app/build/outputs/apk/release/app-release.apk dist/pts-mobile-pain-pilot.apk
echo "✓ APK B: dist/pts-mobile-pain-pilot.apk"
