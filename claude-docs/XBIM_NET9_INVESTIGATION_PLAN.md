# XBIM .NET 9 Compatibility Investigation & Fix Plan

**Branch**: `feature/xbim-dotnet9-compatibility`
**Date**: 2025-10-22
**Status**: Planning Phase

---

## Executive Summary

**Goal**: Enable XBIM Toolkit integration for IFC processing in .NET 9 environment to provide engine comparison capabilities alongside IfcOpenShell.

**Current Status**: XBIM implementation complete but disabled due to 18 compilation errors from .NET 9 incompatibility.

**Disabled Files**:
- `src/ifcserver/_disabled_xbim/IXbimIfcService.cs` (5 KB)
- `src/ifcserver/_disabled_xbim/XbimIfcService.cs` (22 KB)
- `src/ifcserver/_disabled_xbim/XbimRevisionsController.cs` (22 KB)

---

## Phase 1: Research XBIM .NET 9 Compatibility

### Objective
Determine if official .NET 9 compatible XBIM packages exist or are in development.

### Tasks

#### 1.1 Check XBIM Official Sources
- [ ] Visit XBIM Toolkit GitHub repository (https://github.com/xBimTeam/XbimEssentials)
- [ ] Check latest releases and target frameworks
- [ ] Review open/closed issues related to .NET 9 compatibility
- [ ] Check NuGet package metadata for latest versions
- [ ] Review XBIM documentation for migration guides

**Commands**:
```bash
# Check current XBIM package versions in project
dotnet list src/ifcserver/IfcServer.csproj package | grep -i xbim

# Search NuGet for latest XBIM packages
dotnet package search Xbim --exact-match --take 10
```

#### 1.2 Research Community Solutions
- [ ] Search GitHub issues for ".NET 9 XBIM" or similar
- [ ] Check Stack Overflow for recent XBIM .NET Core/9 questions
- [ ] Review XBIM community forums/discussions
- [ ] Check for fork repositories with .NET 9 support

**Search Terms**:
- "XBIM .NET 9"
- "XBIM .NET Core 9"
- "XBIM netstandard2.1"
- "XbimEssentials compatibility"

#### 1.3 Analyze Package Dependencies
- [ ] Check which XBIM packages are already installed
- [ ] Review their target frameworks
- [ ] Identify dependency chain
- [ ] Check for preview/beta packages

**Expected Packages**:
- Xbim.Ifc (Core IFC schema and access)
- Xbim.Ifc4 (IFC4 schema)
- Xbim.Geometry.Engine.Interop (Geometry processing)
- Xbim.Essentials (Base framework)

### Success Criteria
- ✅ Found .NET 9 compatible XBIM packages
- ✅ Identified migration path
- ✅ Confirmed package availability

### Fallback Options
If no .NET 9 packages exist:
- **Option A**: Use .NET 8 for XBIM (last known working version)
- **Option B**: Use .NET Standard 2.1 packages (if compatible)
- **Option C**: Explore IfcOpenShell.NET as alternative
- **Option D**: Wait for official .NET 9 support

**Decision Point**: Choose path based on research findings

---

## Phase 2: Analyze Compilation Errors in Detail

### Objective
Categorize and understand all 18 compilation errors to determine fix complexity.

### Tasks

#### 2.1 Re-enable XBIM Files Temporarily
```bash
# Copy files back to main directory (don't commit yet)
cp src/ifcserver/_disabled_xbim/*.cs src/ifcserver/Services/
cp src/ifcserver/_disabled_xbim/XbimRevisionsController.cs src/ifcserver/Controllers/

# Remove from .csproj exclusion
# Edit IfcServer.csproj to remove _disabled_xbim exclusion
```

#### 2.2 Capture Full Error Output
```bash
# Build and capture all errors
dotnet build src/ifcserver/IfcServer.csproj 2>&1 | tee xbim_errors.log
```

#### 2.3 Categorize Errors

**Category 1: Missing Types/Enums** (e.g., XbimDBAccess)
- Count: TBD
- Impact: Critical - cannot compile
- Fix difficulty: Hard (requires package updates or workarounds)

**Category 2: Property/Method Mismatches** (e.g., IfcMetadata properties)
- Count: TBD
- Impact: Critical - cannot compile
- Fix difficulty: Medium (can potentially use alternative APIs)

**Category 3: API Changes** (e.g., SpatialNode properties)
- Count: TBD
- Impact: Critical - cannot compile
- Fix difficulty: Medium (can refactor to use available APIs)

**Category 4: Namespace Issues**
- Count: TBD
- Impact: Low - easily fixable
- Fix difficulty: Easy

#### 2.4 Document Each Error
Create detailed table:

| # | Error Code | File | Line | Description | Category | Proposed Fix |
|---|------------|------|------|-------------|----------|--------------|
| 1 | CS0246 | XbimIfcService.cs | 45 | XbimDBAccess not found | Missing Type | Use alternative or update package |
| ... | ... | ... | ... | ... | ... | ... |

### Success Criteria
- ✅ All 18 errors documented
- ✅ Errors categorized by type
- ✅ Fix complexity estimated
- ✅ Alternative APIs identified

---

## Phase 3: Test XBIM Package Versions

### Objective
Find the optimal XBIM package versions that work with .NET 9.

### Approach A: Test Latest XBIM Packages

#### 3.1 Update to Latest Stable Versions
```bash
# Update all XBIM packages to latest
dotnet add src/ifcserver/IfcServer.csproj package Xbim.Ifc
dotnet add src/ifcserver/IfcServer.csproj package Xbim.Ifc4
dotnet add src/ifcserver/IfcServer.csproj package Xbim.Geometry.Engine.Interop
dotnet add src/ifcserver/IfcServer.csproj package Xbim.Essentials

# Check what versions were installed
dotnet list src/ifcserver/IfcServer.csproj package | grep Xbim
```

#### 3.2 Test Build
```bash
dotnet build src/ifcserver/IfcServer.csproj
```

#### 3.3 Document Results
- [ ] Note which errors remain
- [ ] Note which errors were fixed
- [ ] Document breaking changes

### Approach B: Test Preview/Beta Packages

#### 3.4 Search for Preview Versions
```bash
# Search for preview packages
dotnet package search Xbim.Ifc --prerelease

# Install specific preview version (if exists)
dotnet add src/ifcserver/IfcServer.csproj package Xbim.Ifc --version 6.0.0-preview1
```

### Approach C: Downgrade .NET Version (Fallback)

#### 3.5 Test with .NET 8
```xml
<!-- Edit IfcServer.csproj -->
<TargetFramework>net8.0</TargetFramework>
```

```bash
# Build with .NET 8
dotnet build src/ifcserver/IfcServer.csproj

# Test if XBIM compiles
```

### Success Criteria
- ✅ Found working package combination
- ✅ Build succeeds
- ✅ Basic XBIM functionality works

### Decision Matrix

| Scenario | Action |
|----------|--------|
| Latest packages work with .NET 9 | ✅ Proceed to Phase 4 |
| Preview packages work | ✅ Proceed to Phase 4 (note stability risk) |
| .NET 8 works, .NET 9 doesn't | 🔄 Create microservice architecture decision |
| Nothing works | 🔄 Evaluate alternatives (IfcOpenShell.NET, wait, etc.) |

---

## Phase 4: Implement Fixes or Workarounds

### Objective
Fix compilation errors and restore XBIM functionality.

### Strategy A: Code-Level Fixes (If API changes only)

#### 4.1 Fix Missing Type Errors

**Example: XbimDBAccess enum**
```csharp
// OLD CODE (doesn't work):
var model = IfcStore.Open(ifcFilePath, XbimDBAccess.Read);

// OPTION 1: Use alternative API
var model = IfcStore.Open(ifcFilePath);

// OPTION 2: Use different model loader
var model = MemoryModel.OpenRead(ifcFilePath);

// OPTION 3: Check if enum moved to different namespace
using Xbim.IO; // might have XbimDBAccess
```

#### 4.2 Fix Property Mismatches

**Example: IfcMetadata properties**
```csharp
// OLD CODE:
var schema = metadata.SchemaVersion;
var mvd = metadata.Mvd;

// NEW CODE (if properties renamed):
var schema = metadata.IfcSchemaVersion;
var mvd = metadata.ModelViewDefinition;

// OR (if properties removed):
// Find alternative way to get schema info
var schema = model.SchemaVersion; // might be on model itself
```

#### 4.3 Fix SpatialNode Issues

**Example: Type vs IfcType**
```csharp
// OLD CODE:
Type = node.IfcType,
ObjectType = node.ObjectType,

// NEW CODE:
IfcType = node.IfcType ?? node.ExpressType?.Name,
ObjectType = node.ObjectType ?? "",
```

### Strategy B: Architecture Changes (If major incompatibility)

#### 4.4 Option: Separate .NET 8 Microservice

**Pros**:
- Use proven .NET 8 + XBIM combination
- Isolate XBIM dependencies
- No need to wait for .NET 9 support

**Cons**:
- More complex deployment
- Inter-service communication overhead
- Need Docker orchestration

**Architecture**:
```
┌─────────────────────┐      ┌──────────────────────┐
│  Main .NET 9 API    │      │  XBIM .NET 8 Service │
│  (IfcOpenShell)     │◄────►│  (XBIM only)         │
│  Port 5000          │ HTTP │  Port 5001           │
└─────────────────────┘      └──────────────────────┘
```

**Implementation**:
```bash
# Create new .NET 8 project
dotnet new webapi -n XbimService -f net8.0

# Copy XBIM implementation
cp src/ifcserver/_disabled_xbim/*.cs XbimService/

# Set up communication
# Main API calls XBIM service at http://localhost:5001
```

#### 4.5 Option: Use IfcOpenShell.NET Instead

**Research**:
- [ ] Check if IfcOpenShell.NET exists
- [ ] Verify .NET 9 compatibility
- [ ] Compare API similarity to XBIM
- [ ] Assess migration effort

### Strategy C: Hybrid Approach

#### 4.6 Use XBIM Where Compatible, Python for Incompatible
```csharp
// Use XBIM for basic parsing
var model = IfcStore.Open(ifcFilePath);

// Fall back to Python for geometry
var gltfResult = await _pythonService.ExportGltfAsync(ifcFilePath);
```

### Success Criteria
- ✅ All compilation errors resolved
- ✅ XBIM service builds successfully
- ✅ Basic IFC file can be opened
- ✅ Architecture decision documented

---

## Phase 5: Enable and Test XBIM Integration

### Objective
Restore full XBIM functionality and verify it works end-to-end.

### Tasks

#### 5.1 Move Files Back to Active Directory
```bash
# Move XBIM files from _disabled_xbim to active locations
mv src/ifcserver/_disabled_xbim/IXbimIfcService.cs src/ifcserver/Services/
mv src/ifcserver/_disabled_xbim/XbimIfcService.cs src/ifcserver/Services/
mv src/ifcserver/_disabled_xbim/XbimRevisionsController.cs src/ifcserver/Controllers/

# Update IfcServer.csproj to remove exclusion
```

#### 5.2 Register XBIM Services in DI Container
```csharp
// In Program.cs
builder.Services.AddScoped<IXbimIfcService, XbimIfcService>();

// Enable XBIM controller
// (should auto-discover after moving to Controllers/)
```

#### 5.3 Update Frontend EngineSelector
```tsx
// Enable XBIM option
<EngineSelector
  selectedEngine={selectedEngine}
  onSelect={setSelectedEngine}
  darkMode={darkMode}
  xbimEnabled={true}  // Change from false to true
/>
```

#### 5.4 Test Basic XBIM Functionality

**Test 1: File Upload with XBIM**
```bash
# Via API
curl -X POST http://localhost:5000/api/xbim/projects/1/revisions/upload \
  -F "file=@/path/to/Duplex.ifc" \
  -F "comment=Testing XBIM"
```

**Test 2: Element Extraction**
```bash
# Check elements were extracted
curl http://localhost:5000/api/projects/1/revisions/{id}
```

**Test 3: glTF Export**
```bash
# Check glTF file was created
curl -I http://localhost:5000/api/projects/1/revisions/{id}/gltf
```

**Test 4: Spatial Tree**
```bash
# Check spatial tree was built
curl http://localhost:5000/api/projects/1/revisions/{id}/spatial-tree
```

#### 5.5 Test Error Handling
- [ ] Upload invalid IFC file
- [ ] Upload corrupted IFC file
- [ ] Test with large IFC file (>100 MB)
- [ ] Verify error messages are logged

### Success Criteria
- ✅ XBIM upload endpoint works (`/api/xbim/projects/{id}/revisions/upload`)
- ✅ Elements extracted successfully
- ✅ glTF file generated
- ✅ Spatial tree built
- ✅ Error handling works
- ✅ Metrics collected

---

## Phase 6: Compare Performance with IfcOpenShell

### Objective
Validate that XBIM integration provides value through performance comparison.

### Tasks

#### 6.1 Prepare Test Files
```bash
# Use existing test files
TEST_FILE_1="Duplex.ifc"         # Small (1.24 MB, 245 elements)
TEST_FILE_2="Architecture.ifc"    # Large (109 MB, thousands of elements)
```

#### 6.2 Run Parallel Tests

**Test Script**:
```bash
#!/bin/bash

# Upload same file with both engines
PROJECT_ID=15

# Test IfcOpenShell
echo "Testing IfcOpenShell..."
IFCOS_ID=$(curl -X POST http://localhost:5000/api/projects/$PROJECT_ID/revisions/upload \
  -F "file=@Duplex.ifc" -F "comment=IfcOpenShell test" | jq -r '.id')

# Test XBIM
echo "Testing XBIM..."
XBIM_ID=$(curl -X POST http://localhost:5000/api/xbim/projects/$PROJECT_ID/revisions/upload \
  -F "file=@Duplex.ifc" -F "comment=XBIM test" | jq -r '.id')

# Wait for processing
sleep 10

# Get metrics
curl http://localhost:5000/api/metrics/revisions/$IFCOS_ID > ifcos_metrics.json
curl http://localhost:5000/api/metrics/revisions/$XBIM_ID > xbim_metrics.json

# Compare
curl "http://localhost:5000/api/metrics/compare?ifcOpenShellRevisionId=$IFCOS_ID&xbimRevisionId=$XBIM_ID" > comparison.json
```

#### 6.3 Analyze Results

**Metrics to Compare**:
- Total processing time
- Parse time
- Element extraction time
- Spatial tree time
- glTF export time
- Element count accuracy
- Memory usage
- Success/failure rate

**Expected Analysis**:
```python
import json

# Load metrics
with open('comparison.json') as f:
    comparison = json.load(f)

summary = comparison['summary']
print(f"Faster Engine: {summary['fasterEngine']}")
print(f"Speed Difference: {summary['speedDifferenceMs']}ms ({summary['speedDifferencePercent']}%)")
print(f"Element Counts Match: {summary['elementCountsMatch']}")
print(f"Recommendation: {summary['recommendation']}")
```

#### 6.4 Test Multiple Files
- [ ] Small IFC file (< 5 MB)
- [ ] Medium IFC file (5-50 MB)
- [ ] Large IFC file (> 50 MB)
- [ ] Complex geometry file
- [ ] Simple building file

#### 6.5 Document Performance Characteristics

Create comparison table:

| Metric | IfcOpenShell | XBIM | Winner |
|--------|--------------|------|--------|
| Parse Time | 51ms | TBD | TBD |
| Element Extraction | 31ms | TBD | TBD |
| Spatial Tree | 330ms | TBD | TBD |
| glTF Export | 1551ms | TBD | TBD |
| **Total** | **2344ms** | **TBD** | **TBD** |
| Elements Found | 245 | TBD | TBD |
| Accuracy | ✅ | TBD | TBD |

### Success Criteria
- ✅ Both engines process same files successfully
- ✅ Performance data collected for both
- ✅ Comparison API works
- ✅ Metrics dashboard shows both engines
- ✅ Clear performance winner identified (or trade-offs documented)

---

## Risk Assessment & Mitigation

### Risk 1: No .NET 9 Compatible XBIM Packages Exist
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Fallback to .NET 8 microservice
- Consider IfcOpenShell.NET alternative
- Document decision to wait for official support

### Risk 2: Breaking API Changes Too Extensive
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Extensive refactoring required
- May need to use different XBIM APIs
- Consider hybrid approach (XBIM + Python)

### Risk 3: XBIM Performance Not Competitive
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Document performance characteristics
- Use XBIM for specific use cases where it excels
- Keep both engines available for user choice

### Risk 4: XBIM License Issues
**Probability**: Low
**Impact**: High
**Mitigation**:
- Review XBIM license (CDDL 1.0)
- Ensure compatibility with project license
- Have legal review if commercial use

---

## Decision Tree

```
Start Investigation
    │
    ├─► Research XBIM .NET 9 Support
    │       │
    │       ├─► Official packages exist?
    │       │       ├─► YES → Update packages → Test → Done ✅
    │       │       └─► NO → Continue
    │       │
    │       └─► Preview/Beta packages exist?
    │               ├─► YES → Test stability → Decide
    │               └─► NO → Continue
    │
    ├─► Analyze Compilation Errors
    │       │
    │       ├─► Fixable with code changes?
    │       │       ├─► YES → Implement fixes → Done ✅
    │       │       └─► NO → Continue
    │       │
    │       └─► Major API breaking changes?
    │               ├─► YES → Consider alternatives
    │               └─► NO → Continue
    │
    ├─► Test .NET 8 Compatibility
    │       │
    │       ├─► Works with .NET 8?
    │       │       ├─► YES → Microservice option
    │       │       └─► NO → XBIM fundamentally broken
    │       │
    │       └─► Microservice viable?
    │               ├─► YES → Implement .NET 8 service ✅
    │               └─► NO → Continue
    │
    └─► Evaluate Alternatives
            │
            ├─► IfcOpenShell.NET exists?
            │       ├─► YES → Migrate to IfcOpenShell.NET ✅
            │       └─► NO → Continue
            │
            └─► Final Decision
                    ├─► Wait for XBIM .NET 9 support ⏳
                    ├─► Use IfcOpenShell only ✅
                    └─► Build custom C# IFC parser 🛠️
```

---

## Timeline Estimate

### Optimistic (All goes well)
- **Phase 1**: 2 hours (research)
- **Phase 2**: 1 hour (error analysis)
- **Phase 3**: 2 hours (package testing)
- **Phase 4**: 4 hours (fixes)
- **Phase 5**: 3 hours (testing)
- **Phase 6**: 4 hours (performance comparison)
- **Total**: ~16 hours (~2 days)

### Realistic (Some issues)
- **Phase 1**: 3 hours (research + community search)
- **Phase 2**: 2 hours (detailed error analysis)
- **Phase 3**: 4 hours (multiple package versions)
- **Phase 4**: 8 hours (significant refactoring)
- **Phase 5**: 4 hours (debugging)
- **Phase 6**: 4 hours (performance comparison)
- **Total**: ~25 hours (~3-4 days)

### Pessimistic (Major blockers)
- **Phase 1**: 4 hours (extensive research)
- **Phase 2**: 3 hours (complex error categorization)
- **Phase 3**: 8 hours (trying many approaches)
- **Phase 4**: 16 hours (microservice setup or major refactoring)
- **Phase 5**: 8 hours (extensive debugging)
- **Phase 6**: 6 hours (comprehensive testing)
- **Total**: ~45 hours (~1 week)

---

## Success Metrics

### Must Have (Phase 1-4)
- ✅ XBIM compiles without errors
- ✅ Basic IFC file parsing works
- ✅ Architecture decision documented

### Should Have (Phase 5)
- ✅ Full processing pipeline works (parse → extract → spatial tree → glTF)
- ✅ XBIM endpoints functional
- ✅ Error handling tested

### Nice to Have (Phase 6)
- ✅ Performance comparison completed
- ✅ Clear engine recommendation based on data
- ✅ Metrics dashboard shows both engines

---

## Deliverables

1. **Updated XBIM Implementation** (working code in `src/ifcserver/Services/`)
2. **Test Results Document** (performance comparison data)
3. **Architecture Decision Record** (ADR for chosen approach)
4. **Updated Documentation** (XBIM_IMPLEMENTATION_STATUS.md)
5. **Performance Comparison Report** (from Phase 6)

---

## Next Steps

**Immediate**:
1. Start Phase 1 research
2. Document findings in this plan
3. Make go/no-go decision after Phase 3

**Once Fixed**:
1. Update frontend to enable XBIM option
2. Create PR with detailed comparison
3. Update user documentation

---

## Notes

- This plan is iterative - can pivot based on findings
- Each phase has clear success criteria and exit points
- Multiple fallback options available
- Focus on getting working solution, optimization can come later
