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
    }
}
