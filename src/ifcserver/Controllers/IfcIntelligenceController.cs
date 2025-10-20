using Microsoft.AspNetCore.Mvc;
using ifcserver.Services;
using ifcserver.Models;

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

    public IfcIntelligenceController(
        IPythonIfcService pythonIfcService,
        ILogger<IfcIntelligenceController> logger,
        IWebHostEnvironment environment)
    {
        _pythonIfcService = pythonIfcService;
        _logger = logger;
        _environment = environment;
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
            version = "0.1.0",
            timestamp = DateTime.UtcNow,
            features = new[]
            {
                "parse",
                "export-gltf",
                "extract-properties",
                "extract-spatial-tree"
            }
        });
    }
}
