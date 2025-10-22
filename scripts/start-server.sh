#!/bin/bash

# Fast server startup script for development
# Usage: ./scripts/start-server.sh [log-file]

set -e

LOG_FILE="${1:-/tmp/ifcserver.log}"
WORK_DIR="/workspaces/poolarserver-bim-template/src/ifcserver"

echo "🚀 Starting IfcServer..."

# Check if server is already running
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Server already running on port 5000"
    echo "   Run './scripts/process-manager.sh kill-all' to stop it first"
    exit 1
fi

# Start server in background using setsid to detach from terminal
cd "$WORK_DIR"
export ASPNETCORE_ENVIRONMENT=Development
setsid dotnet run --no-build > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "   PID: $SERVER_PID"
echo "   Log: $LOG_FILE"

# Wait for server to be ready (max 5 seconds)
echo -n "   Waiting for server..."
for i in {1..10}; do
    if curl -s http://localhost:5000/api/projects > /dev/null 2>&1; then
        echo " ✅ Ready!"
        echo ""
        echo "✅ Server started successfully"
        echo "   API: http://localhost:5000"
        echo "   View logs: tail -f $LOG_FILE"
        echo ""

        # Register with process manager
        /workspaces/poolarserver-bim-template/scripts/process-manager.sh register $SERVER_PID "IfcServer - $(date '+%Y-%m-%d %H:%M:%S')" > /dev/null 2>&1

        exit 0
    fi
    sleep 0.5
    echo -n "."
done

echo " ❌ Timeout"
echo ""
echo "❌ Server failed to start within 5 seconds"
echo "   Check logs: tail $LOG_FILE"
exit 1
