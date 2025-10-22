using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ifcserver.Data;
using ifcserver.Models;
using ifcserver.DTOs;
using ifcserver.Services;

namespace ifcserver.Controllers;

/// <summary>
/// API endpoints for managing IFC model revisions using XBIM Toolkit
/// Parallel implementation to RevisionsController with /api/xbim prefix
/// </summary>
[ApiController]
[Route("api/xbim/projects/{projectId}/revisions")]
public class XbimRevisionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<XbimRevisionsController> _logger;
    private readonly VersionIdentifierService _versionService;
    private readonly IFileStorageService _fileStorage;
    private readonly IXbimIfcService _xbimIfcService;
    private readonly IIfcElementService _elementService;
    private readonly IProcessingMetricsCollector _metricsCollector;
    private readonly IServiceProvider _serviceProvider;

    public XbimRevisionsController(
        AppDbContext context,
        ILogger<XbimRevisionsController> logger,
        VersionIdentifierService versionService,
        IFileStorageService fileStorage,
        IXbimIfcService xbimIfcService,
        IIfcElementService elementService,
        IProcessingMetricsCollector metricsCollector,
        IServiceProvider serviceProvider)
    {
        _context = context;
        _logger = logger;
        _versionService = versionService;
        _fileStorage = fileStorage;
        _xbimIfcService = xbimIfcService;
        _elementService = elementService;
        _metricsCollector = metricsCollector;
        _serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Get all XBIM-processed revisions for a project
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RevisionSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RevisionSummaryResponse>>> GetRevisions(int projectId)
    {
        _logger.LogInformation("[XBIM] Fetching revisions for project {ProjectId}", projectId);

        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
        {
            _logger.LogWarning("[XBIM] Project {ProjectId} not found", projectId);
            return NotFound(new { message = $"Project with ID {projectId} not found" });
        }

        var revisions = await _context.Revisions
            .Include(r => r.Elements)
            .Where(r => r.ProjectId == projectId && r.ProcessingEngine == "Xbim")
            .OrderByDescending(r => r.SequenceNumber)
            .Select(r => new RevisionSummaryResponse
            {
                Id = r.Id,
                VersionIdentifier = r.VersionIdentifier,
                SequenceNumber = r.SequenceNumber,
                Comment = r.Comment,
                UploadedAt = r.UploadedAt,
                IsActive = r.IsActive,
                IfcFileName = r.IfcFileName,
                ProcessingStatus = r.ProcessingStatus,
                ProcessingError = r.ProcessingError,
                ElementCount = r.Elements.Count
            })
            .ToListAsync();

        _logger.LogInformation("[XBIM] Found {Count} revisions for project {ProjectId}", revisions.Count, projectId);
        return Ok(revisions);
    }

    /// <summary>
    /// Get a specific XBIM-processed revision by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RevisionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RevisionDetailResponse>> GetRevision(int projectId, int id)
    {
        _logger.LogInformation("[XBIM] Fetching revision {RevisionId} for project {ProjectId}", id, projectId);

        var revision = await _context.Revisions
            .Include(r => r.Elements)
            .Include(r => r.SpatialTree)
            .Where(r => r.Id == id && r.ProjectId == projectId && r.ProcessingEngine == "Xbim")
            .Select(r => new RevisionDetailResponse
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                VersionIdentifier = r.VersionIdentifier,
                SequenceNumber = r.SequenceNumber,
                Comment = r.Comment,
                UploadedAt = r.UploadedAt,
                IsActive = r.IsActive,
                IfcFilePath = r.IfcFilePath,
                IfcFileName = r.IfcFileName,
                GltfFilePath = r.GltfFilePath,
                ProcessingStatus = r.ProcessingStatus,
                ProcessingError = r.ProcessingError,
                ElementCount = r.Elements.Count,
                HasSpatialTree = r.SpatialTree != null
            })
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            _logger.LogWarning("[XBIM] Revision {RevisionId} not found in project {ProjectId}", id, projectId);
            return NotFound(new { message = $"Revision with ID {id} not found in project {projectId}" });
        }

        return Ok(revision);
    }

    /// <summary>
    /// Get the spatial tree for an XBIM-processed revision
    /// </summary>
    [HttpGet("{id}/spatial-tree")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpatialTree(int projectId, int id)
    {
        _logger.LogInformation("[XBIM] Fetching spatial tree for revision {RevisionId}", id);

        var spatialTree = await _context.SpatialTrees
            .Where(st => st.RevisionId == id && st.Revision.ProjectId == projectId && st.Revision.ProcessingEngine == "Xbim")
            .Select(st => st.TreeJson)
            .FirstOrDefaultAsync();

        if (spatialTree == null)
        {
            return NotFound(new { message = "Spatial tree not found for this revision" });
        }

        return Content(spatialTree, "application/json");
    }

    /// <summary>
    /// Get all elements for an XBIM-processed revision
    /// </summary>
    [HttpGet("{id}/elements")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElements(int projectId, int id)
    {
        _logger.LogInformation("[XBIM] Fetching elements for revision {RevisionId}", id);

        var revision = await _context.Revisions
            .Where(r => r.Id == id && r.ProjectId == projectId && r.ProcessingEngine == "Xbim")
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            return NotFound(new { message = "Revision not found" });
        }

        var elements = await _elementService.GetModelElementsAsync(id);
        return Ok(elements);
    }

    /// <summary>
    /// Get properties for a specific element in an XBIM-processed revision
    /// </summary>
    [HttpGet("{id}/elements/{globalId}/properties")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElementProperties(int projectId, int id, string globalId)
    {
        _logger.LogInformation("[XBIM] Fetching properties for element {GlobalId} in revision {RevisionId}", globalId, id);

        var revision = await _context.Revisions
            .Where(r => r.Id == id && r.ProjectId == projectId && r.ProcessingEngine == "Xbim")
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            return NotFound(new { message = "Revision not found" });
        }

        var properties = await _elementService.GetElementPropertiesAsync(id, globalId);

        if (properties == null)
        {
            return NotFound(new { message = $"Element {globalId} not found in revision {id}" });
        }

        return Ok(properties);
    }

    /// <summary>
    /// Download the glTF file for an XBIM-processed revision
    /// </summary>
    [HttpGet("{id}/gltf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGltfFile(int projectId, int id)
    {
        _logger.LogInformation("[XBIM] Fetching glTF file for revision {RevisionId}", id);

        var revision = await _context.Revisions
            .Where(r => r.Id == id && r.ProjectId == projectId && r.ProcessingEngine == "Xbim")
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            return NotFound(new { message = $"Revision with ID {id} not found" });
        }

        if (string.IsNullOrEmpty(revision.GltfFilePath))
        {
            return NotFound(new { message = "glTF file not available for this revision. XBIM glTF export not yet implemented." });
        }

        var fullPath = _fileStorage.GetFullPath(revision.GltfFilePath);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { message = "glTF file not found on disk" });
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
        return File(fileBytes, "model/gltf-binary", $"{revision.VersionIdentifier}.glb");
    }

    /// <summary>
    /// Upload a new IFC file revision for XBIM processing
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(UploadRevisionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UploadRevisionResponse>> UploadRevision(
        int projectId,
        [FromForm] IFormFile file,
        [FromForm] string? comment = null)
    {
        _logger.LogInformation("[XBIM] Uploading new revision for project {ProjectId}", projectId);

        // Check if project exists
        var project = await _context.Projects.FindAsync(projectId);
        if (project == null)
        {
            return NotFound(new { message = $"Project with ID {projectId} not found" });
        }

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "IFC file is required" });
        }

        if (!file.FileName.EndsWith(".ifc", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "File must be an IFC file (.ifc extension)" });
        }

        // Generate version identifier with XBIM suffix
        var (baseVersionId, sequenceNumber) = await _versionService.GenerateVersionIdentifierAsync(projectId);
        var versionIdentifier = $"{baseVersionId}-xbim";

        _logger.LogInformation("[XBIM] Generated version identifier: {VersionIdentifier} (sequence: {SequenceNumber})",
            versionIdentifier, sequenceNumber);

        // Create storage path
        var storagePath = $"ifc-models/projects/{projectId}/revisions/{sequenceNumber}-xbim";
        var fileName = $"{versionIdentifier}.ifc";

        // Save IFC file to storage
        string savedIfcPath;
        try
        {
            savedIfcPath = await _fileStorage.SaveIfcFileAsync(file, storagePath, fileName);
            _logger.LogInformation("[XBIM] Saved IFC file to: {FilePath}", savedIfcPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[XBIM] Failed to save IFC file");
            return StatusCode(500, new { message = "Failed to save IFC file", error = ex.Message });
        }

        // Create revision record
        var revision = new Revision
        {
            ProjectId = projectId,
            VersionIdentifier = versionIdentifier,
            SequenceNumber = sequenceNumber,
            Comment = comment,
            UploadedAt = DateTime.UtcNow,
            IsActive = false, // XBIM revisions don't auto-activate
            IfcFilePath = savedIfcPath,
            IfcFileName = file.FileName,
            ProcessingStatus = "Pending",
            ProcessingEngine = "Xbim" // Mark as XBIM-processed
        };

        _context.Revisions.Add(revision);
        await _context.SaveChangesAsync();

        _logger.LogInformation("[XBIM] Created revision {RevisionId} ({VersionIdentifier}) for project {ProjectId}",
            revision.Id, versionIdentifier, projectId);

        // Start background processing with metrics
        var revisionId = revision.Id;
        var fileInfo = new FileInfo(savedIfcPath);
        _ = Task.Run(async () => await ProcessRevisionWithMetricsAsync(revisionId, savedIfcPath, fileInfo.Length));

        var response = new UploadRevisionResponse
        {
            Id = revision.Id,
            ProjectId = revision.ProjectId,
            VersionIdentifier = revision.VersionIdentifier,
            SequenceNumber = revision.SequenceNumber,
            Comment = revision.Comment,
            UploadedAt = revision.UploadedAt,
            IsActive = revision.IsActive,
            IfcFileName = revision.IfcFileName,
            ProcessingStatus = revision.ProcessingStatus,
            Message = "Revision uploaded successfully. Processing with XBIM started in background."
        };

        return CreatedAtAction(nameof(GetRevision),
            new { projectId, id = revision.Id },
            response);
    }

    /// <summary>
    /// Delete an XBIM-processed revision
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRevision(int projectId, int id)
    {
        _logger.LogInformation("[XBIM] Deleting revision {RevisionId} from project {ProjectId}", id, projectId);

        var revision = await _context.Revisions
            .FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId && r.ProcessingEngine == "Xbim");

        if (revision == null)
        {
            return NotFound(new { message = $"Revision with ID {id} not found" });
        }

        var versionId = revision.VersionIdentifier;

        // Delete revision (cascade delete will remove elements, spatial tree, and metrics)
        _context.Revisions.Remove(revision);
        await _context.SaveChangesAsync();

        _logger.LogInformation("[XBIM] Deleted revision {RevisionId} ({VersionIdentifier})", id, versionId);

        return Ok(new { message = $"Revision {versionId} deleted." });
    }

    /// <summary>
    /// Background processing method for uploaded revisions using XBIM with comprehensive metrics
    /// </summary>
    private async Task ProcessRevisionWithMetricsAsync(int revisionId, string ifcFilePath, long fileSizeBytes)
    {
        // Create a new scope for background work
        using var scope = _serviceProvider.CreateScope();
        var scopedDbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scopedXbimService = scope.ServiceProvider.GetRequiredService<IXbimIfcService>();
        var scopedFileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var scopedElementService = scope.ServiceProvider.GetRequiredService<IIfcElementService>();
        var scopedMetricsCollector = scope.ServiceProvider.GetRequiredService<IProcessingMetricsCollector>();
        var scopedProcessingLogger = scope.ServiceProvider.GetRequiredService<ILogger<ProcessingLogger>>();

        // Get processing logger
        var processingLogger = new ProcessingLogger(scopedMetricsCollector, scopedProcessingLogger);

        // Start metrics session
        var fileInfo = new FileInfo(ifcFilePath);
        var session = scopedMetricsCollector.StartSession(
            revisionId,
            "Xbim",
            fileInfo.Name,
            fileSizeBytes
        );

        try
        {
            await processingLogger.InfoAsync(revisionId, "Xbim", "Starting background processing");

            // Get the revision from database
            var revision = await scopedDbContext.Revisions.FindAsync(revisionId);
            if (revision == null)
            {
                await processingLogger.ErrorAsync(revisionId, "Xbim", "Revision not found in database");
                return;
            }

            // Update status to processing
            revision.ProcessingStatus = "Processing";
            await scopedDbContext.SaveChangesAsync();
            await processingLogger.InfoAsync(revisionId, "Xbim", "Status updated to Processing");

            // Get full IFC path
            var fullIfcPath = scopedFileStorage.GetFullPath(ifcFilePath);
            await processingLogger.LogFileSizeAsync(revisionId, "Xbim", "IFC", fileSizeBytes);

            // Step 1: Convert IFC to glTF (currently returns not implemented)
            await processingLogger.InfoAsync(revisionId, "Xbim", "Attempting glTF conversion");
            try
            {
                session.GltfExportTimer.Start();
                var (gltfResult, gltfMetrics) = await scopedXbimService.ExportGltfWithMetricsAsync(
                    fullIfcPath,
                    Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.glb")
                );
                session.GltfExportTimer.Stop();

                if (gltfResult.Success)
                {
                    await processingLogger.InfoAsync(revisionId, "Xbim", "glTF conversion successful");
                    session.GltfFileSizeBytes = gltfResult.FileSize;
                }
                else
                {
                    await processingLogger.WarningAsync(revisionId, "Xbim", $"glTF conversion not available: {gltfResult.ErrorMessage}");
                }
            }
            catch (Exception gltfEx)
            {
                await processingLogger.ErrorAsync(revisionId, "Xbim", "glTF conversion error", gltfEx);
            }

            // Step 2: Extract and store all element properties with metrics
            await processingLogger.InfoAsync(revisionId, "Xbim", "Starting element extraction");
            try
            {
                var (elements, elementMetrics) = await scopedXbimService.ExtractAllElementsWithMetricsAsync(
                    fullIfcPath,
                    session
                );

                // Set RevisionId for all elements
                foreach (var element in elements)
                {
                    element.RevisionId = revisionId;
                }

                await scopedElementService.StoreElementsAsync(revisionId, elements);

                await processingLogger.LogElementStatsAsync(
                    revisionId,
                    "Xbim",
                    elements.Count,
                    elementMetrics.Statistics.ElementTypeCounts
                );

                await processingLogger.LogPropertyStatsAsync(
                    revisionId,
                    "Xbim",
                    session.TotalPropertySets,
                    session.TotalProperties,
                    session.TotalQuantities
                );
            }
            catch (Exception elemEx)
            {
                await processingLogger.ErrorAsync(revisionId, "Xbim", "Element extraction failed", elemEx);
                // Continue processing - try spatial tree
            }

            // Step 3: Extract and store spatial tree with metrics
            await processingLogger.InfoAsync(revisionId, "Xbim", "Starting spatial tree extraction");
            try
            {
                var (spatialTree, treeMetrics) = await scopedXbimService.ExtractSpatialTreeWithMetricsAsync(fullIfcPath);

                if (spatialTree != null)
                {
                    var spatialTreeJson = System.Text.Json.JsonSerializer.Serialize(spatialTree);

                    var spatialTreeRecord = new SpatialTree
                    {
                        RevisionId = revisionId,
                        TreeJson = spatialTreeJson,
                        CreatedAt = DateTime.UtcNow
                    };

                    scopedDbContext.SpatialTrees.Add(spatialTreeRecord);
                    await scopedDbContext.SaveChangesAsync();

                    // Update session with tree stats
                    session.SpatialTreeDepth = treeMetrics.Statistics.TreeDepth;
                    session.SpatialTreeNodeCount = treeMetrics.Statistics.NodeCount;

                    await processingLogger.InfoAsync(
                        revisionId,
                        "Xbim",
                        $"Spatial tree created: depth={session.SpatialTreeDepth}, nodes={session.SpatialTreeNodeCount}"
                    );
                }
            }
            catch (Exception spatialEx)
            {
                await processingLogger.ErrorAsync(revisionId, "Xbim", "Spatial tree extraction failed", spatialEx);
            }

            // Update status to completed
            revision.ProcessingStatus = "Completed";
            revision.ProcessingError = null;
            await scopedDbContext.SaveChangesAsync();

            // Record success metrics
            await scopedMetricsCollector.RecordSuccessAsync(session);
            await processingLogger.InfoAsync(
                revisionId,
                "Xbim",
                $"Processing completed successfully in {session.TotalTimer.ElapsedMilliseconds}ms"
            );
        }
        catch (Exception ex)
        {
            await processingLogger.CriticalAsync(revisionId, "Xbim", "Fatal error during processing", ex);

            // Record failure metrics
            await scopedMetricsCollector.RecordFailureAsync(session, ex);

            // Update revision status to failed
            try
            {
                var revision = await scopedDbContext.Revisions.FindAsync(revisionId);
                if (revision != null)
                {
                    revision.ProcessingStatus = "Failed";
                    revision.ProcessingError = ex.Message;
                    await scopedDbContext.SaveChangesAsync();
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "[XBIM] Failed to update error status for revision {RevisionId}", revisionId);
            }
        }
    }
}
