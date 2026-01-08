#!/bin/bash

# Claude Code Flight Deck Launcher
# Quick start script for development server

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting Claude Code Flight Deck..."
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Start the dev server in the background
echo "🔧 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for the server to be ready (check for port 3000)
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  sleep 1
done

# Open in default browser
echo "🌐 Opening browser..."
sleep 1
open http://localhost:3000

echo ""
echo "✨ Flight Deck is running at http://localhost:3000"
echo "📝 Press Ctrl+C to stop the server"
echo ""

# Wait for the dev server process
wait $DEV_PID
