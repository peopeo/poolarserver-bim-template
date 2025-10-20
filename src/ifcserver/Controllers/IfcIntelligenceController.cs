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
                "parse" // More features will be added in future tasks
            }
        });
    }
}
