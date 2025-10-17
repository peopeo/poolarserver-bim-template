using Microsoft.AspNetCore.Mvc;

namespace ifcserver.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IfcTestDataController : ControllerBase
{
    private readonly ILogger<IfcTestDataController> _logger;

    public IfcTestDataController(ILogger<IfcTestDataController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get IFC test data in JSON format
    /// </summary>
    /// <returns>JSON representation of IFC test data</returns>
    [HttpGet("ifctestjson")]
    public IActionResult GetIfcTestJson()
    {
        _logger.LogInformation("GetIfcTestJson endpoint called");

        var testData = new
        {
            id = "test-ifc-001",
            name = "West Riverside Hospital",
            description = "Sample IFC test data in JSON format",
            timestamp = DateTime.UtcNow,
            models = new[]
            {
                new { id = "mechanical", name = "Mechanical Systems", entityCount = 12500 },
                new { id = "plumbing", name = "Plumbing", entityCount = 8300 },
                new { id = "electrical", name = "Electrical", entityCount = 9200 },
                new { id = "fireAlarms", name = "Fire Alarms", entityCount = 4100 },
                new { id = "sprinklers", name = "Sprinklers", entityCount = 3800 },
                new { id = "structure", name = "Structure", entityCount = 15600 },
                new { id = "architectural", name = "Architectural", entityCount = 18900 }
            },
            metadata = new
            {
                project = "Hospital BIM Project",
                author = "BIM Team",
                created = "2024-01-15",
                ifcSchema = "IFC4"
            }
        };

        return Ok(testData);
    }

    /// <summary>
    /// Get IFC test data in XKT format information
    /// </summary>
    /// <returns>XKT file information and available models</returns>
    [HttpGet("ifctestxkt")]
    public IActionResult GetIfcTestXkt()
    {
        _logger.LogInformation("GetIfcTestXkt endpoint called");

        var xktData = new
        {
            id = "test-xkt-001",
            name = "West Riverside Hospital XKT Models",
            description = "Available XKT models for the hospital project",
            timestamp = DateTime.UtcNow,
            availableModels = new[]
            {
                new
                {
                    id = "mechanical",
                    name = "mechanical",
                    xktUrl = "/WestRiverSideHospital/mechanical.xkt",
                    metadataUrl = "/WestRiverSideHospital/mechanical.json",
                    fileSize = "2.4 MB",
                    excludeUnclassifiedObjects = (bool?)null
                },
                new
                {
                    id = "plumbing",
                    name = "plumbing",
                    xktUrl = "/WestRiverSideHospital/plumbing.xkt",
                    metadataUrl = "/WestRiverSideHospital/plumbing.json",
                    fileSize = "1.8 MB",
                    excludeUnclassifiedObjects = (bool?)null
                },
                new
                {
                    id = "electrical",
                    name = "electrical",
                    xktUrl = "/WestRiverSideHospital/electrical.xkt",
                    metadataUrl = "/WestRiverSideHospital/electrical.json",
                    fileSize = "2.1 MB",
                    excludeUnclassifiedObjects = (bool?)null
                },
                new
                {
                    id = "fireAlarms",
                    name = "fireAlarms",
                    xktUrl = "/WestRiverSideHospital/fireAlarms.xkt",
                    metadataUrl = "/WestRiverSideHospital/fireAlarms.json",
                    fileSize = "1.2 MB",
                    excludeUnclassifiedObjects = (bool?)null
                },
                new
                {
                    id = "sprinklers",
                    name = "sprinklers",
                    xktUrl = "/WestRiverSideHospital/sprinklers.xkt",
                    metadataUrl = "/WestRiverSideHospital/sprinklers.json",
                    fileSize = "1.0 MB",
                    excludeUnclassifiedObjects = (bool?)null
                },
                new
                {
                    id = "structure",
                    name = "structure",
                    xktUrl = "/WestRiverSideHospital/structure.xkt",
                    metadataUrl = "/WestRiverSideHospital/structure.json",
                    fileSize = "3.2 MB",
                    excludeUnclassifiedObjects = (bool?)true
                },
                new
                {
                    id = "architectural",
                    name = "architectural",
                    xktUrl = "/WestRiverSideHospital/architectural.xkt",
                    metadataUrl = "/WestRiverSideHospital/architectural.json",
                    fileSize = "4.1 MB",
                    excludeUnclassifiedObjects = (bool?)true
                }
            },
            format = new
            {
                type = "XKT",
                version = "v2",
                description = "Xeokit's native, optimized geometry format"
            }
        };

        return Ok(xktData);
    }

    /// <summary>
    /// Get IFC metadata JSON for a specific model
    /// </summary>
    /// <param name="modelName">Name of the model (e.g., mechanical, plumbing, etc.)</param>
    /// <returns>JSON metadata file for the specified model</returns>
    [HttpGet("ifctestjson/{modelName}")]
    public IActionResult GetIfcTestJsonByModel(string modelName)
    {
        _logger.LogInformation($"GetIfcTestJsonByModel endpoint called for model: {modelName}");

        var validModels = new[] { "mechanical", "plumbing", "electrical", "fireAlarms", "sprinklers", "structure", "architectural" };

        if (!validModels.Contains(modelName.ToLower()))
        {
            return NotFound(new { error = $"Model '{modelName}' not found. Valid models: {string.Join(", ", validModels)}" });
        }

        var jsonFilePath = Path.Combine("..", "webui", "public", "WestRiverSideHospital", $"{modelName}.json");
        var fullPath = Path.GetFullPath(jsonFilePath);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { error = $"JSON file not found for model '{modelName}'" });
        }

        _logger.LogInformation($"Serving JSON file: {fullPath}");

        var jsonContent = System.IO.File.ReadAllText(fullPath);
        return Content(jsonContent, "application/json");
    }

    /// <summary>
    /// Get XKT binary file for a specific model
    /// </summary>
    /// <param name="modelName">Name of the model (e.g., mechanical, plumbing, etc.)</param>
    /// <returns>XKT binary file for the specified model</returns>
    [HttpGet("ifctestxkt/{modelName}")]
    public IActionResult GetIfcTestXktByModel(string modelName)
    {
        _logger.LogInformation($"GetIfcTestXktByModel endpoint called for model: {modelName}");

        var validModels = new[] { "mechanical", "plumbing", "electrical", "fireAlarms", "sprinklers", "structure", "architectural" };

        if (!validModels.Contains(modelName.ToLower()))
        {
            return NotFound(new { error = $"Model '{modelName}' not found. Valid models: {string.Join(", ", validModels)}" });
        }

        var xktFilePath = Path.Combine("..", "webui", "public", "WestRiverSideHospital", $"{modelName}.xkt");
        var fullPath = Path.GetFullPath(xktFilePath);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { error = $"XKT file not found for model '{modelName}'" });
        }

        _logger.LogInformation($"Serving XKT file: {fullPath}");

        var fileBytes = System.IO.File.ReadAllBytes(fullPath);
        return File(fileBytes, "application/octet-stream", $"{modelName}.xkt");
    }
}
