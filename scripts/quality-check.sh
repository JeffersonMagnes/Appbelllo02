#!/bin/zsh
set -euo pipefail

workspace_dir="${0:A:h:h}"

run_step() {
  local label="$1"
  shift
  print "\n==> $label"
  "$@"
}

run_step 'Contratos de segurança e integridade comercial' \
  bun run --cwd "$workspace_dir/Portal-site" test
run_step 'Typecheck Portal' \
  bun run --cwd "$workspace_dir/Portal-site" typecheck
run_step 'Lint Portal' \
  bun run --cwd "$workspace_dir/Portal-site" lint
run_step 'Build Portal' \
  bun run --cwd "$workspace_dir/Portal-site" build
run_step 'Typecheck Mobile' \
  bun run --cwd "$workspace_dir/mobile" typecheck
run_step 'Lint Mobile' \
  bun run --cwd "$workspace_dir/mobile" lint
run_step 'Build Mobile de validação (bundle Android local)' \
  bun run --cwd "$workspace_dir/mobile" build:validate
run_step 'Typecheck Backend' \
  bun run --cwd "$workspace_dir/backend" typecheck

print '\nPipeline local concluído com sucesso.'
