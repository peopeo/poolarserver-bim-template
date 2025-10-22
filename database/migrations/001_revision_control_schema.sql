-- ============================================================
-- Migration 001: BIM Revision Control System Schema
-- Date: 2025-10-21
-- Description: Fresh schema for project-based revision control
-- ============================================================

-- Start transaction for atomic migration
BEGIN;

-- ============================================================
-- STEP 1: Drop old tables (fresh start)
-- ============================================================

DROP TABLE IF EXISTS "IfcElements" CASCADE;
DROP TABLE IF EXISTS "IfcModels" CASCADE;
DROP TABLE IF EXISTS "ConversionJobs" CASCADE;

-- Note: We keep __EFMigrationsHistory for EF Core compatibility

-- ============================================================
-- STEP 2: Create Projects table
-- ============================================================

CREATE TABLE "Projects" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster project lookups
CREATE INDEX "IX_Projects_Name" ON "Projects"("Name");

COMMENT ON TABLE "Projects" IS 'Top-level container for IFC model revisions';
COMMENT ON COLUMN "Projects"."Name" IS 'User-friendly project name';
COMMENT ON COLUMN "Projects"."Description" IS 'Optional project description';

-- ============================================================
-- STEP 3: Create Revisions table (replaces IfcModels)
-- ============================================================

CREATE TABLE "Revisions" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectId" INTEGER NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "VersionIdentifier" VARCHAR(50) NOT NULL,
    "SequenceNumber" INTEGER NOT NULL,
    "Comment" TEXT,
    "UploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT false,

    -- File paths
    "IfcFilePath" TEXT NOT NULL,
    "IfcFileName" VARCHAR(255) NOT NULL,
    "GltfFilePath" TEXT,

    -- Processing status
    "ProcessingStatus" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ProcessingError" TEXT,

    -- Ensure unique version identifiers per project
    CONSTRAINT "UQ_Revisions_ProjectId_SequenceNumber" UNIQUE("ProjectId", "SequenceNumber"),
    CONSTRAINT "UQ_Revisions_ProjectId_VersionIdentifier" UNIQUE("ProjectId", "VersionIdentifier"),

    -- Validate processing status
    CONSTRAINT "CHK_Revisions_ProcessingStatus" CHECK ("ProcessingStatus" IN ('Pending', 'Processing', 'Completed', 'Failed'))
);

-- Index for finding active revision quickly (most common query)
CREATE INDEX "IX_Revisions_ProjectId_IsActive" ON "Revisions"("ProjectId", "IsActive");

-- Index for version lookups
CREATE INDEX "IX_Revisions_VersionIdentifier" ON "Revisions"("VersionIdentifier");

-- Index for processing status queries
CREATE INDEX "IX_Revisions_ProcessingStatus" ON "Revisions"("ProcessingStatus");

COMMENT ON TABLE "Revisions" IS 'Immutable IFC model revisions with version control';
COMMENT ON COLUMN "Revisions"."VersionIdentifier" IS 'Auto-generated version ID: v{seq}_YYYY-MM-DD_HH-mm-ss';
COMMENT ON COLUMN "Revisions"."SequenceNumber" IS 'Sequential version number within project (1, 2, 3...)';
COMMENT ON COLUMN "Revisions"."Comment" IS 'User-provided comment for this revision';
COMMENT ON COLUMN "Revisions"."IsActive" IS 'Only one revision per project can be active';
COMMENT ON COLUMN "Revisions"."ProcessingStatus" IS 'Status: Pending, Processing, Completed, Failed';

-- ============================================================
-- STEP 4: Create IfcElements table (with RevisionId FK)
-- ============================================================

CREATE TABLE "IfcElements" (
    "Id" SERIAL PRIMARY KEY,
    "RevisionId" INTEGER NOT NULL REFERENCES "Revisions"("Id") ON DELETE CASCADE,
    "GlobalId" VARCHAR(22) NOT NULL,
    "ElementType" VARCHAR(100),
    "Name" VARCHAR(255),
    "Description" TEXT,
    "PropertiesJson" JSONB,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Each element must be unique within a revision
    CONSTRAINT "UQ_IfcElements_RevisionId_GlobalId" UNIQUE("RevisionId", "GlobalId")
);

