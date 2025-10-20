using System.Text.Json.Serialization;

namespace ifcserver.Models
{
    /// <summary>
    /// IFC metadata extracted from an IFC file by Python parser.
    /// Matches the Python IfcMetadata dataclass structure.
    /// </summary>
    public class IfcMetadata
    {
        /// <summary>
        /// Global unique identifier of the IFC project
        /// </summary>
        [JsonPropertyName("model_id")]
        public string ModelId { get; set; } = string.Empty;

        /// <summary>
        /// Name of the IFC project
        /// </summary>
        [JsonPropertyName("project_name")]
        public string ProjectName { get; set; } = string.Empty;

        /// <summary>
        /// IFC schema version (e.g., IFC2X3, IFC4)
        /// </summary>
        [JsonPropertyName("schema")]
        public string Schema { get; set; } = string.Empty;

        /// <summary>
        /// Count of entities by type (e.g., IfcWall: 42)
        /// </summary>
        [JsonPropertyName("entity_counts")]
        public Dictionary<string, int> EntityCounts { get; set; } = new();

        /// <summary>
        /// Author name (extracted from IfcOwnerHistory)
        /// </summary>
        [JsonPropertyName("author")]
        public string? Author { get; set; }

        /// <summary>
        /// Organization name (extracted from IfcOwnerHistory)
        /// </summary>
        [JsonPropertyName("organization")]
        public string? Organization { get; set; }

        /// <summary>
        /// Authoring application name (extracted from IfcOwnerHistory)
        /// </summary>
        [JsonPropertyName("application")]
        public string? Application { get; set; }
    }
}
