using System.Text.Json;
using ifcserver.Models;

namespace ifcserver.Services
{
    /// <summary>
    /// Service for calling Python IFC intelligence scripts via ProcessRunner.
    /// Implements clean-room approach inspired by Bonsai concepts.
    /// </summary>
    public class PythonIfcService : IPythonIfcService
    {
        private readonly ILogger<PythonIfcService> _logger;
        private readonly string _pythonScriptsPath;

        public PythonIfcService(ILogger<PythonIfcService> logger, IConfiguration configuration)
        {
            _logger = logger;

            // Get the path to Python scripts (relative to ifcserver project)
            var contentRoot = configuration.GetValue<string>(WebHostDefaults.ContentRootKey)
                              ?? Directory.GetCurrentDirectory();

            _pythonScriptsPath = Path.GetFullPath(
                Path.Combine(contentRoot, "..", "python-service", "scripts")
            );

            _logger.LogInformation($"Python scripts path: {_pythonScriptsPath}");
        }

        /// <summary>
        /// Parses an IFC file using the Python parse_ifc.py script.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>IfcMetadata object</returns>
        /// <exception cref="FileNotFoundException">If IFC file doesn't exist</exception>
        /// <exception cref="InvalidOperationException">If Python script fails</exception>
        public async Task<IfcMetadata> ParseIfcFileAsync(string ifcFilePath)
        {
            // Validate input file exists
            if (!File.Exists(ifcFilePath))
            {
                throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
            }

            _logger.LogInformation($"Parsing IFC file: {ifcFilePath}");

            try
            {
                // Build path to parse_ifc.py script
                var scriptPath = Path.Combine(_pythonScriptsPath, "parse_ifc.py");

                if (!File.Exists(scriptPath))
                {
                    throw new FileNotFoundException($"Python script not found: {scriptPath}");
                }

                // Run Python script via ProcessRunner
                var arguments = $"\"{scriptPath}\" \"{ifcFilePath}\"";
                var jsonOutput = await ProcessRunner.RunProcessAsync("python3", arguments);

                _logger.LogDebug($"Python output: {jsonOutput}");

                // Deserialize JSON output to IfcMetadata
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var metadata = JsonSerializer.Deserialize<IfcMetadata>(jsonOutput, options);

                if (metadata == null)
                {
                    throw new InvalidOperationException("Failed to deserialize IFC metadata from Python output");
                }

                _logger.LogInformation($"Successfully parsed IFC file. Project: {metadata.ProjectName}, Entities: {metadata.EntityCounts.Count}");

                return metadata;
            }
            catch (Exception ex) when (ex is not FileNotFoundException)
            {
                _logger.LogError(ex, $"Failed to parse IFC file: {ifcFilePath}");
                throw new InvalidOperationException($"Failed to parse IFC file: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Exports an IFC file to glTF/GLB format using the Python export_gltf.py script.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="outputPath">Absolute path for the output glTF/GLB file</param>
        /// <param name="options">Export options</param>
        /// <returns>GltfExportResult object</returns>
        /// <exception cref="FileNotFoundException">If IFC file doesn't exist</exception>
        /// <exception cref="InvalidOperationException">If Python script fails</exception>
        public async Task<GltfExportResult> ExportGltfAsync(string ifcFilePath, string outputPath, GltfExportOptions? options = null)
        {
            // Validate input file exists
            if (!File.Exists(ifcFilePath))
            {
                throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
            }

            // Use default options if not provided
            options ??= new GltfExportOptions();

            _logger.LogInformation($"Exporting IFC to glTF: {ifcFilePath} -> {outputPath}");

            try
            {
                // Build path to export_gltf.py script
                var scriptPath = Path.Combine(_pythonScriptsPath, "export_gltf.py");

                if (!File.Exists(scriptPath))
                {
                    throw new FileNotFoundException($"Python script not found: {scriptPath}");
                }

                // Build arguments for Python script
                var argumentsList = new List<string>
                {
                    $"\"{scriptPath}\"",
                    $"\"{ifcFilePath}\"",
                    $"\"{outputPath}\"",
                    $"--format {options.Format}"
                };

                if (options.UseNames)
                    argumentsList.Add("--use-names");

                if (options.NoGuids)
                    argumentsList.Add("--no-guids");

                if (options.NoMaterialNames)
                    argumentsList.Add("--no-material-names");

                if (options.Center)
                    argumentsList.Add("--center");

                if (options.YUp)
                    argumentsList.Add("--y-up");

                var arguments = string.Join(" ", argumentsList);

                // Run Python script via ProcessRunner
                var jsonOutput = await ProcessRunner.RunProcessAsync("python3", arguments);

                _logger.LogDebug($"Python output: {jsonOutput}");

                // Deserialize JSON output to GltfExportResult
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var result = JsonSerializer.Deserialize<GltfExportResult>(jsonOutput, jsonOptions);

                if (result == null)
                {
                    throw new InvalidOperationException("Failed to deserialize glTF export result from Python output");
                }

                if (result.Success)
                {
                    _logger.LogInformation($"Successfully exported glTF file. Size: {result.FileSize} bytes");
                }
                else
                {
                    _logger.LogWarning($"glTF export failed: {result.ErrorMessage}");
                }

                return result;
            }
            catch (Exception ex) when (ex is not FileNotFoundException)
            {
                _logger.LogError(ex, $"Failed to export IFC to glTF: {ifcFilePath}");
                throw new InvalidOperationException($"Failed to export IFC to glTF: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Extracts properties from an IFC element using the Python extract_properties.py script.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="elementGuid">GlobalId (GUID) of the element</param>
        /// <returns>IfcElementProperties object</returns>
        /// <exception cref="FileNotFoundException">If IFC file doesn't exist</exception>
        /// <exception cref="InvalidOperationException">If Python script fails</exception>
        public async Task<IfcElementProperties> ExtractPropertiesAsync(string ifcFilePath, string elementGuid)
        {
            // Validate input file exists
            if (!File.Exists(ifcFilePath))
            {
                throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
            }

            _logger.LogInformation($"Extracting properties for element: {elementGuid} from {ifcFilePath}");

            try
            {
                // Build path to extract_properties.py script
                var scriptPath = Path.Combine(_pythonScriptsPath, "extract_properties.py");

                if (!File.Exists(scriptPath))
                {
                    throw new FileNotFoundException($"Python script not found: {scriptPath}");
                }

                // Build arguments for Python script
                var arguments = $"\"{scriptPath}\" \"{ifcFilePath}\" \"{elementGuid}\"";

                // Run Python script via ProcessRunner
                var jsonOutput = await ProcessRunner.RunProcessAsync("python3", arguments);

                _logger.LogDebug($"Python output: {jsonOutput}");

                // Deserialize JSON output to IfcElementProperties
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var properties = JsonSerializer.Deserialize<IfcElementProperties>(jsonOutput, jsonOptions);

                if (properties == null)
                {
                    throw new InvalidOperationException("Failed to deserialize element properties from Python output");
                }

                _logger.LogInformation($"Successfully extracted properties for element: {elementGuid}");

                return properties;
            }
            catch (Exception ex) when (ex is not FileNotFoundException)
            {
                _logger.LogError(ex, $"Failed to extract properties: {elementGuid}");
                throw new InvalidOperationException($"Failed to extract properties: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Extracts spatial hierarchy tree from an IFC file using the Python extract_spatial_tree.py script.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="flat">If true, returns flat list instead of tree structure</param>
        /// <returns>SpatialNode tree or SpatialElementsList (if flat=true)</returns>
        /// <exception cref="FileNotFoundException">If IFC file doesn't exist</exception>
        /// <exception cref="InvalidOperationException">If Python script fails</exception>
        public async Task<object> ExtractSpatialTreeAsync(string ifcFilePath, bool flat = false)
        {
            // Validate input file exists
            if (!File.Exists(ifcFilePath))
            {
                throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
            }

            _logger.LogInformation($"Extracting spatial tree from: {ifcFilePath} (flat: {flat})");

            try
            {
                // Build path to extract_spatial_tree.py script
                var scriptPath = Path.Combine(_pythonScriptsPath, "extract_spatial_tree.py");

                if (!File.Exists(scriptPath))
                {
                    throw new FileNotFoundException($"Python script not found: {scriptPath}");
                }

                // Build arguments for Python script
                var argumentsList = new List<string>
                {
                    $"\"{scriptPath}\"",
                    $"\"{ifcFilePath}\""
                };

                if (flat)
                    argumentsList.Add("--flat");

                var arguments = string.Join(" ", argumentsList);

                // Run Python script via ProcessRunner
                var jsonOutput = await ProcessRunner.RunProcessAsync("python3", arguments);

                _logger.LogDebug($"Python output: {jsonOutput}");

                // Deserialize JSON output
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                // Deserialize based on flat flag
                if (flat)
                {
                    var flatResult = JsonSerializer.Deserialize<SpatialElementsList>(jsonOutput, jsonOptions);

                    if (flatResult == null)
                    {
                        throw new InvalidOperationException("Failed to deserialize spatial elements list from Python output");
                    }

                    _logger.LogInformation($"Successfully extracted {flatResult.ElementCount} spatial elements");

                    return flatResult;
                }
                else
                {
                    var treeResult = JsonSerializer.Deserialize<SpatialNode>(jsonOutput, jsonOptions);

                    if (treeResult == null)
                    {
                        throw new InvalidOperationException("Failed to deserialize spatial tree from Python output");
                    }

                    _logger.LogInformation($"Successfully extracted spatial tree. Root: {treeResult.IfcType}");

                    return treeResult;
                }
            }
            catch (Exception ex) when (ex is not FileNotFoundException)
            {
                _logger.LogError(ex, $"Failed to extract spatial tree: {ifcFilePath}");
                throw new InvalidOperationException($"Failed to extract spatial tree: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Extracts all element properties from an IFC file in bulk.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>List of IfcElement objects with properties</returns>
        public async Task<List<IfcElement>> ExtractAllElementsAsync(string ifcFilePath)
        {
            if (!File.Exists(ifcFilePath))
            {
                throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
            }

            _logger.LogInformation($"Extracting all elements from: {ifcFilePath}");

            try
            {
                var scriptPath = Path.Combine(_pythonScriptsPath, "extract_all_elements.py");

                if (!File.Exists(scriptPath))
                {
                    throw new FileNotFoundException($"Python script not found: {scriptPath}");
                }

                // Run Python script (may take several minutes for large files)
                var arguments = $"\"{scriptPath}\" \"{ifcFilePath}\"";
                var jsonOutput = await ProcessRunner.RunProcessAsync("python3", arguments);

                // Parse JSON output
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var bulkResult = JsonSerializer.Deserialize<BulkElementResult>(jsonOutput, jsonOptions);

                if (bulkResult == null || bulkResult.Elements == null)
                {
                    throw new InvalidOperationException("Failed to deserialize element extraction result");
                }

                // Convert to IfcElement entities
                var elements = bulkResult.Elements.Select(e => new IfcElement
                {
                    GlobalId = e.GlobalId,
                    ElementType = e.ElementType,
                    Name = e.Name,
                    Description = e.Description,
                    PropertiesJson = JsonSerializer.Serialize(e.Properties),
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _logger.LogInformation($"Extracted {elements.Count} elements");

                return elements;
            }
            catch (Exception ex) when (ex is not FileNotFoundException)
            {
                _logger.LogError(ex, $"Failed to extract all elements: {ifcFilePath}");
                throw new InvalidOperationException($"Failed to extract all elements: {ex.Message}", ex);
            }
        }

        // Helper classes for bulk element extraction
        private class BulkElementResult
        {
            public int ElementCount { get; set; }
            public List<ElementData> Elements { get; set; } = new();
        }

        private class ElementData
        {
            public string GlobalId { get; set; } = "";
            public string ElementType { get; set; } = "";
            public string? Name { get; set; }
            public string? Description { get; set; }
            public Dictionary<string, object> Properties { get; set; } = new();
        }
    }
}
