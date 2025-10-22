using System.Text.Json.Serialization;

namespace ifcserver.Models
{
    /// <summary>
    /// Represents a node in the IFC spatial hierarchy tree.
    /// Matches the Python SpatialNode dataclass structure.
    /// </summary>
    public class SpatialNode
    {
        /// <summary>
        /// IFC GlobalId (GUID) of the element
        /// </summary>
        [JsonPropertyName("global_id")]
        public string GlobalId { get; set; } = string.Empty;

        /// <summary>
        /// Element name (from Name attribute)
        /// </summary>
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        /// <summary>
        /// IFC entity type (e.g., IfcProject, IfcSite, IfcBuilding, IfcBuildingStorey)
        /// </summary>
        [JsonPropertyName("ifc_type")]
        public string IfcType { get; set; } = string.Empty;

        /// <summary>
        /// Element description (from Description attribute)
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Long name (e.g., for building storeys, sites)
        /// </summary>
        [JsonPropertyName("long_name")]
        public string? LongName { get; set; }

        /// <summary>
        /// List of child nodes in the spatial hierarchy
        /// </summary>
        [JsonPropertyName("children")]
        public List<SpatialNode> Children { get; set; } = new();
    }

    /// <summary>
    /// Flat list of spatial elements (alternative to tree structure)
    /// </summary>
    public class SpatialElementsList
    {
        /// <summary>
        /// Total count of spatial elements
        /// </summary>
        [JsonPropertyName("element_count")]
        public int ElementCount { get; set; }

        /// <summary>
        /// Flat list of spatial elements
        /// </summary>
        [JsonPropertyName("elements")]
        public List<SpatialElementInfo> Elements { get; set; } = new();
    }

    /// <summary>
    /// Simple spatial element info (without children)
    /// </summary>
    public class SpatialElementInfo
    {
        /// <summary>
        /// IFC GlobalId (GUID) of the element
        /// </summary>
        [JsonPropertyName("global_id")]
        public string GlobalId { get; set; } = string.Empty;

        /// <summary>
        /// Element name
        /// </summary>
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        /// <summary>
        /// IFC entity type
        /// </summary>
        [JsonPropertyName("ifc_type")]
        public string IfcType { get; set; } = string.Empty;

        /// <summary>
        /// Element description
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Long name
        /// </summary>
        [JsonPropertyName("long_name")]
        public string? LongName { get; set; }
    }
}
