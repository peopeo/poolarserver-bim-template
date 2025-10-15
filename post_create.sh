#!/bin/bash
set -e

echo "=== Setting up IFC Server ==="

# Ensure python command exists
ln -sf /usr/bin/python3 /usr/local/bin/python

# Wait for PostgreSQL (db) to be reachable
echo "Waiting for PostgreSQL to be ready..."
until nc -z db 5432; do
  sleep 1
done

echo "PostgreSQL is ready."

# Restore and build project
cd /workspaces/poolarserver-bim-template/src/ifcserver
dotnet restore
dotnet build

# Start the API server in background
echo "Starting .NET API Server..."
nohup dotnet run --urls=http://0.0.0.0:5000 > /workspaces/poolarserver-bim-template/dotnet.log 2>&1 &

echo "=== IFC Server started ==="
echo "Swagger UI available at: http://localhost:5000/swagger"
