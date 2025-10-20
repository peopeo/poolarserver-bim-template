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
    }
}
