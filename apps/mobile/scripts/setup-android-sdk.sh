#!/usr/bin/env bash
# One-time Android SDK setup for local Gradle builds (Ubuntu/Debian).
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

if ! command -v java >/dev/null; then
  echo "→ Installing OpenJDK 17…"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-17-jdk unzip wget
fi

mkdir -p "$ANDROID_HOME/cmdline-tools"
if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
  echo "→ Downloading Android command-line tools…"
  tmp="$(mktemp -d)"
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O "$tmp/cmdtools.zip"
  unzip -q -o "$tmp/cmdtools.zip" -d "$tmp"
  mv "$tmp/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm -rf "$tmp"
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
yes | sdkmanager --licenses >/dev/null
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"

echo ""
echo "✓ Android SDK ready at $ANDROID_HOME"
echo "Add to your shell profile:"
echo "  export ANDROID_HOME=\"$ANDROID_HOME\""
echo "  export JAVA_HOME=\"/usr/lib/jvm/java-17-openjdk-amd64\""
echo "  export PATH=\"\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$JAVA_HOME/bin:\$PATH\""
