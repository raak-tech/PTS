#!/usr/bin/env bash
# Fail if Expo Router would register the same name twice (file + directory).
# Example crash: app/(client)/intake.tsx AND app/(client)/intake/_layout.tsx
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)/app"
conflicts=0

while IFS= read -r -d '' dir; do
  parent="$(dirname "$dir")"
  base="$(basename "$dir")"
  for ext in tsx ts jsx js; do
    file="$parent/$base.$ext"
    if [[ -f "$file" ]]; then
      echo "ERROR: Expo route conflict — both exist:"
      echo "  file: $file"
      echo "  dir:  $dir/"
      echo "  Fix: move the file to $dir/index.$ext (or remove one)."
      conflicts=$((conflicts + 1))
    fi
  done
done < <(find "$ROOT" -type d -print0)

# Warn if a non-group folder of screens lacks _layout (implicit layout is OK,
# but listing helps reviews). Groups like (tabs) already have layouts.
missing=0
while IFS= read -r -d '' dir; do
  base="$(basename "$dir")"
  # skip root app, route groups, and leaf param folders
  [[ "$base" == "app" ]] && continue
  [[ "$base" == \(*\) ]] && continue
  [[ "$base" == \[*\] ]] && continue
  # only folders that contain route files
  if ls "$dir"/*.tsx >/dev/null 2>&1 || ls "$dir"/*.ts >/dev/null 2>&1; then
    if [[ ! -f "$dir/_layout.tsx" && ! -f "$dir/_layout.ts" ]]; then
      # folders that only hold nested dirs (no sibling screens) are fine without layout
      count_screens=0
      for f in "$dir"/*.tsx "$dir"/*.ts; do
        [[ -f "$f" ]] || continue
        bn="$(basename "$f")"
        [[ "$bn" == _* ]] && continue
        count_screens=$((count_screens + 1))
      done
      if [[ "$count_screens" -gt 0 ]]; then
        echo "NOTE: $dir has $count_screens screen(s) and no _layout.tsx (Expo uses an implicit layout)."
        missing=$((missing + 1))
      fi
    fi
  fi
done < <(find "$ROOT" -type d -print0)

if [[ "$conflicts" -gt 0 ]]; then
  echo ""
  echo "Found $conflicts Expo file+directory conflict(s). Aborting."
  exit 1
fi

echo "OK: no Expo file+directory route conflicts."
exit 0
