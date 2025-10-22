using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ifcserver.Models;

/// <summary>
/// Represents an immutable IFC model revision with version control.
/// Replaces the old IfcModel with project-based organization.
/// Each revision is immutable - never updated, only created or deleted.
/// </summary>
public class Revision
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to parent project
    /// </summary>
    [Required]
    public int ProjectId { get; set; }

    /// <summary>
    /// Navigation property to parent project
    /// </summary>
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = default!;

    /// <summary>
    /// Auto-generated version identifier with timestamp
    /// Format: v{sequence}_{YYYY-MM-DD_HH-mm-ss}
    /// Example: "v1_2025-10-21_14-30-45"
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string VersionIdentifier { get; set; } = default!;

    /// <summary>
    /// Sequential version number within project (1, 2, 3, ...)
    /// Used for generating version identifiers
    /// </summary>
    [Required]
    public int SequenceNumber { get; set; }

    /// <summary>
    /// User-provided comment describing this revision
    /// Example: "Updated kitchen layout", "Fixed wall alignment"
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// Timestamp when this revision was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Indicates if this is the currently active revision for the project
    /// Only one revision per project can be active (enforced by database trigger)
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = false;

    /// <summary>
    /// Absolute or relative path to stored IFC file
    /// Example: "/storage/projects/1/revisions/1/original.ifc"
    /// </summary>
    [Required]
    public string IfcFilePath { get; set; } = default!;

    /// <summary>
    /// Original IFC filename (for display purposes)
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string IfcFileName { get; set; } = default!;

    /// <summary>
    /// Path to generated glTF/GLB file (null until conversion completes)
    /// Example: "/storage/projects/1/revisions/1/model.gltf"
    /// </summary>
    public string? GltfFilePath { get; set; }

    /// <summary>
    /// Processing status of this revision
    /// - Pending: Uploaded, not yet processed
    /// - Processing: Currently extracting elements/converting to glTF
    /// - Completed: All processing finished successfully
    /// - Failed: Processing encountered an error
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ProcessingStatus { get; set; } = "Pending";

    /// <summary>
    /// Error message if processing failed
    /// </summary>
    public string? ProcessingError { get; set; }

    /// <summary>
    /// Processing engine used for this revision (IfcOpenShell or Xbim)
    /// </summary>
    [MaxLength(20)]
    public string? ProcessingEngine { get; set; }

    /// <summary>
    /// Navigation property: All elements extracted from this revision
    /// </summary>
    public ICollection<IfcElement> Elements { get; set; } = new List<IfcElement>();

    /// <summary>
    /// Navigation property: Spatial tree for this revision (one-to-one)
    /// </summary>
    public SpatialTree? SpatialTree { get; set; }
}
