using System.Text.Json.Serialization;

namespace ifcserver.Models
{
    /// <summary>
    /// Result of glTF export operation from Python exporter.
    /// Matches the Python GltfExportResult dataclass structure.
    /// </summary>
    public class GltfExportResult
    {
        /// <summary>
        /// Whether the export succeeded
        /// </summary>
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        /// <summary>
        /// Path to the generated glTF/GLB file
        /// </summary>
        [JsonPropertyName("output_path")]
        public string? OutputPath { get; set; }

        /// <summary>
        /// Size of the output file in bytes
        /// </summary>
        [JsonPropertyName("file_size")]
        public long? FileSize { get; set; }

        /// <summary>
        /// Error message if export failed
        /// </summary>
        [JsonPropertyName("error_message")]
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Options for glTF export.
    /// </summary>
    public class GltfExportOptions
    {
        /// <summary>
        /// Output format (glb or gltf)
        /// </summary>
        public string Format { get; set; } = "glb";

        /// <summary>
        /// Use element names instead of GUIDs
        /// </summary>
        public bool UseNames { get; set; } = false;

        /// <summary>
        /// Don't use element GUIDs
        /// </summary>
        public bool NoGuids { get; set; } = false;

        /// <summary>
        /// Don't use material names
        /// </summary>
        public bool NoMaterialNames { get; set; } = false;

        /// <summary>
        /// Center the model at origin
        /// </summary>
        public bool Center { get; set; } = false;

        /// <summary>
        /// Use Y-up coordinate system (default is Z-up)
        /// </summary>
        public bool YUp { get; set; } = false;
    }
}
