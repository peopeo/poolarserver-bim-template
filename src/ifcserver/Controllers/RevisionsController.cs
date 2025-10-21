using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ifcserver.Data;
using ifcserver.Models;
using ifcserver.DTOs;
using ifcserver.Services;

namespace ifcserver.Controllers;

/// <summary>
/// API endpoints for managing IFC model revisions
/// </summary>
[ApiController]
[Route("api/projects/{projectId}/[controller]")]
public class RevisionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<RevisionsController> _logger;
    private readonly VersionIdentifierService _versionService;
    private readonly IFileStorageService _fileStorage;
    private readonly IPythonIfcService _pythonIfcService;
    private readonly IIfcElementService _elementService;
    private readonly IServiceProvider _serviceProvider;

    public RevisionsController(
        AppDbContext context,
        ILogger<RevisionsController> logger,
        VersionIdentifierService versionService,
        IFileStorageService fileStorage,
        IPythonIfcService pythonIfcService,
        IIfcElementService elementService,
        IServiceProvider serviceProvider)
    {
        _context = context;
        _logger = logger;
        _versionService = versionService;
        _fileStorage = fileStorage;
        _pythonIfcService = pythonIfcService;
        _elementService = elementService;
        _serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Get all revisions for a project
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <returns>List of revisions</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<RevisionSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RevisionSummaryResponse>>> GetRevisions(int projectId)
    {
        _logger.LogInformation("Fetching revisions for project {ProjectId}", projectId);

        // Check if project exists
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
        {
            _logger.LogWarning("Project {ProjectId} not found", projectId);
            return NotFound(new { message = $"Project with ID {projectId} not found" });
        }

        var revisions = await _context.Revisions
            .Include(r => r.Elements)
            .Where(r => r.ProjectId == projectId)
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

        _logger.LogInformation("Found {Count} revisions for project {ProjectId}", revisions.Count, projectId);
        return Ok(revisions);
    }

    /// <summary>
    /// Get a specific revision by ID
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <returns>Revision details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RevisionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RevisionDetailResponse>> GetRevision(int projectId, int id)
    {
        _logger.LogInformation("Fetching revision {RevisionId} for project {ProjectId}", id, projectId);

        var revision = await _context.Revisions
            .Include(r => r.Elements)
            .Include(r => r.SpatialTree)
            .Where(r => r.Id == id && r.ProjectId == projectId)
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
            _logger.LogWarning("Revision {RevisionId} not found in project {ProjectId}", id, projectId);
            return NotFound(new { message = $"Revision with ID {id} not found in project {projectId}" });
        }

        return Ok(revision);
    }

    /// <summary>
    /// Get the spatial tree for a revision
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <returns>Spatial tree JSON</returns>
    [HttpGet("{id}/spatial-tree")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpatialTree(int projectId, int id)
    {
        _logger.LogInformation("Fetching spatial tree for revision {RevisionId} in project {ProjectId}", id, projectId);

        var spatialTree = await _context.SpatialTrees
            .Where(st => st.RevisionId == id && st.Revision.ProjectId == projectId)
            .Select(st => st.TreeJson)
            .FirstOrDefaultAsync();

        if (spatialTree == null)
        {
            _logger.LogWarning("Spatial tree not found for revision {RevisionId}", id);
            return NotFound(new { message = "Spatial tree not available for this revision" });
        }

        // Return the JSON directly
        return Ok(spatialTree);
    }

    /// <summary>
    /// Get all elements for a revision (for 3D viewer metadata)
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <returns>List of element summaries</returns>
    [HttpGet("{id}/elements")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElements(int projectId, int id)
    {
        _logger.LogInformation("Fetching elements for revision {RevisionId} in project {ProjectId}", id, projectId);

        // Verify revision exists and belongs to project
        var revision = await _context.Revisions
            .Where(r => r.Id == id && r.ProjectId == projectId)
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            return NotFound(new { message = "Revision not found" });
        }

        // Fetch elements with minimal data (for viewer metadata)
        var elements = await _context.IfcElements
            .Where(e => e.RevisionId == id)
            .Select(e => new
            {
                id = e.GlobalId,
                type = e.ElementType,
                name = e.Name,
                ifcGuid = e.GlobalId
            })
            .ToListAsync();

        _logger.LogInformation("Returning {Count} elements for revision {RevisionId}", elements.Count, id);

        return Ok(elements);
    }

    /// <summary>
    /// Get properties for a specific element in a revision
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <param name="globalId">Element Global ID</param>
    /// <returns>Element properties</returns>
    [HttpGet("{id}/elements/{globalId}/properties")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElementProperties(int projectId, int id, string globalId)
    {
        _logger.LogInformation("Fetching properties for element {GlobalId} in revision {RevisionId}", globalId, id);

        // Verify revision exists and belongs to project
        var revision = await _context.Revisions
            .Where(r => r.Id == id && r.ProjectId == projectId)
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            return NotFound(new { message = "Revision not found" });
        }

        // Get element properties from service
        var properties = await _elementService.GetElementPropertiesAsync(id, globalId);

        if (properties == null)
        {
            return NotFound(new { message = $"Element {globalId} not found in revision {id}" });
        }

        return Ok(properties);
    }

    /// <summary>
    /// Download the glTF file for a revision
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <returns>glTF file</returns>
    [HttpGet("{id}/gltf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGltfFile(int projectId, int id)
    {
        _logger.LogInformation("Fetching glTF file for revision {RevisionId} in project {ProjectId}", id, projectId);

        var revision = await _context.Revisions
            .Where(r => r.Id == id && r.ProjectId == projectId)
            .FirstOrDefaultAsync();

        if (revision == null)
        {
            _logger.LogWarning("Revision {RevisionId} not found in project {ProjectId}", id, projectId);
            return NotFound(new { message = $"Revision with ID {id} not found in project {projectId}" });
        }

        if (string.IsNullOrEmpty(revision.GltfFilePath))
        {
            _logger.LogWarning("Revision {RevisionId} does not have a glTF file", id);
            return NotFound(new { message = "glTF file not available for this revision. Processing may not be complete." });
        }

        // Get full path to glTF file
        var fullPath = _fileStorage.GetFullPath(revision.GltfFilePath);

        if (!System.IO.File.Exists(fullPath))
        {
            _logger.LogError("glTF file not found at path: {FilePath}", fullPath);
            return NotFound(new { message = "glTF file not found on disk" });
        }

        _logger.LogInformation("Serving glTF file: {FilePath}", fullPath);

        // Return file with proper content type
        var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
        return File(fileBytes, "model/gltf-binary", $"{revision.VersionIdentifier}.glb");
    }

    /// <summary>
    /// Upload a new IFC file revision
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="file">IFC file to upload</param>
    /// <param name="comment">Optional comment for this revision</param>
    /// <returns>Created revision details</returns>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(UploadRevisionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UploadRevisionResponse>> UploadRevision(
        int projectId,
        [FromForm] IFormFile file,
        [FromForm] string? comment = null)
    {
        _logger.LogInformation("Uploading new revision for project {ProjectId}", projectId);

        // Check if project exists
        var project = await _context.Projects.FindAsync(projectId);
        if (project == null)
        {
            _logger.LogWarning("Project {ProjectId} not found", projectId);
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

        // Generate version identifier
        var (versionIdentifier, sequenceNumber) = await _versionService.GenerateVersionIdentifierAsync(projectId);

        _logger.LogInformation("Generated version identifier: {VersionIdentifier} (sequence: {SequenceNumber})",
            versionIdentifier, sequenceNumber);

        // Create storage path
        var storagePath = $"ifc-models/projects/{projectId}/revisions/{sequenceNumber}";
        var fileName = $"{versionIdentifier}.ifc";

        // Save IFC file to storage
        string savedIfcPath;
        try
        {
            savedIfcPath = await _fileStorage.SaveIfcFileAsync(file, storagePath, fileName);
            _logger.LogInformation("Saved IFC file to: {FilePath}", savedIfcPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save IFC file for revision");
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
            IsActive = true, // New revisions are automatically set as active
            IfcFilePath = savedIfcPath,
            IfcFileName = file.FileName,
            ProcessingStatus = "Pending"
        };

        _context.Revisions.Add(revision);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created revision {RevisionId} ({VersionIdentifier}) for project {ProjectId}",
            revision.Id, versionIdentifier, projectId);

        // Start background processing
        var revisionId = revision.Id;
        _ = Task.Run(async () => await ProcessRevisionAsync(revisionId, savedIfcPath));

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
            Message = "Revision uploaded successfully. Processing started in background."
        };

        return CreatedAtAction(nameof(GetRevision),
            new { projectId, id = revision.Id },
            response);
    }

    /// <summary>
    /// Update a revision's comment
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <param name="request">Updated comment</param>
    /// <returns>Updated revision</returns>
    [HttpPut("{id}/comment")]
    [ProducesResponseType(typeof(RevisionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RevisionDetailResponse>> UpdateComment(
        int projectId,
        int id,
        [FromBody] UpdateRevisionCommentRequest request)
    {
        _logger.LogInformation("Updating comment for revision {RevisionId}", id);

        var revision = await _context.Revisions
            .Include(r => r.Elements)
            .Include(r => r.SpatialTree)
            .FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId);

        if (revision == null)
        {
            _logger.LogWarning("Revision {RevisionId} not found", id);
            return NotFound(new { message = $"Revision with ID {id} not found" });
        }

        revision.Comment = request.Comment;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated comment for revision {RevisionId}", id);

        var response = new RevisionDetailResponse
        {
            Id = revision.Id,
            ProjectId = revision.ProjectId,
            VersionIdentifier = revision.VersionIdentifier,
            SequenceNumber = revision.SequenceNumber,
            Comment = revision.Comment,
            UploadedAt = revision.UploadedAt,
            IsActive = revision.IsActive,
            IfcFilePath = revision.IfcFilePath,
            IfcFileName = revision.IfcFileName,
            GltfFilePath = revision.GltfFilePath,
            ProcessingStatus = revision.ProcessingStatus,
            ProcessingError = revision.ProcessingError,
            ElementCount = revision.Elements.Count,
            HasSpatialTree = revision.SpatialTree != null
        };

        return Ok(response);
    }

    /// <summary>
    /// Set a revision as the active revision for the project
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID to set as active</param>
    /// <returns>Updated revision</returns>
    [HttpPut("{id}/set-active")]
    [ProducesResponseType(typeof(RevisionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RevisionDetailResponse>> SetActive(int projectId, int id)
    {
        _logger.LogInformation("Setting revision {RevisionId} as active for project {ProjectId}", id, projectId);

        var revision = await _context.Revisions
            .Include(r => r.Elements)
            .Include(r => r.SpatialTree)
            .FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId);

        if (revision == null)
        {
            _logger.LogWarning("Revision {RevisionId} not found", id);
            return NotFound(new { message = $"Revision with ID {id} not found" });
        }

        // Set as active (database trigger will deactivate others)
        revision.IsActive = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Set revision {RevisionId} as active", id);

        var response = new RevisionDetailResponse
        {
            Id = revision.Id,
            ProjectId = revision.ProjectId,
            VersionIdentifier = revision.VersionIdentifier,
            SequenceNumber = revision.SequenceNumber,
            Comment = revision.Comment,
            UploadedAt = revision.UploadedAt,
            IsActive = revision.IsActive,
            IfcFilePath = revision.IfcFilePath,
            IfcFileName = revision.IfcFileName,
            GltfFilePath = revision.GltfFilePath,
            ProcessingStatus = revision.ProcessingStatus,
            ProcessingError = revision.ProcessingError,
            ElementCount = revision.Elements.Count,
            HasSpatialTree = revision.SpatialTree != null
        };

        return Ok(response);
    }

    /// <summary>
    /// Delete a revision
    /// If the deleted revision was active, the latest remaining revision will be promoted to active
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="id">Revision ID</param>
    /// <returns>No content or information about auto-promoted revision</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRevision(int projectId, int id)
    {
        _logger.LogInformation("Deleting revision {RevisionId} from project {ProjectId}", id, projectId);

        var revision = await _context.Revisions
            .FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId);

        if (revision == null)
        {
            _logger.LogWarning("Revision {RevisionId} not found", id);
            return NotFound(new { message = $"Revision with ID {id} not found" });
        }

        var wasActive = revision.IsActive;
        var versionId = revision.VersionIdentifier;

        // Delete revision (cascade delete will remove elements and spatial tree)
        _context.Revisions.Remove(revision);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted revision {RevisionId} ({VersionIdentifier})", id, versionId);

        // If the deleted revision was active, promote the latest remaining revision
        if (wasActive)
        {
            var latestRevision = await _context.Revisions
                .Where(r => r.ProjectId == projectId)
                .OrderByDescending(r => r.SequenceNumber)
                .FirstOrDefaultAsync();

            if (latestRevision != null)
            {
                latestRevision.IsActive = true;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Auto-promoted revision {RevisionId} ({VersionIdentifier}) to active",
                    latestRevision.Id, latestRevision.VersionIdentifier);

                return Ok(new
                {
                    message = $"Revision {versionId} deleted. Revision {latestRevision.VersionIdentifier} promoted to active.",
                    promotedRevisionId = latestRevision.Id,
                    promotedVersionIdentifier = latestRevision.VersionIdentifier
                });
            }
            else
            {
                _logger.LogInformation("No remaining revisions to promote for project {ProjectId}", projectId);
                return Ok(new { message = $"Revision {versionId} deleted. No remaining revisions." });
            }
        }

        return Ok(new { message = $"Revision {versionId} deleted." });
    }

    /// <summary>
    /// Background processing method for uploaded revisions
    /// Converts IFC to glTF, extracts elements, and builds spatial tree
    /// </summary>
    /// <param name="revisionId">Revision ID to process</param>
    /// <param name="ifcFilePath">Path to the IFC file</param>
    private async Task ProcessRevisionAsync(int revisionId, string ifcFilePath)
    {
        // Create a new scope for background work
        using var scope = _serviceProvider.CreateScope();
        var scopedDbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scopedPythonService = scope.ServiceProvider.GetRequiredService<IPythonIfcService>();
        var scopedFileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var scopedElementService = scope.ServiceProvider.GetRequiredService<IIfcElementService>();
        var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<RevisionsController>>();

        try
        {
            scopedLogger.LogInformation("Starting background processing for revision {RevisionId}", revisionId);

            // Get the revision from database
            var revision = await scopedDbContext.Revisions.FindAsync(revisionId);
            if (revision == null)
            {
                scopedLogger.LogError("Revision {RevisionId} not found in database for processing", revisionId);
                return;
            }

            // Update status to processing
            revision.ProcessingStatus = "Processing";
            await scopedDbContext.SaveChangesAsync();
            scopedLogger.LogInformation("Updated revision {RevisionId} status to Processing", revisionId);

            // Get full IFC path
            var fullIfcPath = scopedFileStorage.GetFullPath(ifcFilePath);
            scopedLogger.LogInformation("Processing IFC file: {IfcFilePath}", fullIfcPath);

            // Step 1: Convert IFC to glTF
            scopedLogger.LogInformation("Converting IFC to glTF for revision {RevisionId}", revisionId);
            try
            {
                // Create temp directory for glTF output
                var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
                Directory.CreateDirectory(tempDir);
                var tempGltfPath = Path.Combine(tempDir, $"{Guid.NewGuid()}.glb");

                // Export to glTF
                var gltfOptions = new GltfExportOptions { Format = "glb", UseNames = false, Center = false };
                var gltfResult = await scopedPythonService.ExportGltfAsync(fullIfcPath, tempGltfPath, gltfOptions);

                if (gltfResult.Success)
                {
                    // Save glTF file to storage
                    var gltfStoragePath = $"ifc-models/projects/{revision.ProjectId}/revisions/{revision.SequenceNumber}";
                    var gltfFileName = $"{revision.VersionIdentifier}.glb";
                    var savedGltfPath = await scopedFileStorage.SaveGltfFileAsync(tempGltfPath, gltfStoragePath, gltfFileName);

                    // Update revision record
                    revision.GltfFilePath = savedGltfPath;
                    await scopedDbContext.SaveChangesAsync();

                    scopedLogger.LogInformation("Successfully converted IFC to glTF for revision {RevisionId}: {GltfPath}",
                        revisionId, savedGltfPath);

                    // Cleanup temp file
                    if (System.IO.File.Exists(tempGltfPath))
                    {
                        System.IO.File.Delete(tempGltfPath);
                    }
                }
                else
                {
                    scopedLogger.LogWarning("glTF conversion failed for revision {RevisionId}: {Error}",
                        revisionId, gltfResult.ErrorMessage);
                    // Continue processing - glTF is optional
                }
            }
            catch (Exception gltfEx)
            {
                scopedLogger.LogError(gltfEx, "Error during glTF conversion for revision {RevisionId}", revisionId);
                // Continue processing - glTF is optional
            }

            // Step 2: Extract and store all element properties
            scopedLogger.LogInformation("Extracting element properties for revision {RevisionId}", revisionId);
            try
            {
                var elements = await scopedPythonService.ExtractAllElementsAsync(fullIfcPath);

                // Set RevisionId for all elements
                foreach (var element in elements)
                {
                    element.RevisionId = revisionId;
                }

                await scopedElementService.StoreElementsAsync(revisionId, elements);

                scopedLogger.LogInformation("Successfully stored {ElementCount} elements for revision {RevisionId}",
                    elements.Count, revisionId);
            }
            catch (Exception elemEx)
            {
                scopedLogger.LogError(elemEx, "Failed to extract elements for revision {RevisionId}", revisionId);
                // Continue processing - try to at least save the spatial tree
            }

            // Step 3: Extract and store spatial tree
            scopedLogger.LogInformation("Extracting spatial tree for revision {RevisionId}", revisionId);
            try
            {
                var spatialTree = await scopedPythonService.ExtractSpatialTreeAsync(fullIfcPath, flat: false);

                if (spatialTree != null)
                {
                    var spatialTreeJson = System.Text.Json.JsonSerializer.Serialize(spatialTree);

                    // Create spatial tree record
                    var spatialTreeRecord = new SpatialTree
                    {
                        RevisionId = revisionId,
                        TreeJson = spatialTreeJson,
                        CreatedAt = DateTime.UtcNow
                    };

                    scopedDbContext.SpatialTrees.Add(spatialTreeRecord);
                    await scopedDbContext.SaveChangesAsync();

                    scopedLogger.LogInformation("Successfully stored spatial tree for revision {RevisionId}", revisionId);
                }
                else
                {
                    scopedLogger.LogWarning("Spatial tree extraction returned null for revision {RevisionId}", revisionId);
                }
            }
            catch (Exception spatialEx)
            {
                scopedLogger.LogError(spatialEx, "Failed to extract spatial tree for revision {RevisionId}", revisionId);
                // Continue to mark as completed even if spatial tree fails
            }

            // Update status to completed
            revision.ProcessingStatus = "Completed";
            revision.ProcessingError = null;
            await scopedDbContext.SaveChangesAsync();

            scopedLogger.LogInformation("Successfully completed processing for revision {RevisionId} ({VersionIdentifier})",
                revisionId, revision.VersionIdentifier);
        }
        catch (Exception ex)
        {
            scopedLogger.LogError(ex, "Error during background processing for revision {RevisionId}", revisionId);

            // Try to update revision status to failed
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
                scopedLogger.LogError(dbEx, "Failed to update error status for revision {RevisionId}", revisionId);
            }
        }
    }
}
