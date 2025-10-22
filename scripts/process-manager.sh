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
    if [ ! -s "$PROCESS_REGISTRY" ]; then
        echo "No registered processes to kill"
        return
    fi

    echo "Killing all registered processes..."

    while IFS='|' read -r timestamp bash_id description; do
        echo "  Killing $bash_id ($description)..."
        # Try to kill via bash shell ID (background bash processes)
        # Note: This won't work directly, but we can kill the actual process

        # Extract PID if it's a dotnet process on port 5000
        if [[ "$description" == *"dotnet"* ]]; then
            pids=$(lsof -ti:5000 2>/dev/null)
            if [ -n "$pids" ]; then
                echo "    Found PIDs on port 5000: $pids"
                echo "$pids" | xargs kill -9 2>/dev/null && echo "    ✓ Killed"
            fi
        fi
    done < "$PROCESS_REGISTRY"

    # Clear registry
    > "$PROCESS_REGISTRY"
    echo "✓ All processes killed and registry cleared"
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
