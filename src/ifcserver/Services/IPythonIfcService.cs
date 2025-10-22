using ifcserver.Models;
using System.Text.Json.Serialization;

namespace ifcserver.Services
{
    /// <summary>
    /// Service interface for Python-based IFC intelligence operations.
    /// </summary>
    public interface IPythonIfcService
    {
        /// <summary>
        /// Parses an IFC file and extracts metadata using Python IfcOpenShell.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>IfcMetadata object with project info and entity counts</returns>
        Task<IfcMetadata> ParseIfcFileAsync(string ifcFilePath);

        /// <summary>
        /// Exports an IFC file to glTF/GLB format using Python IfcConvert.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="outputPath">Absolute path for the output glTF/GLB file</param>
        /// <param name="options">Export options (format, use-names, etc.)</param>
        /// <returns>GltfExportResult with success status and file info</returns>
        Task<GltfExportResult> ExportGltfAsync(string ifcFilePath, string outputPath, GltfExportOptions? options = null);

        /// <summary>
        /// Extracts properties from an IFC element by GlobalId using Python IfcOpenShell.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="elementGuid">GlobalId (GUID) of the element</param>
        /// <returns>IfcElementProperties object with property data</returns>
        Task<IfcElementProperties> ExtractPropertiesAsync(string ifcFilePath, string elementGuid);

        /// <summary>
        /// Extracts spatial hierarchy tree from an IFC file using Python IfcOpenShell.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="flat">If true, returns flat list instead of tree structure</param>
        /// <returns>SpatialNode tree or SpatialElementsList (if flat=true)</returns>
        Task<object> ExtractSpatialTreeAsync(string ifcFilePath, bool flat = false);

        /// <summary>
        /// Extracts all element properties from an IFC file in bulk using Python IfcOpenShell.
        /// This is used during upload to populate the IfcElements table for fast property queries.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>List of IfcElement objects with properties</returns>
        Task<List<IfcElement>> ExtractAllElementsAsync(string ifcFilePath);

        /// <summary>
        /// Extracts all elements with metrics tracking.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="session">Optional metrics session for tracking performance</param>
        /// <returns>Tuple of elements list and PythonMetrics</returns>
        Task<(List<IfcElement> elements, PythonMetrics metrics)> ExtractAllElementsWithMetricsAsync(
            string ifcFilePath,
            MetricsSession? session = null);

        /// <summary>
        /// Exports glTF with metrics tracking.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="outputPath">Absolute path for the output glTF/GLB file</param>
        /// <param name="options">Export options</param>
        /// <returns>Tuple of GltfExportResult and PythonMetrics</returns>
        Task<(GltfExportResult result, PythonMetrics metrics)> ExportGltfWithMetricsAsync(
            string ifcFilePath,
            string outputPath,
            GltfExportOptions? options = null);

        /// <summary>
        /// Extracts spatial tree with metrics tracking.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>Tuple of SpatialNode tree and PythonMetrics</returns>
        Task<(SpatialNode tree, PythonMetrics metrics)> ExtractSpatialTreeWithMetricsAsync(string ifcFilePath);
    }

    /// <summary>
    /// Metrics collected during Python processing operations.
    /// </summary>
    public class PythonMetrics
    {
        [JsonPropertyName("timings")]
        public PythonTimings? Timings { get; set; }

        [JsonPropertyName("statistics")]
        public PythonStatistics? Statistics { get; set; }

        [JsonPropertyName("warnings")]
        public List<string>? Warnings { get; set; }

        [JsonPropertyName("start_time")]
        public string? StartTime { get; set; }

        [JsonPropertyName("end_time")]
        public string? EndTime { get; set; }
    }

    /// <summary>
    /// Timing information from Python scripts.
    /// </summary>
    public class PythonTimings
    {
        [JsonPropertyName("parse_ms")]
        public int? ParseMs { get; set; }

        [JsonPropertyName("element_extraction_ms")]
        public int? ElementExtractionMs { get; set; }

        [JsonPropertyName("spatial_tree_ms")]
        public int? SpatialTreeMs { get; set; }

        [JsonPropertyName("gltf_export_ms")]
        public int? GltfExportMs { get; set; }

        [JsonPropertyName("total_ms")]
        public int? TotalMs { get; set; }
    }

    /// <summary>
    /// Statistics from Python processing.
    /// </summary>
    public class PythonStatistics
    {
        [JsonPropertyName("total_elements")]
        public int? TotalElements { get; set; }

        [JsonPropertyName("element_type_counts")]
        public Dictionary<string, int>? ElementTypeCounts { get; set; }

        [JsonPropertyName("total_property_sets")]
        public int? TotalPropertySets { get; set; }

        [JsonPropertyName("total_properties")]
        public int? TotalProperties { get; set; }

        [JsonPropertyName("total_quantities")]
        public int? TotalQuantities { get; set; }

        [JsonPropertyName("tree_depth")]
        public int? TreeDepth { get; set; }

        [JsonPropertyName("node_count")]
        public int? NodeCount { get; set; }

        [JsonPropertyName("gltf_file_size_bytes")]
        public long? GltfFileSizeBytes { get; set; }
    }
}
