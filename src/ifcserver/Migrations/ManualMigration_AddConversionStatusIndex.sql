-- Manual Migration: Add ConversionStatus Index
-- Date: 2025-10-20
-- Description: Adds index on ConversionStatus column for better query performance

-- Create index on ConversionStatus if it doesn't already exist
CREATE INDEX IF NOT EXISTS "IX_IfcModels_ConversionStatus"
ON "IfcModels" ("ConversionStatus");

-- Verify the index was created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'IfcModels'
ORDER BY indexname;