-- Indexes for fast queries
CREATE INDEX "IX_IfcElements_RevisionId" ON "IfcElements"("RevisionId");
CREATE INDEX "IX_IfcElements_ElementType" ON "IfcElements"("ElementType");
CREATE INDEX "IX_IfcElements_GlobalId" ON "IfcElements"("GlobalId");

-- GIN index for JSONB property queries
CREATE INDEX "IX_IfcElements_PropertiesJson" ON "IfcElements" USING GIN("PropertiesJson");

COMMENT ON TABLE "IfcElements" IS 'Cached IFC element properties for instant queries';
COMMENT ON COLUMN "IfcElements"."GlobalId" IS 'IFC element GUID (22 characters)';
COMMENT ON COLUMN "IfcElements"."PropertiesJson" IS 'Complete property sets, quantities, and type properties';

-- ============================================================
-- STEP 5: Create SpatialTrees table
-- ============================================================

CREATE TABLE "SpatialTrees" (
    "Id" SERIAL PRIMARY KEY,
    "RevisionId" INTEGER NOT NULL REFERENCES "Revisions"("Id") ON DELETE CASCADE,
    "TreeJson" JSONB NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- One spatial tree per revision
    CONSTRAINT "UQ_SpatialTrees_RevisionId" UNIQUE("RevisionId")
);

-- Index for revision lookups
CREATE INDEX "IX_SpatialTrees_RevisionId" ON "SpatialTrees"("RevisionId");

-- GIN index for JSON queries
CREATE INDEX "IX_SpatialTrees_TreeJson" ON "SpatialTrees" USING GIN("TreeJson");

COMMENT ON TABLE "SpatialTrees" IS 'Cached spatial hierarchy (Site > Building > Storey > Spaces)';
COMMENT ON COLUMN "SpatialTrees"."TreeJson" IS 'Complete spatial tree structure as JSON';

-- ============================================================
-- STEP 6: Create function to enforce single active revision
-- ============================================================

CREATE OR REPLACE FUNCTION enforce_single_active_revision()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a revision as active, deactivate all others in the same project
    IF NEW."IsActive" = true THEN
        UPDATE "Revisions"
        SET "IsActive" = false
        WHERE "ProjectId" = NEW."ProjectId"
          AND "Id" != NEW."Id"
          AND "IsActive" = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single active revision per project
CREATE TRIGGER trigger_enforce_single_active_revision
    BEFORE INSERT OR UPDATE ON "Revisions"
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_active_revision();

COMMENT ON FUNCTION enforce_single_active_revision() IS 'Ensures only one revision per project is active';

-- ============================================================
-- STEP 7: Create function to update project UpdatedAt timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Projects"
    SET "UpdatedAt" = CURRENT_TIMESTAMP
    WHERE "Id" = NEW."ProjectId";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update project timestamp when revisions change
CREATE TRIGGER trigger_update_project_timestamp
    AFTER INSERT OR UPDATE OR DELETE ON "Revisions"
    FOR EACH ROW
    EXECUTE FUNCTION update_project_timestamp();

COMMENT ON FUNCTION update_project_timestamp() IS 'Updates project UpdatedAt when revisions change';

-- ============================================================
-- STEP 8: Insert sample data (optional, for testing)
-- ============================================================

-- Uncomment to insert test data:
-- INSERT INTO "Projects" ("Name", "Description")
-- VALUES ('Sample Project', 'Test project for development');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Show all tables
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Show table structures
-- \d "Projects"
-- \d "Revisions"
-- \d "IfcElements"
-- \d "SpatialTrees"

-- Show constraints
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = '"Revisions"'::regclass;

-- ============================================================
-- COMMIT MIGRATION
-- ============================================================

COMMIT;

-- Success message
SELECT 'Migration 001 completed successfully!' as status;
