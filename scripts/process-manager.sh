#!/bin/bash

# Process Manager - Track and manage background processes started during development
# Keeps a registry of running processes for easy cleanup

PROCESS_REGISTRY="/tmp/dev-processes.txt"

# Initialize registry if it doesn't exist
if [ ! -f "$PROCESS_REGISTRY" ]; then
    touch "$PROCESS_REGISTRY"
fi

# Function to register a process
register() {
    local bash_id="$1"
    local description="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "$timestamp|$bash_id|$description" >> "$PROCESS_REGISTRY"
    echo "✓ Registered process: $bash_id ($description)"
}

# Function to list all registered processes
list() {
    if [ ! -s "$PROCESS_REGISTRY" ]; then
        echo "No registered processes"
        return
    fi

    echo "Registered Background Processes:"
    echo "================================"
    printf "%-20s %-12s %s\n" "STARTED" "BASH_ID" "DESCRIPTION"
    echo "--------------------------------"

    while IFS='|' read -r timestamp bash_id description; do
        printf "%-20s %-12s %s\n" "$timestamp" "$bash_id" "$description"
    done < "$PROCESS_REGISTRY"
}

# Function to kill all registered processes
kill_all() {
    echo "🔥 Aggressive cleanup of all background processes..."
    echo ""

    # 1. Kill registered processes first
    if [ -s "$PROCESS_REGISTRY" ]; then
        echo "1️⃣ Killing registered processes from registry..."
        while IFS='|' read -r timestamp bash_id description; do
            echo "  → $bash_id ($description)"
        done < "$PROCESS_REGISTRY"
    fi

    # 2. Kill all processes on port 5000
    echo ""
    echo "2️⃣ Killing all processes on port 5000..."
    pids=$(lsof -ti:5000 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "  Found PIDs: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null && echo "  ✓ Killed port 5000 processes"
    else
        echo "  ℹ️ No processes on port 5000"
    fi

    # 3. Kill all dotnet run processes
    echo ""
    echo "3️⃣ Killing all 'dotnet run' processes..."
    pkill -9 -f "dotnet run" 2>/dev/null && echo "  ✓ Killed dotnet run processes" || echo "  ℹ️ No dotnet run processes found"

    # 4. Kill all IfcServer processes
    echo ""
    echo "4️⃣ Killing all IfcServer processes..."
    pkill -9 -f "IfcServer" 2>/dev/null && echo "  ✓ Killed IfcServer processes" || echo "  ℹ️ No IfcServer processes found"

    # 5. Kill all dotnet processes (aggressive)
    echo ""
    echo "5️⃣ Killing all dotnet processes (except VS Code Roslyn)..."
    ps aux | grep -E "dotnet.*Debug.*IfcServer" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null && echo "  ✓ Killed debug dotnet processes" || echo "  ℹ️ No debug dotnet processes found"

    # 6. Report zombie processes (can't kill them, but inform user)
    echo ""
    echo "6️⃣ Checking for zombie processes..."
    zombies=$(ps aux | grep -E "dotnet|IfcServer" | grep defunct | wc -l)
    if [ "$zombies" -gt 0 ]; then
        echo "  ⚠️ Found $zombies zombie processes (these are already dead, waiting for cleanup)"
        echo "  ℹ️ Zombies will be cleaned up automatically by system"
    else
        echo "  ✓ No zombie processes found"
    fi

    # 7. Kill any lingering nohup processes
    echo ""
    echo "7️⃣ Killing lingering nohup processes..."
    pkill -9 -f "nohup.*dotnet" 2>/dev/null && echo "  ✓ Killed nohup processes" || echo "  ℹ️ No nohup processes found"

    # 8. Clear registry
    > "$PROCESS_REGISTRY"
    echo ""
    echo "✅ Aggressive cleanup complete! Registry cleared."
    echo ""
}

# Function to remove a specific process from registry
unregister() {
    local bash_id="$1"

    if [ -z "$bash_id" ]; then
        echo "Usage: ./process-manager.sh unregister <bash_id>"
        return 1
    fi

    grep -v "|$bash_id|" "$PROCESS_REGISTRY" > "${PROCESS_REGISTRY}.tmp"
    mv "${PROCESS_REGISTRY}.tmp" "$PROCESS_REGISTRY"
    echo "✓ Unregistered process: $bash_id"
}

# Function to kill specific process
kill_one() {
    local bash_id="$1"

    if [ -z "$bash_id" ]; then
        echo "Usage: ./process-manager.sh kill <bash_id>"
        return 1
    fi

    # Get description from registry
    local description=$(grep "|$bash_id|" "$PROCESS_REGISTRY" | cut -d'|' -f3)

    if [ -z "$description" ]; then
        echo "Process $bash_id not found in registry"
        return 1
    fi

    echo "Killing process $bash_id ($description)..."

    # If it's dotnet on port 5000
    if [[ "$description" == *"dotnet"* ]] || [[ "$description" == *"5000"* ]]; then
        pids=$(lsof -ti:5000 2>/dev/null)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 5000"
        fi
    fi

    unregister "$bash_id"
}

# Function to show currently running processes by port
show_ports() {
    echo "Processes by Port:"
    echo "=================="
    echo ""
    echo "Port 5000 (.NET server):"
    lsof -ti:5000 2>/dev/null | while read pid; do
        ps -p $pid -o pid,command 2>/dev/null
    done || echo "  No process running"

    echo ""
    echo "Port 5173 (Vite dev server):"
    lsof -ti:5173 2>/dev/null | while read pid; do
        ps -p $pid -o pid,command 2>/dev/null
    done || echo "  No process running"
}

# Function to clear registry
clear() {
    > "$PROCESS_REGISTRY"
    echo "✓ Registry cleared"
}

# Show help if no arguments
if [ $# -eq 0 ]; then
    echo "Process Manager - Track and manage background processes"
    echo "========================================================"
    echo ""
    echo "Usage:"
    echo "  ./scripts/process-manager.sh register <bash_id> <description>"
    echo "  ./scripts/process-manager.sh list"
    echo "  ./scripts/process-manager.sh kill <bash_id>"
    echo "  ./scripts/process-manager.sh kill-all"
    echo "  ./scripts/process-manager.sh unregister <bash_id>"
    echo "  ./scripts/process-manager.sh show-ports"
    echo "  ./scripts/process-manager.sh clear"
    echo ""
    echo "Examples:"
    echo "  ./scripts/process-manager.sh register 53dde3 'dotnet server on port 5000'"
    echo "  ./scripts/process-manager.sh list"
    echo "  ./scripts/process-manager.sh kill 53dde3"
    echo "  ./scripts/process-manager.sh kill-all"
    echo "  ./scripts/process-manager.sh show-ports"
    exit 0
fi

# Parse command
case "$1" in
    register)
        register "$2" "$3"
        ;;
    list)
        list
        ;;
    kill)
        kill_one "$2"
        ;;
    kill-all)
        kill_all
        ;;
    unregister)
        unregister "$2"
        ;;
    show-ports)
        show_ports
        ;;
    clear)
        clear
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run without arguments for help"
        exit 1
        ;;
esac
