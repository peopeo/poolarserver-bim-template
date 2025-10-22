# Development Helper Scripts

## Process Manager

Track and manage background processes to avoid confusion and make cleanup easier.

### Quick Commands

```bash
# Register a background process
./scripts/process-manager.sh register <bash_id> "<description>"

# List all registered processes
./scripts/process-manager.sh list

# Show what's running on common ports
./scripts/process-manager.sh show-ports

# Kill a specific process
./scripts/process-manager.sh kill <bash_id>

# Kill all registered processes
./scripts/process-manager.sh kill-all

# Clear registry without killing
./scripts/process-manager.sh clear
```

### Example Workflow

```bash
# Start dotnet server in background
ASPNETCORE_ENVIRONMENT=Development dotnet run &
BASH_ID=$!  # Capture bash job ID if using &

# Or if using claude's Bash tool with run_in_background:
# You'll get a bash_id like "53dde3"

# Register it
./scripts/process-manager.sh register 53dde3 "dotnet server on port 5000"

# Check what's running
./scripts/process-manager.sh list
./scripts/process-manager.sh show-ports

# When done, kill all
./scripts/process-manager.sh kill-all
```

---

## Database Helper Scripts

## Quick Start

```bash
# List all tables
./scripts/db-helper.sh tables

# Run a custom query
./scripts/db-helper.sh query "SELECT * FROM \"Projects\";"

# Execute SQL file
./scripts/db-helper.sh file database/migrations/001_schema.sql

# Connect interactively
./scripts/db-helper.sh connect

# Count projects
./scripts/db-helper.sh count-projects

# Count revisions per project
./scripts/db-helper.sh count-revisions

# Count elements per revision
./scripts/db-helper.sh count-elements
```

## Direct psql Usage

```bash
# Connection string
PGPASSWORD=postgres psql -h db -U postgres -d ifcdb

# Run single query
PGPASSWORD=postgres psql -h db -U postgres -d ifcdb -c "SELECT version();"

# Run from file
PGPASSWORD=postgres psql -h db -U postgres -d ifcdb -f script.sql
```

## Common Queries

```sql
-- List all tables
\dt

-- Describe table structure
\d "Projects"

-- Show all constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = '"Revisions"'::regclass;

-- Show all indexes
\di

-- Show table sizes
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```
