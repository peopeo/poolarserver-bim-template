-- ============================================================
-- Migration 003: Processing Metrics & Engine Tracking
-- Date: 2025-10-22
-- Description: Add metrics collection for performance and reliability analysis
-- ============================================================

-- Start transaction for atomic migration
BEGIN;

-- ============================================================
-- STEP 1: Add ProcessingEngine column to Revisions
-- ============================================================

ALTER TABLE "Revisions"
ADD COLUMN "ProcessingEngine" VARCHAR(20) NOT NULL DEFAULT 'IfcOpenShell';

-- Add constraint to ensure valid engine names
ALTER TABLE "Revisions"
ADD CONSTRAINT "CHK_Revisions_ProcessingEngine"
    CHECK ("ProcessingEngine" IN ('IfcOpenShell', 'Xbim'));

-- Add index for engine queries
CREATE INDEX "IX_Revisions_ProcessingEngine" ON "Revisions"("ProcessingEngine");

-- Add column to track element count (denormalized for performance)
ALTER TABLE "Revisions"
ADD COLUMN "ElementCount" INTEGER DEFAULT 0;

COMMENT ON COLUMN "Revisions"."ProcessingEngine" IS 'IFC processing engine: IfcOpenShell or Xbim';
COMMENT ON COLUMN "Revisions"."ElementCount" IS 'Total number of IFC elements extracted (denormalized)';

-- ============================================================
-- STEP 2: Create ProcessingMetrics table
-- ============================================================

CREATE TABLE "ProcessingMetrics" (
    "Id" SERIAL PRIMARY KEY,
    "RevisionId" INTEGER NOT NULL REFERENCES "Revisions"("Id") ON DELETE CASCADE,
    "ProcessingEngine" VARCHAR(20) NOT NULL,

    -- File Information
    "FileSizeBytes" BIGINT NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,

    -- Timing Metrics (milliseconds)
    "TotalProcessingTimeMs" INTEGER,
    "ParseTimeMs" INTEGER,
    "ElementExtractionTimeMs" INTEGER,
    "SpatialTreeTimeMs" INTEGER,
    "GltfExportTimeMs" INTEGER,

    -- Element Statistics
    "TotalElementCount" INTEGER,
    "IfcWallCount" INTEGER DEFAULT 0,
    "IfcSlabCount" INTEGER DEFAULT 0,
    "IfcBeamCount" INTEGER DEFAULT 0,
    "IfcColumnCount" INTEGER DEFAULT 0,
    "IfcDoorCount" INTEGER DEFAULT 0,
    "IfcWindowCount" INTEGER DEFAULT 0,
    "IfcStairCount" INTEGER DEFAULT 0,
    "IfcRailingCount" INTEGER DEFAULT 0,
    "IfcRoofCount" INTEGER DEFAULT 0,
    "IfcCoveringCount" INTEGER DEFAULT 0,
    "IfcFurnishingCount" INTEGER DEFAULT 0,
    "IfcSpaceCount" INTEGER DEFAULT 0,
    "OtherElementCount" INTEGER DEFAULT 0,

    -- Property Statistics
    "TotalPropertySets" INTEGER DEFAULT 0,
    "TotalProperties" INTEGER DEFAULT 0,
    "TotalQuantities" INTEGER DEFAULT 0,

    -- Output Statistics
    "GltfFileSizeBytes" BIGINT,
    "SpatialTreeDepth" INTEGER,
    "SpatialTreeNodeCount" INTEGER,

    -- Resource Usage
    "PeakMemoryMb" INTEGER,
    "CpuTimeMs" INTEGER,

    -- Success/Failure
    "Success" BOOLEAN NOT NULL DEFAULT false,
    "ErrorMessage" TEXT,
    "ErrorStackTrace" TEXT,
    "WarningCount" INTEGER DEFAULT 0,

    -- Timestamps
    "StartedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP,

    -- Constraints
    CONSTRAINT "CHK_ProcessingMetrics_Engine"
        CHECK ("ProcessingEngine" IN ('IfcOpenShell', 'Xbim')),
    CONSTRAINT "UQ_ProcessingMetrics_RevisionId"
        UNIQUE ("RevisionId")
);

-- Indexes for analysis queries
CREATE INDEX "IX_ProcessingMetrics_RevisionId" ON "ProcessingMetrics"("RevisionId");
CREATE INDEX "IX_ProcessingMetrics_Engine" ON "ProcessingMetrics"("ProcessingEngine");
CREATE INDEX "IX_ProcessingMetrics_Success" ON "ProcessingMetrics"("Success");
CREATE INDEX "IX_ProcessingMetrics_StartedAt" ON "ProcessingMetrics"("StartedAt");
CREATE INDEX "IX_ProcessingMetrics_TotalProcessingTimeMs" ON "ProcessingMetrics"("TotalProcessingTimeMs");
CREATE INDEX "IX_ProcessingMetrics_FileSizeBytes" ON "ProcessingMetrics"("FileSizeBytes");

