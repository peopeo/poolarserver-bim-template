#!/bin/bash
set -e

# ---------------------------------------------------------------
# Purpose:
#   This script runs right after the devcontainer is first created.
#   It ensures that Python, PostgreSQL, and the .NET build environment
#   are properly initialized. The Git configuration setup has been
#   moved to .devcontainer/post_start.sh, because the workspace
#   (and thus the .git folder) isn't yet mounted during this phase.
# ---------------------------------------------------------------

echo "=== Setting up IFC Server ==="

# Ensure 'python' command points to python3
ln -sf /usr/bin/python3 /usr/local/bin/python

# Wait until PostgreSQL service (container: db) is reachable
echo "Waiting for PostgreSQL to be ready..."
until nc -z db 5432; do
  sleep 1
done
echo "✅ PostgreSQL is ready."

# Build IFC Server project
cd /workspaces/poolarserver-bim-template/src/ifcserver
dotnet restore
dotnet build

echo "✅ Build complete."
echo "ℹ️  Server is *not auto-started* in development mode."
echo "👉 Use VS Code debug config: 'Launch IFC Server' to start."
