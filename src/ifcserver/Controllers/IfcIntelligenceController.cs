using Microsoft.AspNetCore.Mvc;
using ifcserver.Services;
using ifcserver.Models;
using ifcserver.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ifcserver.Controllers;

/// <summary>
/// API controller for Python IFC Intelligence operations.
/// Provides endpoints for IFC parsing, property extraction, spatial trees, and glTF export.
/// </summary>
[ApiController]
[Route("api/ifc-intelligence")]
public class IfcIntelligenceController : ControllerBase
{
    private readonly IPythonIfcService _pythonIfcService;
    private readonly ILogger<IfcIntelligenceController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly AppDbContext _dbContext;
    private readonly IFileStorageService _fileStorage;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IIfcElementService _elementService;

    public IfcIntelligenceController(
        IPythonIfcService pythonIfcService,
        ILogger<IfcIntelligenceController> logger,
        IWebHostEnvironment environment,
        AppDbContext dbContext,
        IFileStorageService fileStorage,
        IServiceScopeFactory serviceScopeFactory,
        IIfcElementService elementService)
    {
        _pythonIfcService = pythonIfcService;
        _logger = logger;
        _environment = environment;
        _dbContext = dbContext;
        _fileStorage = fileStorage;
        _serviceScopeFactory = serviceScopeFactory;
        _elementService = elementService;
    }