COMMENT ON TABLE "ProcessingMetrics" IS 'Detailed performance and reliability metrics for IFC processing';
COMMENT ON COLUMN "ProcessingMetrics"."TotalProcessingTimeMs" IS 'Total end-to-end processing time in milliseconds';
COMMENT ON COLUMN "ProcessingMetrics"."ParseTimeMs" IS 'IFC file parsing time in milliseconds';
COMMENT ON COLUMN "ProcessingMetrics"."ElementExtractionTimeMs" IS 'Element and property extraction time in milliseconds';
COMMENT ON COLUMN "ProcessingMetrics"."SpatialTreeTimeMs" IS 'Spatial tree generation time in milliseconds';
COMMENT ON COLUMN "ProcessingMetrics"."GltfExportTimeMs" IS 'glTF export time in milliseconds';
COMMENT ON COLUMN "ProcessingMetrics"."PeakMemoryMb" IS 'Peak memory usage during processing in megabytes';

-- ============================================================
-- STEP 3: Create ProcessingLogs table
-- ============================================================

CREATE TABLE "ProcessingLogs" (
    "Id" SERIAL PRIMARY KEY,
    "RevisionId" INTEGER NOT NULL REFERENCES "Revisions"("Id") ON DELETE CASCADE,
    "ProcessingEngine" VARCHAR(20) NOT NULL,
    "LogLevel" VARCHAR(20) NOT NULL,
    "Message" TEXT NOT NULL,
    "Exception" TEXT,
    "AdditionalData" JSONB,
    "Timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT "CHK_ProcessingLogs_LogLevel"
        CHECK ("LogLevel" IN ('Debug', 'Info', 'Warning', 'Error', 'Critical'))
);

-- Indexes for log queries
CREATE INDEX "IX_ProcessingLogs_RevisionId" ON "ProcessingLogs"("RevisionId");
CREATE INDEX "IX_ProcessingLogs_LogLevel" ON "ProcessingLogs"("LogLevel");
CREATE INDEX "IX_ProcessingLogs_Timestamp" ON "ProcessingLogs"("Timestamp");
CREATE INDEX "IX_ProcessingLogs_Engine" ON "ProcessingLogs"("ProcessingEngine");

-- GIN index for JSONB queries on additional data
CREATE INDEX "IX_ProcessingLogs_AdditionalData" ON "ProcessingLogs" USING GIN("AdditionalData");

COMMENT ON TABLE "ProcessingLogs" IS 'Structured logs for IFC processing jobs';
COMMENT ON COLUMN "ProcessingLogs"."LogLevel" IS 'Log level: Debug, Info, Warning, Error, Critical';
COMMENT ON COLUMN "ProcessingLogs"."AdditionalData" IS 'Additional structured data (JSON format)';

-- ============================================================
-- STEP 4: Create views for metrics analysis
-- ============================================================

