using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ifcserver.Models;

/// <summary>
/// Represents an uploaded IFC model with metadata and file references
/// </summary>
public class IfcModel
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Original filename of uploaded IFC file
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = default!;

    /// <summary>
    /// SHA256 hash of IFC file content (for deduplication)
    /// </summary>
    [Required]
    [MaxLength(64)]
    public string FileHash { get; set; } = default!;

    /// <summary>
    /// IFC Project name extracted from file
    /// </summary>
    [MaxLength(255)]
    public string? ProjectName { get; set; }

    /// <summary>
    /// IFC Schema version (e.g., IFC2X3, IFC4)
    /// </summary>
    [MaxLength(50)]
    public string? Schema { get; set; }

    /// <summary>
    /// IFC Model GlobalId (from IfcProject)
    /// </summary>
    [MaxLength(50)]
    public string? ModelId { get; set; }

    /// <summary>
    /// Entity counts stored as JSON
    /// Example: {"IfcWall": 50, "IfcDoor": 10}
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? EntityCountsJson { get; set; }

    /// <summary>
    /// Author information from IFC file
    /// </summary>
    [MaxLength(255)]
    public string? Author { get; set; }

    /// <summary>
    /// Organization information from IFC file
    /// </summary>
    [MaxLength(255)]
    public string? Organization { get; set; }

    /// <summary>
    /// Application used to create IFC file
    /// </summary>
    [MaxLength(255)]
    public string? Application { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// Relative path to stored IFC file in file storage
    /// Example: "ifc-models/2024/10/abc123.ifc"
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string IfcFilePath { get; set; } = default!;

    /// <summary>
    /// Relative path to generated glTF/GLB file
    /// Example: "gltf-models/2024/10/abc123.glb"
    /// </summary>
    [MaxLength(500)]
    public string? GltfFilePath { get; set; }

    /// <summary>
    /// Size of generated glTF/GLB file in bytes
    /// </summary>
    public long? GltfFileSizeBytes { get; set; }

    /// <summary>
    /// Spatial tree stored as JSON
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? SpatialTreeJson { get; set; }

    /// <summary>
    /// Status of glTF conversion
    /// </summary>
    [MaxLength(50)]
    public string ConversionStatus { get; set; } = "pending"; // pending|processing|completed|failed

    /// <summary>
    /// Error message if conversion failed
    /// </summary>
    public string? ConversionError { get; set; }

    /// <summary>
    /// Timestamp when model was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when model was last accessed/viewed
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }

    /// <summary>
    /// Timestamp when glTF conversion completed
    /// </summary>
    public DateTime? ConvertedAt { get; set; }

    /// <summary>
    /// User-provided description or notes
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Tags for categorization (comma-separated)
    /// </summary>
    [MaxLength(500)]
    public string? Tags { get; set; }
}
