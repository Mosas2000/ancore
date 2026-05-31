#!/usr/bin/env bash
set -euo pipefail

echo "Verifying dev/test scripts for workspace packages (smoke)..."

declare -a cmds=(
  "pnpm --filter @ancore/extension-wallet run dev -- --help"
  "pnpm --filter @ancore/web-dashboard run dev -- --help"
  "pnpm --filter @ancore/mobile-wallet run dev -- --help"
  "pnpm --filter @ancore/extension-wallet run test -- --help"
  "pnpm --filter @ancore/ui-kit run test -- --help"
)

for cmd in "${cmds[@]}"; do
  echo "\n--- Running: $cmd ---"
  if ! bash -lc "$cmd"; then
    echo "Command failed: $cmd"
    exit 2
  fi
done

echo "All dev/test scripts responded successfully (help/dry-run)."
