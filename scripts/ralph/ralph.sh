#!/bin/bash
set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════"
echo "   RALPH - Autonomous Coding Loop"
echo "   Max iterations: $MAX_ITERATIONS"
echo "═══════════════════════════════════════"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════"
  echo "   Iteration $i of $MAX_ITERATIONS"
  echo "   $(date '+%Y-%m-%d %H:%M:%S')"
  echo "═══════════════════════════════════════"
  echo ""

  # Pipe prompt to Claude Code and capture output
  OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | claude --dangerously-skip-permissions 2>&1 | tee /dev/stderr) || true

  # Check if all stories are complete
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "   ALL STORIES COMPLETE!"
    echo "═══════════════════════════════════════"
    exit 0
  fi

  # Brief pause between iterations
  sleep 2
done

echo ""
echo "═══════════════════════════════════════"
echo "   Max iterations reached"
echo "   Check scripts/ralph/progress.txt"
echo "═══════════════════════════════════════"
exit 1
