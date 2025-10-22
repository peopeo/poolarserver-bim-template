using System.Text.Json.Serialization;

namespace ifcserver.Models
{
    /// <summary>
    /// Properties of an IFC element extracted from PropertySets.
    /// Matches the Python IfcElementProperties dataclass structure.
    /// </summary>
    public class IfcElementProperties
    {
        /// <summary>
        /// IFC GlobalId (GUID) of the element
        /// </summary>
        [JsonPropertyName("global_id")]
        public string GlobalId { get; set; } = string.Empty;

        /// <summary>
        /// IFC entity type (e.g., IfcWall, IfcDoor)
        /// </summary>
        [JsonPropertyName("element_type")]
        public string ElementType { get; set; } = string.Empty;

        /// <summary>
        /// Element name (from Name attribute)
        /// </summary>
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        /// <summary>
        /// Element description (from Description attribute)
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>
        /// PropertySets (e.g., Pset_WallCommon)
        /// Dictionary of PropertySet name to property key-value pairs
        /// </summary>
        [JsonPropertyName("property_sets")]
        public Dictionary<string, Dictionary<string, object?>> PropertySets { get; set; } = new();

        /// <summary>
        /// Quantities (from QuantitySets, e.g., Qto_WallBaseQuantities)
        /// Dictionary of QuantitySet name to quantity key-value pairs
        /// </summary>
        [JsonPropertyName("quantities")]
        public Dictionary<string, Dictionary<string, object?>> Quantities { get; set; } = new();

        /// <summary>
        /// Properties inherited from the element's type
        /// </summary>
        [JsonPropertyName("type_properties")]
        public Dictionary<string, Dictionary<string, object?>> TypeProperties { get; set; } = new();
    }
}
