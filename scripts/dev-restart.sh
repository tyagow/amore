#!/bin/bash
# Restart local dev (web only — wa-bridge runs on Railway)
set -e

PORTS=(9941 9942 9943)

echo "Cleaning up web dev ports..."
for port in "${PORTS[@]}"; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

sleep 1
echo "Starting web dev server..."
cd "$(dirname "$0")/.."
exec pnpm run dev
