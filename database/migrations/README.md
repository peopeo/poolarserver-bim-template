# Database Migrations

## Migration 001: Revision Control Schema (2025-10-21)

### Overview
Complete overhaul to implement BIMServer-style revision control with immutable versions and project-based organization.

### What Changed

**Dropped Tables:**
- `IfcModels` (replaced by `Revisions`)
- `IfcElements` (recreated with `RevisionId` FK)
- `ConversionJobs` (no longer needed)

**New Tables:**

#### 1. Projects
Top-level container for IFC model revisions.

```sql
CREATE TABLE "Projects" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Features:**
- Auto-updating `UpdatedAt` timestamp when revisions change
- Index on `Name` for fast lookups

---

#### 2. Revisions
Immutable IFC model versions with full version control.

```sql
CREATE TABLE "Revisions" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectId" INTEGER NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "VersionIdentifier" VARCHAR(50) NOT NULL,  -- e.g., "v1_2025-10-21_14-30-45"
    "SequenceNumber" INTEGER NOT NULL,         -- 1, 2, 3...
    "Comment" TEXT,                            -- User-provided comment
    "UploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT false,

    "IfcFilePath" TEXT NOT NULL,
    "IfcFileName" VARCHAR(255) NOT NULL,
    "GltfFilePath" TEXT,

    "ProcessingStatus" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ProcessingError" TEXT,

    UNIQUE("ProjectId", "SequenceNumber"),
    UNIQUE("ProjectId", "VersionIdentifier")
);
```

**Features:**
- **Immutable revisions**: Never update, only create new
- **Version identifiers**: Auto-generated `v{seq}_YYYY-MM-DD_HH-mm-ss`
- **Active revision tracking**: Only one active per project (enforced by trigger)
- **Processing status**: Pending → Processing → Completed/Failed
- **Cascade delete**: Deleting project deletes all revisions
- **Auto-promotion**: When active revision deleted, latest remaining becomes active (implement in backend)

**Triggers:**
- `enforce_single_active_revision`: Auto-deactivates other revisions when one is set active
- `update_project_timestamp`: Updates project's `UpdatedAt` when revisions change

---

#### 3. IfcElements
Cached element properties for instant queries (no IFC parsing needed).

```sql
CREATE TABLE "IfcElements" (
    "Id" SERIAL PRIMARY KEY,
    "RevisionId" INTEGER NOT NULL REFERENCES "Revisions"("Id") ON DELETE CASCADE,
    "GlobalId" VARCHAR(22) NOT NULL,
    "ElementType" VARCHAR(100),
    "Name" VARCHAR(255),
    "Description" TEXT,
    "PropertiesJson" JSONB,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE("RevisionId", "GlobalId")
);
```

**Features:**
- **Per-revision elements**: Same GlobalId can exist in multiple revisions
- **JSONB properties**: Fast queries with GIN index
- **Cascade delete**: Deleting revision deletes all elements
- **Unique constraint**: No duplicates within a revision

**Key Change:**
- Old: `ModelId` → New: `RevisionId`
- This allows same element (GlobalId) across multiple revisions

---

#### 4. SpatialTrees
Cached spatial hierarchy (Site → Building → Storey → Spaces).

```sql
CREATE TABLE "SpatialTrees" (
    "Id" SERIAL PRIMARY KEY,
    "RevisionId" INTEGER NOT NULL REFERENCES "Revisions"("Id") ON DELETE CASCADE,
    "TreeJson" JSONB NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE("RevisionId")
);
```

**Features:**
- **One tree per revision**: Unique constraint enforced
- **JSONB storage**: Fast queries with GIN index
- **Cascade delete**: Deleting revision deletes spatial tree

---

### Benefits of New Architecture

#### 1. No More Duplicate Key Violations ✅
**Old problem:** Re-processing model caused duplicate key errors
**Solution:** Never re-process. Each upload = new immutable revision

#### 2. Version History ✅
**Old:** Overwriting lost data
**New:** Complete history, can view/compare any version

#### 3. Simplified Caching ✅
**Old:** Cache invalidation on re-process
**New:** Immutable revisions = cache forever, no invalidation

#### 4. Clear Data Lifecycle ✅
```
Upload IFC → Create Revision (Pending) →
Process (glTF + Elements + Spatial Tree) →
Mark Completed →
Serve from cache indefinitely →
Delete revision → Cascade cleanup
```

#### 5. Professional Workflow ✅
Mimics BIMServer's proven approach:
- Projects organize related models
- Revisions track changes over time
- Active revision for current work
- Full audit trail

---

### Testing Results

All tests passed ✅

**Test 1: Single Active Revision**
```sql
-- Insert v1 (active)
-- Insert v2 (active) → v1 auto-deactivates
-- Result: Only v2 active ✓
```

**Test 2: Same GlobalId Across Revisions**
```sql
-- Insert element "1BTBFw6f90Nfh9rP1dlXr2" in revision 1
-- Insert element "1BTBFw6f90Nfh9rP1dlXr2" in revision 2
-- Result: Both exist independently ✓
```

**Test 3: Cascade Delete**
```sql
-- Delete revision → elements deleted ✓
-- Delete project → revisions + elements deleted ✓
```

**Test 4: Triggers**
```sql
-- Setting revision active → others deactivate ✓
-- Creating revision → project UpdatedAt updates ✓
```

---

### Migration Commands

**Run migration:**
```bash
./scripts/db-helper.sh file database/migrations/001_revision_control_schema.sql
```

**Verify schema:**
```bash
./scripts/db-helper.sh tables
./scripts/db-helper.sh query "\d \"Projects\""
./scripts/db-helper.sh query "\d \"Revisions\""
./scripts/db-helper.sh query "\d \"IfcElements\""
./scripts/db-helper.sh query "\d \"SpatialTrees\""
```

**Check constraints:**
```bash
./scripts/db-helper.sh query "
SELECT conname, contype FROM pg_constraint
WHERE conrelid = '\"Revisions\"'::regclass;
"
```

---

### Next Steps

1. ✅ Database schema created
2. ⏳ Create EF Core models
3. ⏳ Implement API endpoints
4. ⏳ Build UI
5. ⏳ Update viewer integration

---

### Rollback Plan

If needed, restore old schema:

```sql
-- Drop new tables
DROP TABLE IF EXISTS "SpatialTrees" CASCADE;
DROP TABLE IF EXISTS "IfcElements" CASCADE;
DROP TABLE IF EXISTS "Revisions" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;

-- Recreate old tables (would need backup or EF migration)
```

**Note:** This is a breaking change. Old data was test data and discarded.
