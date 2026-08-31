#!/usr/bin/env bash
set -euo pipefail

rm -rf .tmp-core
npx tsc src/core.ts \
  --ignoreConfig \
  --target ES2020 \
  --module nodenext \
  --moduleResolution nodenext \
  --outDir .tmp-core \
  --skipLibCheck \
  --esModuleInterop \
  --noEmit false
node scripts/core_invariants.cjs
rm -rf .tmp-core
