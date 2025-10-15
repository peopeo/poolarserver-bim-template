#!/bin/bash
set -e

# ---------------------------------------------------------------
# Purpose:
#   This script runs after every container start or attach.
#   It ensures that shared Git configuration (.gitconfig) is
#   applied *after* the workspace is mounted and recognized
#   as a valid Git repository.
# ---------------------------------------------------------------

echo "🔧 Running post-start Git setup..."
git config --global --add safe.directory /workspaces/poolarserver-bim-template

# Wait a few seconds for the workspace to be fully ready
sleep 2

# Check if this is a valid git repo
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    git config --local include.path "../.gitconfig" || true
    echo "✅ Applied shared .gitconfig (post-start)."
else
    echo "⚠️  Skipped — not a git repository yet."
fi

echo "🏁 Post-start script finished."
