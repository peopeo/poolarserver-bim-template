using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ifcserver.Models;

/// <summary>
/// Represents a cached spatial hierarchy tree for an IFC model revision.
/// Structure: Site → Building → Storey → Spaces/Rooms → Elements
/// Stored as JSONB for fast querying and retrieval.
/// </summary>
public class SpatialTree
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the parent revision (one-to-one relationship)
    /// </summary>
    [Required]
    public int RevisionId { get; set; }

    /// <summary>
    /// Navigation property to parent revision
    /// </summary>
    [ForeignKey(nameof(RevisionId))]
    public Revision Revision { get; set; } = default!;

    /// <summary>
    /// Complete spatial hierarchy stored as JSONB
    /// Structure example:
    /// {
    ///   "type": "IfcSite",
    ///   "global_id": "2O2Fr$t4X7Zf8NOew3FL9r",
    ///   "name": "Default Site",
    ///   "children": [
    ///     {
    ///       "type": "IfcBuilding",
    ///       "global_id": "2O2Fr$t4X7Zf8NOew3FLCp",
    ///       "name": "Building",
    ///       "children": [
    ///         {
    ///           "type": "IfcBuildingStorey",
    ///           "global_id": "2O2Fr$t4X7Zf8NOew3FLFM",
    ///           "name": "Level 1",
    ///           "elevation": 0.0,
    ///           "children": [...]
    ///         }
    ///       ]
    ///     }
    ///   ]
    /// }
    /// </summary>
    [Required]
    [Column(TypeName = "jsonb")]
    public string TreeJson { get; set; } = "{}";

    /// <summary>
    /// Timestamp when spatial tree was extracted and cached
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