    /// <summary>
    /// Parse an IFC file and extract metadata.
    /// </summary>
    /// <param name="file">IFC file to parse (multipart/form-data upload)</param>
    /// <returns>IfcMetadata JSON object</returns>
    /// <response code="200">Successfully parsed IFC file</response>
    /// <response code="400">Invalid file or bad request</response>
    /// <response code="500">Server error during parsing</response>
    [HttpPost("parse")]
    [ProducesResponseType(typeof(IfcMetadata), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ParseIfc(IFormFile file)
    {
        _logger.LogInformation("ParseIfc endpoint called");

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".ifc")
        {
            return BadRequest(new { error = "Only .ifc files are supported" });
        }

        _logger.LogInformation($"Received file: {file.FileName} ({file.Length} bytes)");

        try
        {
            // Create temp directory for uploaded file
            var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
            Directory.CreateDirectory(tempDir);

            // Save uploaded file to temp location
            var tempFilePath = Path.Combine(tempDir, $"{Guid.NewGuid()}.ifc");

            using (var stream = new FileStream(tempFilePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Saved temp file: {tempFilePath}");

            try
            {
                // Call Python service to parse IFC file
                var metadata = await _pythonIfcService.ParseIfcFileAsync(tempFilePath);

                _logger.LogInformation($"Successfully parsed IFC. Project: {metadata.ProjectName}");

                return Ok(metadata);
            }
            finally
            {
                // Cleanup temp file
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                    _logger.LogDebug($"Deleted temp file: {tempFilePath}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing IFC file");
            return StatusCode(500, new { error = $"Failed to parse IFC file: {ex.Message}" });
        }
    }

    /// <summary>
    /// Upload an IFC file, persist to storage, extract metadata and spatial tree, and convert to glTF.
    /// This is the main endpoint for uploading IFC models to be stored and viewed later.
    /// </summary>
    /// <param name="file">IFC file to upload (multipart/form-data upload)</param>
    /// <param name="description">Optional description for the model</param>
    /// <param name="tags">Optional comma-separated tags</param>
    /// <returns>Stored model information with ID and metadata</returns>
    /// <response code="200">Successfully uploaded and processed IFC file</response>
    /// <response code="400">Invalid file or bad request</response>
    /// <response code="500">Server error during upload</response>
    [HttpPost("upload")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UploadIfc(
        IFormFile file,
        [FromForm] string? description = null,
        [FromForm] string? tags = null)
    {
        _logger.LogInformation("UploadIfc endpoint called");

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".ifc")
        {
            return BadRequest(new { error = "Only .ifc files are supported" });
        }

        _logger.LogInformation($"Uploading file: {file.FileName} ({file.Length} bytes)");

        try
        {
            // Calculate file hash for deduplication
            using var fileStream = file.OpenReadStream();
            var fileHash = await _fileStorage.CalculateFileHashAsync(fileStream);

            // Check if file already exists in database
            var existingModel = await _dbContext.IfcModels
                .FirstOrDefaultAsync(m => m.FileHash == fileHash);

            if (existingModel != null)
            {
                _logger.LogInformation($"File already exists in database with ID: {existingModel.Id}");
                return Ok(new
                {
                    id = existingModel.Id,
                    fileName = existingModel.FileName,
                    projectName = existingModel.ProjectName,
                    schema = existingModel.Schema,
                    uploadedAt = existingModel.UploadedAt,
                    conversionStatus = existingModel.ConversionStatus,
                    message = "File already exists in database"
                });
            }

            // Save IFC file to storage
            fileStream.Position = 0; // Reset stream
            var ifcFilePath = await _fileStorage.SaveIfcFileAsync(fileStream, file.FileName);

            _logger.LogInformation($"Saved IFC file to: {ifcFilePath}");

            // Get full path for parsing
            var fullIfcPath = _fileStorage.GetFullPath(ifcFilePath);

            // Parse IFC file to extract metadata
            var metadata = await _pythonIfcService.ParseIfcFileAsync(fullIfcPath);

            // Extract spatial tree
            var spatialTree = await _pythonIfcService.ExtractSpatialTreeAsync(fullIfcPath, flat: false);

            // Create database record
            var ifcModel = new IfcModel
            {
                FileName = file.FileName,
                FileHash = fileHash,
                ProjectName = metadata.ProjectName,
                Schema = metadata.Schema,
                ModelId = metadata.ModelId,
                EntityCountsJson = JsonSerializer.Serialize(metadata.EntityCounts),
                Author = metadata.Author,
                Organization = metadata.Organization,
                Application = metadata.Application,
                FileSizeBytes = file.Length,
                IfcFilePath = ifcFilePath,
                SpatialTreeJson = JsonSerializer.Serialize(spatialTree),
                ConversionStatus = "pending",
                Description = description,
                Tags = tags,
                UploadedAt = DateTime.UtcNow
            };

            _dbContext.IfcModels.Add(ifcModel);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation($"Created database record with ID: {ifcModel.Id}");

            // Trigger glTF conversion asynchronously with new scope
            var modelId = ifcModel.Id;
            var originalFileName = file.FileName;
            _ = Task.Run(async () =>
            {
                // Create a new scope for background work
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedDbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var scopedPythonService = scope.ServiceProvider.GetRequiredService<IPythonIfcService>();
                var scopedFileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<IfcIntelligenceController>>();

                try
                {
                    scopedLogger.LogInformation($"Starting glTF conversion for model ID: {modelId}");

                    // Get the model from database
                    var model = await scopedDbContext.IfcModels.FindAsync(modelId);
                    if (model == null)
                    {
                        scopedLogger.LogError($"Model {modelId} not found in database for conversion");
                        return;
                    }

                    // Update status to processing
                    model.ConversionStatus = "processing";
                    await scopedDbContext.SaveChangesAsync();

                    // Create temp directory for glTF output
                    var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
                    Directory.CreateDirectory(tempDir);
                    var tempGltfPath = Path.Combine(tempDir, $"{Guid.NewGuid()}.glb");

                    // Get full IFC path
                    var fullIfcFilePath = scopedFileStorage.GetFullPath(model.IfcFilePath);

                    // Export to glTF
                    var options = new GltfExportOptions { Format = "glb", UseNames = false, Center = false };
                    var result = await scopedPythonService.ExportGltfAsync(fullIfcFilePath, tempGltfPath, options);

                    if (result.Success)
                    {
                        // Save glTF file to storage
                        var gltfFilePath = await scopedFileStorage.SaveGltfFileAsync(tempGltfPath, originalFileName);

                        // Update database record
                        model.GltfFilePath = gltfFilePath;
                        model.GltfFileSizeBytes = scopedFileStorage.GetFileSize(gltfFilePath);
                        model.ConversionStatus = "completed";
                        model.ConvertedAt = DateTime.UtcNow;

                        scopedLogger.LogInformation($"glTF conversion completed for model ID: {modelId}");
                    }
                    else
                    {
                        model.ConversionStatus = "failed";
                        model.ConversionError = result.ErrorMessage;
                        scopedLogger.LogError($"glTF conversion failed for model ID: {modelId}. Error: {result.ErrorMessage}");
                    }

                    await scopedDbContext.SaveChangesAsync();

                    // Cleanup temp file
                    if (System.IO.File.Exists(tempGltfPath))
                    {
                        System.IO.File.Delete(tempGltfPath);
                    }

                    // Extract and store all element properties for fast database queries
                    scopedLogger.LogInformation($"Extracting element properties for model ID: {modelId}");
                    try
                    {
                        var elements = await scopedPythonService.ExtractAllElementsAsync(fullIfcFilePath);

                        // Set ModelId for all elements
                        foreach (var element in elements)
                        {
                            element.ModelId = modelId;
                        }

                        // Get element service from scope
                        var scopedElementService = scope.ServiceProvider.GetRequiredService<IIfcElementService>();
                        await scopedElementService.StoreElementsAsync(modelId, elements);

                        scopedLogger.LogInformation($"Stored {elements.Count} element properties for model ID: {modelId}");
                    }
                    catch (Exception elemEx)
                    {
                        // Log error but don't fail the whole process - glTF conversion succeeded
                        scopedLogger.LogError(elemEx, $"Failed to extract element properties for model ID: {modelId}");
                    }
                }
                catch (Exception ex)
                {
                    scopedLogger.LogError(ex, $"Error during glTF conversion for model ID: {modelId}");

                    // Try to update model status
                    try
                    {
                        var model = await scopedDbContext.IfcModels.FindAsync(modelId);
                        if (model != null)
                        {
                            model.ConversionStatus = "failed";
                            model.ConversionError = ex.Message;
                            await scopedDbContext.SaveChangesAsync();
                        }
                    }
                    catch (Exception dbEx)
                    {
                        scopedLogger.LogError(dbEx, $"Failed to update error status for model ID: {modelId}");
                    }
                }
            });

            // Return success response
            return Ok(new
            {
                id = ifcModel.Id,
                fileName = ifcModel.FileName,
                projectName = ifcModel.ProjectName,
                schema = ifcModel.Schema,
                modelId = ifcModel.ModelId,
                entityCounts = metadata.EntityCounts,
                author = ifcModel.Author,
                organization = ifcModel.Organization,
                application = ifcModel.Application,
                fileSizeBytes = ifcModel.FileSizeBytes,
                uploadedAt = ifcModel.UploadedAt,
                conversionStatus = ifcModel.ConversionStatus,
                message = "IFC file uploaded successfully. glTF conversion in progress."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading IFC file");
            return StatusCode(500, new { error = $"Failed to upload IFC file: {ex.Message}" });
        }
    }

    /// <summary>
    /// Export an IFC file to glTF/GLB format.
    /// </summary>
    /// <param name="file">IFC file to export (multipart/form-data upload)</param>
    /// <param name="format">Output format (glb or gltf)</param>
    /// <param name="useNames">Use element names instead of GUIDs</param>
    /// <param name="center">Center the model at origin</param>
    /// <returns>glTF/GLB file download</returns>
    /// <response code="200">Successfully exported glTF file</response>
    /// <response code="400">Invalid file or bad request</response>
    /// <response code="500">Server error during export</response>
    [HttpPost("export-gltf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ExportGltf(
        IFormFile file,
        [FromForm] string format = "glb",
        [FromForm] bool useNames = false,
        [FromForm] bool center = false)
    {
        _logger.LogInformation("ExportGltf endpoint called");

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".ifc")
        {
            return BadRequest(new { error = "Only .ifc files are supported" });
        }

        // Validate format
        if (format != "glb" && format != "gltf")
        {
            return BadRequest(new { error = "Format must be 'glb' or 'gltf'" });
        }

        _logger.LogInformation($"Received file: {file.FileName} ({file.Length} bytes), format: {format}");

        try
        {
            // Create temp directory for files
            var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
            Directory.CreateDirectory(tempDir);

            // Save uploaded IFC file to temp location
            var tempIfcPath = Path.Combine(tempDir, $"{Guid.NewGuid()}.ifc");
            var tempOutputPath = Path.Combine(tempDir, $"{Guid.NewGuid()}.{format}");

            using (var stream = new FileStream(tempIfcPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Saved temp IFC file: {tempIfcPath}");

            try
            {
                // Configure export options
                var options = new GltfExportOptions
                {
                    Format = format,
                    UseNames = useNames,
                    Center = center
                };

                // Call Python service to export glTF
                var result = await _pythonIfcService.ExportGltfAsync(tempIfcPath, tempOutputPath, options);

                if (!result.Success)
                {
                    _logger.LogError($"glTF export failed: {result.ErrorMessage}");
                    return StatusCode(500, new { error = result.ErrorMessage });
                }

                _logger.LogInformation($"Successfully exported glTF. Size: {result.FileSize} bytes");

                // Read the exported file and return as download
                var fileBytes = await System.IO.File.ReadAllBytesAsync(tempOutputPath);

                // Determine content type
                var contentType = format == "glb" ? "model/gltf-binary" : "model/gltf+json";

                // Generate output filename based on input
                var outputFileName = Path.GetFileNameWithoutExtension(file.FileName) + "." + format;

                return File(fileBytes, contentType, outputFileName);
            }
            finally
            {
                // Cleanup temp files
                if (System.IO.File.Exists(tempIfcPath))
                {
                    System.IO.File.Delete(tempIfcPath);
                    _logger.LogDebug($"Deleted temp IFC file: {tempIfcPath}");
                }

                if (System.IO.File.Exists(tempOutputPath))
                {
                    System.IO.File.Delete(tempOutputPath);
                    _logger.LogDebug($"Deleted temp output file: {tempOutputPath}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting glTF file");
            return StatusCode(500, new { error = $"Failed to export glTF file: {ex.Message}" });
        }
    }

    /// <summary>
    /// Extract properties from an IFC element by GlobalId.
    /// </summary>
    /// <param name="file">IFC file to extract properties from (multipart/form-data upload)</param>
    /// <param name="elementGuid">GlobalId (GUID) of the element</param>
    /// <returns>IfcElementProperties JSON object</returns>
    /// <response code="200">Successfully extracted properties</response>
    /// <response code="400">Invalid file or bad request</response>
    /// <response code="500">Server error during extraction</response>
    [HttpPost("extract-properties")]
    [ProducesResponseType(typeof(IfcElementProperties), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ExtractProperties(
        IFormFile file,
        [FromForm] string elementGuid)
    {
        _logger.LogInformation("ExtractProperties endpoint called");

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".ifc")
        {
            return BadRequest(new { error = "Only .ifc files are supported" });
        }

        // Validate elementGuid
        if (string.IsNullOrWhiteSpace(elementGuid))
        {
            return BadRequest(new { error = "elementGuid parameter is required" });
        }

        _logger.LogInformation($"Received file: {file.FileName} ({file.Length} bytes), elementGuid: {elementGuid}");

        try
        {
            // Create temp directory for uploaded file
            var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
            Directory.CreateDirectory(tempDir);

            // Save uploaded file to temp location
            var tempFilePath = Path.Combine(tempDir, $"{Guid.NewGuid()}.ifc");

            using (var stream = new FileStream(tempFilePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Saved temp file: {tempFilePath}");

            try
            {
                // Call Python service to extract properties
                var properties = await _pythonIfcService.ExtractPropertiesAsync(tempFilePath, elementGuid);

                _logger.LogInformation($"Successfully extracted properties for element: {elementGuid}");

                return Ok(properties);
            }
            finally
            {
                // Cleanup temp file
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                    _logger.LogDebug($"Deleted temp file: {tempFilePath}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting properties");
            return StatusCode(500, new { error = $"Failed to extract properties: {ex.Message}" });
        }
    }

    /// <summary>
    /// Extract spatial hierarchy tree from an IFC file.
    /// </summary>
    /// <param name="file">IFC file to extract spatial tree from (multipart/form-data upload)</param>
    /// <param name="flat">If true, returns flat list instead of tree structure</param>
    /// <returns>SpatialNode tree or SpatialElementsList JSON object</returns>
    /// <response code="200">Successfully extracted spatial tree</response>
    /// <response code="400">Invalid file or bad request</response>
    /// <response code="500">Server error during extraction</response>
    [HttpPost("extract-spatial-tree")]
    [ProducesResponseType(typeof(SpatialNode), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(SpatialElementsList), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ExtractSpatialTree(
        IFormFile file,
        [FromForm] bool flat = false)
    {
        _logger.LogInformation("ExtractSpatialTree endpoint called");

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".ifc")
        {
            return BadRequest(new { error = "Only .ifc files are supported" });
        }

        _logger.LogInformation($"Received file: {file.FileName} ({file.Length} bytes), flat: {flat}");

        try
        {
            // Create temp directory for uploaded file
            var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
            Directory.CreateDirectory(tempDir);

            // Save uploaded file to temp location
            var tempFilePath = Path.Combine(tempDir, $"{Guid.NewGuid()}.ifc");

            using (var stream = new FileStream(tempFilePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Saved temp file: {tempFilePath}");

            try
            {
                // Call Python service to extract spatial tree
                var result = await _pythonIfcService.ExtractSpatialTreeAsync(tempFilePath, flat);

                _logger.LogInformation($"Successfully extracted spatial tree");

                return Ok(result);
            }
            finally
            {
                // Cleanup temp file
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                    _logger.LogDebug($"Deleted temp file: {tempFilePath}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting spatial tree");
            return StatusCode(500, new { error = $"Failed to extract spatial tree: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get all stored IFC models with optional filtering and pagination.
    /// </summary>
    /// <param name="skip">Number of records to skip (for pagination)</param>
    /// <param name="take">Number of records to take (max 100)</param>
    /// <param name="schema">Filter by IFC schema (e.g., IFC2X3, IFC4)</param>
    /// <param name="conversionStatus">Filter by conversion status (pending, processing, completed, failed)</param>
    /// <returns>List of stored IFC models</returns>
    [HttpGet("models")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetModels(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        [FromQuery] string? schema = null,
        [FromQuery] string? conversionStatus = null)
    {
        try
        {
            // Validate pagination
            if (take > 100) take = 100;
            if (skip < 0) skip = 0;

            var query = _dbContext.IfcModels.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(schema))
            {
                query = query.Where(m => m.Schema == schema);
            }

            if (!string.IsNullOrWhiteSpace(conversionStatus))
            {
                query = query.Where(m => m.ConversionStatus == conversionStatus);
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Get models
            var models = await query
                .OrderByDescending(m => m.UploadedAt)
                .Skip(skip)
                .Take(take)
                .Select(m => new
                {
                    id = m.Id,
                    fileName = m.FileName,
                    projectName = m.ProjectName,
                    schema = m.Schema,
                    modelId = m.ModelId,
                    author = m.Author,
                    organization = m.Organization,
                    application = m.Application,
                    fileSizeBytes = m.FileSizeBytes,
                    gltfFileSizeBytes = m.GltfFileSizeBytes,
                    conversionStatus = m.ConversionStatus,
                    conversionError = m.ConversionError,
                    uploadedAt = m.UploadedAt,
                    lastAccessedAt = m.LastAccessedAt,
                    convertedAt = m.ConvertedAt,
                    description = m.Description,
                    tags = m.Tags
                })
                .ToListAsync();

            return Ok(new
            {
                totalCount,
                skip,
                take,
                models
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving models");
            return StatusCode(500, new { error = $"Failed to retrieve models: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get a specific IFC model by ID with full details including spatial tree.
    /// </summary>
    /// <param name="id">Model ID</param>
    /// <returns>Model details</returns>
    [HttpGet("models/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetModel(int id)
    {
        try
        {
            var model = await _dbContext.IfcModels.FindAsync(id);

            if (model == null)
            {
                return NotFound(new { error = $"Model with ID {id} not found" });
            }

            // Update last accessed time
            model.LastAccessedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            // Deserialize JSON fields
            Dictionary<string, int>? entityCounts = null;
            if (!string.IsNullOrWhiteSpace(model.EntityCountsJson))
            {
                entityCounts = JsonSerializer.Deserialize<Dictionary<string, int>>(model.EntityCountsJson);
            }

            object? spatialTree = null;
            if (!string.IsNullOrWhiteSpace(model.SpatialTreeJson))
            {
                spatialTree = JsonSerializer.Deserialize<object>(model.SpatialTreeJson);
            }

            return Ok(new
            {
                id = model.Id,
                fileName = model.FileName,
                fileHash = model.FileHash,
                projectName = model.ProjectName,
                schema = model.Schema,
                modelId = model.ModelId,
                entityCounts,
                spatialTree,
                author = model.Author,
                organization = model.Organization,
                application = model.Application,
                fileSizeBytes = model.FileSizeBytes,
                gltfFileSizeBytes = model.GltfFileSizeBytes,
                conversionStatus = model.ConversionStatus,
                conversionError = model.ConversionError,
                uploadedAt = model.UploadedAt,
                lastAccessedAt = model.LastAccessedAt,
                convertedAt = model.ConvertedAt,
                description = model.Description,
                tags = model.Tags,
                hasGltf = !string.IsNullOrWhiteSpace(model.GltfFilePath)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving model {id}");
            return StatusCode(500, new { error = $"Failed to retrieve model: {ex.Message}" });
        }
    }

    /// <summary>
    /// Download the glTF/GLB file for a stored IFC model.
    /// This is used by the frontend viewer to load the 3D model.
    /// </summary>
    /// <param name="id">Model ID</param>
    /// <returns>glTF/GLB file download</returns>
    [HttpGet("models/{id}/gltf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetModelGltf(int id)
    {
        try
        {
            var model = await _dbContext.IfcModels.FindAsync(id);

            if (model == null)
            {
                return NotFound(new { error = $"Model with ID {id} not found" });
            }

            if (string.IsNullOrWhiteSpace(model.GltfFilePath))
            {
                return NotFound(new { error = $"glTF file not available for model {id}. Conversion status: {model.ConversionStatus}" });
            }

            var fullPath = _fileStorage.GetFullPath(model.GltfFilePath);

            if (!_fileStorage.FileExists(model.GltfFilePath))
            {
                _logger.LogError($"glTF file not found at path: {fullPath}");
                return NotFound(new { error = "glTF file not found in storage" });
            }

            // Read file and return
            var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);

            // Determine content type based on file extension
            var extension = Path.GetExtension(model.GltfFilePath).ToLowerInvariant();
            var contentType = extension == ".glb" ? "model/gltf-binary" : "model/gltf+json";

            // Generate output filename
            var outputFileName = Path.GetFileNameWithoutExtension(model.FileName) + extension;

            _logger.LogInformation($"Serving glTF file for model {id}: {outputFileName} ({fileBytes.Length} bytes)");

            return File(fileBytes, contentType, outputFileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving glTF file for model {id}");
            return StatusCode(500, new { error = $"Failed to retrieve glTF file: {ex.Message}" });
        }
    }

    /// <summary>
    /// Reprocess spatial tree for an existing model.
    /// </summary>
    /// <param name="id">Model ID</param>
    /// <returns>Updated model metadata</returns>
    [HttpPost("models/{id}/reprocess-spatial-tree")]
    public async Task<IActionResult> ReprocessSpatialTree(int id)
    {
        try
        {
            var model = await _dbContext.IfcModels.FindAsync(id);

            if (model == null)
            {
                return NotFound(new { error = $"Model with ID {id} not found" });
            }

            // Get full path from file storage
            var fullIfcFilePath = _fileStorage.GetFullPath(model.IfcFilePath);

            if (!System.IO.File.Exists(fullIfcFilePath))
            {
                return NotFound(new { error = $"IFC file not found: {fullIfcFilePath}" });
            }

            _logger.LogInformation($"Reprocessing spatial tree for model {id}: {model.FileName}");

            // Extract spatial tree using Python service
            var spatialTreeResult = await _pythonIfcService.ExtractSpatialTreeAsync(fullIfcFilePath, flat: false);

            if (spatialTreeResult != null)
            {
                model.SpatialTreeJson = JsonSerializer.Serialize(spatialTreeResult);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation($"✅ Successfully reprocessed spatial tree for model {id}");

                return Ok(new
                {
                    id = model.Id,
                    fileName = model.FileName,
                    message = "Spatial tree reprocessed successfully",
                    spatialTree = spatialTreeResult
                });
            }
            else
            {
                return StatusCode(500, new { error = "Failed to extract spatial tree" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error reprocessing spatial tree for model {id}");
            return StatusCode(500, new { error = $"Failed to reprocess spatial tree: {ex.Message}" });
        }
    }

    /// <summary>
    /// Reprocess spatial trees for ALL existing models.
    /// </summary>
    /// <returns>Summary of reprocessing results</returns>
    [HttpPost("models/reprocess-all-spatial-trees")]
    public async Task<IActionResult> ReprocessAllSpatialTrees()
    {
        try
        {
            var models = await _dbContext.IfcModels
                .Where(m => m.SpatialTreeJson != null || m.ConversionStatus == "completed")
                .ToListAsync();

            var results = new List<object>();
            int successCount = 0;
            int failureCount = 0;

            foreach (var model in models)
            {
                try
                {
                    // Get full path from file storage
                    var fullIfcFilePath = _fileStorage.GetFullPath(model.IfcFilePath);

                    if (!System.IO.File.Exists(fullIfcFilePath))
                    {
                        results.Add(new
                        {
                            id = model.Id,
                            fileName = model.FileName,
                            status = "failed",
                            error = "IFC file not found"
                        });
                        failureCount++;
                        continue;
                    }

                    _logger.LogInformation($"Reprocessing model {model.Id}: {model.FileName}");

                    var spatialTreeResult = await _pythonIfcService.ExtractSpatialTreeAsync(fullIfcFilePath, flat: false);

                    if (spatialTreeResult != null)
                    {
                        model.SpatialTreeJson = JsonSerializer.Serialize(spatialTreeResult);
                        await _dbContext.SaveChangesAsync();

                        results.Add(new
                        {
                            id = model.Id,
                            fileName = model.FileName,
                            status = "success"
                        });
                        successCount++;
                    }
                    else
                    {
                        results.Add(new
                        {
                            id = model.Id,
                            fileName = model.FileName,
                            status = "failed",
                            error = "Failed to extract spatial tree"
                        });
                        failureCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error reprocessing model {model.Id}");
                    results.Add(new
                    {
                        id = model.Id,
                        fileName = model.FileName,
                        status = "failed",
                        error = ex.Message
                    });
                    failureCount++;
                }
            }

            return Ok(new
            {
                totalModels = models.Count,
                successCount,
                failureCount,
                results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reprocessing all spatial trees");
            return StatusCode(500, new { error = $"Failed to reprocess spatial trees: {ex.Message}" });
        }
    }

    /// <summary>
    /// Retry glTF conversion for a model stuck in processing status.
    /// </summary>
    /// <param name="id">Model ID</param>
    /// <returns>Conversion status</returns>
    [HttpPost("models/{id}/retry-conversion")]
    public async Task<IActionResult> RetryConversion(int id)
    {
        try
        {
            var model = await _dbContext.IfcModels.FindAsync(id);

            if (model == null)
            {
                return NotFound(new { error = $"Model with ID {id} not found" });
            }

            _logger.LogInformation($"Retrying glTF conversion for model {id}: {model.FileName}");

            // Trigger background conversion task
            _ = Task.Run(async () =>
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedDbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var scopedPythonService = scope.ServiceProvider.GetRequiredService<IPythonIfcService>();
                var scopedFileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<IfcIntelligenceController>>();

                try
                {
                    var modelToConvert = await scopedDbContext.IfcModels.FindAsync(id);
                    if (modelToConvert == null) return;

                    // Reset status to processing
                    modelToConvert.ConversionStatus = "processing";
                    modelToConvert.ConversionError = null;
                    await scopedDbContext.SaveChangesAsync();

                    // Create temp directory for glTF output
                    var tempDir = Path.Combine(Path.GetTempPath(), "ifc-intelligence");
                    Directory.CreateDirectory(tempDir);
                    var tempGltfPath = Path.Combine(tempDir, $"{Guid.NewGuid()}.glb");

                    // Get full IFC path
                    var fullIfcFilePath = scopedFileStorage.GetFullPath(modelToConvert.IfcFilePath);

                    // Export to glTF
                    var options = new GltfExportOptions { Format = "glb", UseNames = false, Center = false };
                    var result = await scopedPythonService.ExportGltfAsync(fullIfcFilePath, tempGltfPath, options);

                    if (result.Success)
                    {
                        // Save glTF file to storage
                        var originalFileName = Path.GetFileNameWithoutExtension(modelToConvert.FileName);
                        var gltfFilePath = await scopedFileStorage.SaveGltfFileAsync(tempGltfPath, originalFileName);

                        // Update database record
                        modelToConvert.GltfFilePath = gltfFilePath;
                        modelToConvert.GltfFileSizeBytes = scopedFileStorage.GetFileSize(gltfFilePath);
                        modelToConvert.ConversionStatus = "completed";
                        modelToConvert.ConvertedAt = DateTime.UtcNow;

                        await scopedDbContext.SaveChangesAsync();

                        scopedLogger.LogInformation($"✅ Successfully converted model {id} to glTF");
                    }
                    else
                    {
                        modelToConvert.ConversionStatus = "failed";
                        modelToConvert.ConversionError = result.ErrorMessage ?? "Unknown error during glTF conversion";
                        await scopedDbContext.SaveChangesAsync();

                        scopedLogger.LogError($"❌ Failed to convert model {id}: {result.ErrorMessage}");
                    }

                    // Clean up temp file
                    if (System.IO.File.Exists(tempGltfPath))
                    {
                        System.IO.File.Delete(tempGltfPath);
                    }
                }
                catch (Exception ex)
                {
                    scopedLogger.LogError(ex, $"Error during background glTF conversion for model {id}");

                    var modelToUpdate = await scopedDbContext.IfcModels.FindAsync(id);
                    if (modelToUpdate != null)
                    {
                        modelToUpdate.ConversionStatus = "failed";
                        modelToUpdate.ConversionError = ex.Message;
                        await scopedDbContext.SaveChangesAsync();
                    }
                }
            });

            return Ok(new
            {
                id = model.Id,
                fileName = model.FileName,
                message = "Conversion retry initiated in background"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrying conversion for model {id}");
            return StatusCode(500, new { error = $"Failed to retry conversion: {ex.Message}" });
        }
    }

    /// <summary>
    /// Trigger element extraction for an existing model to populate database cache.
    /// </summary>
    /// <param name="id">Model ID</param>
    /// <returns>Status message</returns>
    [HttpPost("models/{id}/extract-elements")]
    public async Task<IActionResult> ExtractModelElements(int id)
    {
        try
        {
            // Get model from database
            var model = await _dbContext.IfcModels.FindAsync(id);
            if (model == null)
            {
                return NotFound(new { error = $"Model {id} not found" });
            }

            _logger.LogInformation($"Triggering element extraction for model ID: {id}");

            // Trigger element extraction in background
            _ = Task.Run(async () =>
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedPythonService = scope.ServiceProvider.GetRequiredService<IPythonIfcService>();
                var scopedElementService = scope.ServiceProvider.GetRequiredService<IIfcElementService>();
                var scopedFileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<IfcIntelligenceController>>();

                try
                {
                    var fullIfcFilePath = scopedFileStorage.GetFullPath(model.IfcFilePath);
                    scopedLogger.LogInformation($"Extracting elements from: {fullIfcFilePath}");

                    var elements = await scopedPythonService.ExtractAllElementsAsync(fullIfcFilePath);

                    // Set ModelId for all elements
                    foreach (var element in elements)
                    {
                        element.ModelId = id;
                    }

                    await scopedElementService.StoreElementsAsync(id, elements);

                    scopedLogger.LogInformation($"Successfully stored {elements.Count} elements for model ID: {id}");
                }
                catch (Exception ex)
                {
                    scopedLogger.LogError(ex, $"Failed to extract elements for model ID: {id}");
                }
            });

            return Ok(new
            {
                id = model.Id,
                fileName = model.FileName,
                message = "Element extraction initiated in background"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error triggering element extraction for model {id}");
            return StatusCode(500, new { error = $"Failed to trigger extraction: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get element properties for a specific element in a stored IFC model.
    /// This endpoint uses cached properties from the database for fast retrieval.
    /// </summary>
    /// <param name="id">Model ID</param>
    /// <param name="elementGuid">GlobalId (GUID) of the element</param>
    /// <returns>IfcElementProperties JSON object</returns>
    [HttpGet("models/{id}/properties/{elementGuid}")]
    public async Task<IActionResult> GetStoredModelElementProperties(int id, string elementGuid)
    {
        try
        {
            // Validate elementGuid
            if (string.IsNullOrWhiteSpace(elementGuid))
            {
                return BadRequest(new { error = "elementGuid parameter is required" });
            }

            _logger.LogInformation($"Fetching properties for element {elementGuid} from model {id} (database query)");

            // Get properties from database using C# service (FAST!)
            var properties = await _elementService.GetElementPropertiesAsync(id, elementGuid);

            if (properties == null)
            {
                return NotFound(new { error = $"Element with GUID {elementGuid} not found in model {id}" });
            }

            return Ok(properties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching properties for element {elementGuid} in model {id}");
            return StatusCode(500, new { error = $"Failed to extract properties: {ex.Message}" });
        }
    }

    /// <summary>
    /// Health check endpoint for IFC Intelligence service.
    /// </summary>
    /// <returns>Service status</returns>
    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new
        {
            service = "IFC Intelligence",
            status = "healthy",
            version = "0.2.0",
            timestamp = DateTime.UtcNow,
            features = new[]
            {
                "parse",
                "upload",
                "export-gltf",
                "extract-properties",
                "extract-spatial-tree",
                "models",
                "stored-gltf",
                "stored-model-properties",
                "reprocess-spatial-tree"
            }
        });
    }
}
