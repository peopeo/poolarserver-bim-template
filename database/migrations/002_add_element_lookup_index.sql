-- ============================================================
-- Migration 002: Add composite index for fast element lookups
-- Date: 2025-10-21
-- Description: Optimize property queries by adding composite index
-- ============================================================

BEGIN;

-- Drop existing individual indexes (they'll be redundant)
DROP INDEX IF EXISTS "IX_IfcElements_RevisionId";
DROP INDEX IF EXISTS "IX_IfcElements_GlobalId";

-- Create composite index for the most common query pattern:
-- WHERE RevisionId = ? AND GlobalId = ?
CREATE INDEX "IX_IfcElements_RevisionId_GlobalId"
ON "IfcElements"("RevisionId", "GlobalId");

-- This composite index also helps queries that filter only by RevisionId
-- (since RevisionId is the first column in the index)

COMMIT;

SELECT 'Migration 002 completed: Added composite index for element lookups' as status;
