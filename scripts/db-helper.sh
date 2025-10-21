#!/bin/bash

# Database connection helper script
# Makes it easy to run PostgreSQL queries during development

DB_HOST="db"
DB_USER="postgres"
DB_NAME="ifcdb"
DB_PASSWORD="postgres"

# Function to run a query
query() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "$1"
}

# Function to run a query from file
query_file() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$1"
}

# Function to connect interactively
connect() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME
}

# Show help if no arguments
if [ $# -eq 0 ]; then
    echo "Database Helper Script"
    echo "====================="
    echo ""
    echo "Usage:"
    echo "  ./scripts/db-helper.sh query \"SELECT * FROM \\\"Projects\\\";\""
    echo "  ./scripts/db-helper.sh file path/to/script.sql"
    echo "  ./scripts/db-helper.sh connect"
    echo "  ./scripts/db-helper.sh tables"
    echo "  ./scripts/db-helper.sh count-projects"
    echo "  ./scripts/db-helper.sh count-revisions"
    echo "  ./scripts/db-helper.sh count-elements"
    echo ""
    echo "Environment:"
    echo "  DB_HOST=$DB_HOST"
    echo "  DB_USER=$DB_USER"
    echo "  DB_NAME=$DB_NAME"
    exit 0
fi

# Parse command
case "$1" in
    query)
        query "$2"
        ;;
    file)
        query_file "$2"
        ;;
    connect)
        connect
        ;;
    tables)
        query "\dt"
        ;;
    count-projects)
        query "SELECT COUNT(*) as project_count FROM \"Projects\";"
        ;;
    count-revisions)
        query "SELECT \"ProjectId\", COUNT(*) as revision_count FROM \"Revisions\" GROUP BY \"ProjectId\";"
        ;;
    count-elements)
        query "SELECT \"RevisionId\", COUNT(*) as element_count FROM \"IfcElements\" GROUP BY \"RevisionId\";"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run without arguments for help"
        exit 1
        ;;
esac
