using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ifcserver.Models;

/// <summary>
/// Represents a single IFC element (wall, door, window, etc.) with cached properties
/// </summary>
public class IfcElement
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the parent IFC model
    /// </summary>
    [Required]
    public int ModelId { get; set; }

    /// <summary>
    /// Navigation property to parent model
    /// </summary>
    [ForeignKey(nameof(ModelId))]
    public IfcModel Model { get; set; } = default!;

    /// <summary>
    /// IFC GlobalId (GUID) - unique identifier within the IFC file
    /// Format: 22-character Base64 encoded string
    /// </summary>
    [Required]
    [MaxLength(22)]
    public string GlobalId { get; set; } = default!;

    /// <summary>
    /// IFC element type (e.g., IfcWall, IfcDoor, IfcWindow, IfcSlab)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string ElementType { get; set; } = default!;

    /// <summary>
    /// Element name from IFC file
    /// </summary>
    [MaxLength(255)]
    public string? Name { get; set; }

    /// <summary>
    /// Element description from IFC file
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// All element properties stored as JSONB for fast querying
    /// Structure:
    /// {
    ///   "property_sets": { "Pset_WallCommon": { "IsExternal": true, ... } },
    ///   "quantities": { "BaseQuantities": { "Length": 5.0, ... } },
    ///   "type_properties": { "TypeCommon": { "Material": "Concrete", ... } }
    /// }
    /// </summary>
    [Required]
    [Column(TypeName = "jsonb")]
    public string PropertiesJson { get; set; } = "{}";

    /// <summary>
    /// Timestamp when element was extracted and stored
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