-- View: Engine performance comparison
CREATE VIEW "vw_EnginePerformance" AS
SELECT
    "ProcessingEngine",
    COUNT(*) as "TotalJobs",
    SUM(CASE WHEN "Success" THEN 1 ELSE 0 END) as "SuccessfulJobs",
    SUM(CASE WHEN NOT "Success" THEN 1 ELSE 0 END) as "FailedJobs",
    ROUND(SUM(CASE WHEN "Success" THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as "SuccessRatePercent",
    ROUND(AVG("TotalProcessingTimeMs")) as "AvgProcessingTimeMs",
    ROUND(AVG("TotalElementCount")) as "AvgElementCount",
    ROUND(AVG("FileSizeBytes") / (1024 * 1024), 2) as "AvgFileSizeMb",
    MIN("TotalProcessingTimeMs") as "FastestTimeMs",
    MAX("TotalProcessingTimeMs") as "SlowestTimeMs",
    SUM("WarningCount") as "TotalWarnings"
FROM "ProcessingMetrics"
GROUP BY "ProcessingEngine";

COMMENT ON VIEW "vw_EnginePerformance" IS 'Aggregate performance statistics by processing engine';

-- View: Recent failures with details
CREATE VIEW "vw_RecentFailures" AS
SELECT
    pm."Id" as "MetricId",
    pm."RevisionId",
    pm."ProcessingEngine",
    r."IfcFileName",
    ROUND(pm."FileSizeBytes" / (1024.0 * 1024.0), 2) as "FileSizeMb",
    pm."ErrorMessage",
    pm."StartedAt",
    pm."CompletedAt",
    pm."TotalProcessingTimeMs"
FROM "ProcessingMetrics" pm
JOIN "Revisions" r ON pm."RevisionId" = r."Id"
WHERE pm."Success" = false
ORDER BY pm."StartedAt" DESC;

COMMENT ON VIEW "vw_RecentFailures" IS 'Recent processing failures with error details';

-- View: Processing time by file size
CREATE VIEW "vw_ProcessingTimeByFileSize" AS
SELECT
    "ProcessingEngine",
    CASE
        WHEN "FileSizeBytes" < 1048576 THEN '< 1 MB'
        WHEN "FileSizeBytes" < 10485760 THEN '1-10 MB'
        WHEN "FileSizeBytes" < 52428800 THEN '10-50 MB'
        WHEN "FileSizeBytes" < 104857600 THEN '50-100 MB'
        ELSE '> 100 MB'
    END as "FileSizeRange",
    COUNT(*) as "JobCount",
    ROUND(AVG("TotalProcessingTimeMs")) as "AvgProcessingTimeMs",
    ROUND(AVG("TotalElementCount")) as "AvgElementCount",
    ROUND(AVG("TotalProcessingTimeMs") / NULLIF(AVG("TotalElementCount"), 0), 2) as "MsPerElement"
FROM "ProcessingMetrics"
WHERE "Success" = true
GROUP BY "ProcessingEngine",
    CASE
        WHEN "FileSizeBytes" < 1048576 THEN '< 1 MB'
        WHEN "FileSizeBytes" < 10485760 THEN '1-10 MB'
        WHEN "FileSizeBytes" < 52428800 THEN '10-50 MB'
        WHEN "FileSizeBytes" < 104857600 THEN '50-100 MB'
        ELSE '> 100 MB'
    END
ORDER BY "ProcessingEngine", "FileSizeRange";

COMMENT ON VIEW "vw_ProcessingTimeByFileSize" IS 'Processing time statistics grouped by file size ranges';

-- View: Element type distribution
CREATE VIEW "vw_ElementTypeDistribution" AS
SELECT
    "ProcessingEngine",
    COUNT(*) as "TotalJobs",
    ROUND(AVG("IfcWallCount")) as "AvgWalls",
    ROUND(AVG("IfcSlabCount")) as "AvgSlabs",
    ROUND(AVG("IfcBeamCount")) as "AvgBeams",
    ROUND(AVG("IfcColumnCount")) as "AvgColumns",
    ROUND(AVG("IfcDoorCount")) as "AvgDoors",
    ROUND(AVG("IfcWindowCount")) as "AvgWindows",
    ROUND(AVG("IfcStairCount")) as "AvgStairs",
    ROUND(AVG("IfcSpaceCount")) as "AvgSpaces",
    ROUND(AVG("OtherElementCount")) as "AvgOther"
FROM "ProcessingMetrics"
WHERE "Success" = true
GROUP BY "ProcessingEngine";

COMMENT ON VIEW "vw_ElementTypeDistribution" IS 'Average element type counts by processing engine';

-- ============================================================
-- STEP 5: Create function to update revision element count
-- ============================================================

CREATE OR REPLACE FUNCTION update_revision_element_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the denormalized ElementCount in Revisions table
    IF NEW."TotalElementCount" IS NOT NULL THEN
        UPDATE "Revisions"
        SET "ElementCount" = NEW."TotalElementCount"
        WHERE "Id" = NEW."RevisionId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update element count
CREATE TRIGGER trigger_update_revision_element_count
    AFTER INSERT OR UPDATE ON "ProcessingMetrics"
    FOR EACH ROW
    EXECUTE FUNCTION update_revision_element_count();

COMMENT ON FUNCTION update_revision_element_count() IS 'Automatically updates Revisions.ElementCount from ProcessingMetrics';

-- ============================================================
-- STEP 6: Migrate existing data
-- ============================================================

-- Set ElementCount for existing revisions based on IfcElements table
UPDATE "Revisions" r
SET "ElementCount" = (
    SELECT COUNT(*)
    FROM "IfcElements" e
    WHERE e."RevisionId" = r."Id"
)
WHERE "ElementCount" = 0;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Show engine performance view
-- SELECT * FROM "vw_EnginePerformance";

-- Show recent failures
-- SELECT * FROM "vw_RecentFailures" LIMIT 10;

-- Show processing time by file size
-- SELECT * FROM "vw_ProcessingTimeByFileSize";

-- ============================================================
-- COMMIT MIGRATION
-- ============================================================

COMMIT;

-- Success message
SELECT 'Migration 003 completed successfully!' as status,
       'Added ProcessingEngine column, ProcessingMetrics table, ProcessingLogs table, and analysis views' as details;
