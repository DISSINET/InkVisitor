#!/usr/bin/env bash
# Rebuild @inkvisitor/annotator and reinstall client deps. Run from client: pnpm rebuild:annotator
set -euo pipefail

say() { printf '%s\n' "[rebuild-annotator] $*"; }

CLIENT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANNOTATOR_DIR="${CLIENT_DIR}/../annotator"

say "client:    ${CLIENT_DIR}"
say "annotator: ${ANNOTATOR_DIR}"
say "step 1/5 — removing annotator dist: ${ANNOTATOR_DIR}/dist"
rm -rf "${ANNOTATOR_DIR}/dist"
say "step 2/5 — removing client node_modules: ${CLIENT_DIR}/node_modules"
rm -rf "${CLIENT_DIR}/node_modules"
say "step 3/5 — building annotator (pnpm build)"
(cd "${ANNOTATOR_DIR}" && pnpm build)
say "step 4/5 — installing client dependencies (pnpm install)"
(cd "${CLIENT_DIR}" && pnpm install)
say "step 5/5 — starting dev server (pnpm start)"
(cd "${CLIENT_DIR}" && pnpm start)
