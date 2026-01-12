#!/bin/bash

# Claude FD Dev Launcher
# Starts the dev server and launches Electron

PROJECT_DIR="/Users/ivanpaudice/Library/Mobile Documents/com~apple~CloudDocs/Progetti/ai--CC-flight-deck"
PORT=3000

cd "$PROJECT_DIR"

echo "🚀 Claude FD Dev Launcher"
echo "========================="

# Check if server is already running
if curl -s http://localhost:$PORT > /dev/null 2>&1; then
    echo "✓ Dev server already running on port $PORT"
else
    echo "Starting dev server..."
    # Start Next.js dev server in background
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!

    # Wait for server to be ready with progress
    for i in {1..30}; do
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            echo "✓ Dev server ready!"
            break
        fi
        printf "."
        sleep 1
    done
    echo ""
fi

echo "Launching Electron..."
npm run electron
