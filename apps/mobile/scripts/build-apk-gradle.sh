#!/usr/bin/env bash
# Build an installable Android APK locally with Gradle (no EAS queue).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin:$PATH"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://pts-web-pied.vercel.app}"
# Release APKs must not pick up developer .env (often a LAN IP unreachable on device).
export EXPO_NO_DOTENV=1

die() {
  echo "error: $*" >&2
  exit 1
}

command -v java >/dev/null || die "JDK 17 not found. Install: sudo apt install openjdk-17-jdk"
[ -d "$ANDROID_HOME" ] || die "Android SDK not found at ANDROID_HOME=$ANDROID_HOME"

echo "→ Regenerating android/ via expo prebuild…"
npx expo prebuild --platform android --clean --no-install

mkdir -p android
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# New architecture is unstable on some local release builds; use bridge mode.
if grep -q '^newArchEnabled=true' android/gradle.properties 2>/dev/null; then
  sed -i 's/^newArchEnabled=true/newArchEnabled=false/' android/gradle.properties
  echo "→ Disabled new architecture for release stability"
fi

ABI="${PTS_ANDROID_ABI:-}"
GRADLE_ARGS=(assembleRelease)
if [ -n "$ABI" ]; then
  GRADLE_ARGS+=("-PreactNativeArchitectures=$ABI")
  echo "→ Building for ABI: $ABI"
fi

echo "→ Gradle release build (API: $EXPO_PUBLIC_API_URL)…"
cd android
./gradlew "${GRADLE_ARGS[@]}" "$@"

APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
[ -f "$APK" ] || die "APK not found at $APK"

mkdir -p "$ROOT/dist"
cp "$APK" "$ROOT/dist/pts-mobile-release.apk"

echo ""
echo "✓ Release APK ready"
echo "  $APK"
echo "  $ROOT/dist/pts-mobile-release.apk"
ls -lh "$APK"
