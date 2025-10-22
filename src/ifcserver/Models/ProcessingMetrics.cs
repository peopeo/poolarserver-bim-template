using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ifcserver.Models;

/// <summary>
/// Stores detailed performance and reliability metrics for IFC processing jobs.
/// Used for comparing IfcOpenShell vs XBIM performance and identifying bottlenecks.
/// </summary>
public class ProcessingMetrics
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the revision that was processed
    /// </summary>
    [Required]
    public int RevisionId { get; set; }

    /// <summary>
    /// Navigation property to revision
    /// </summary>
    [ForeignKey(nameof(RevisionId))]
    public Revision Revision { get; set; } = default!;

    /// <summary>
    /// Processing engine used: "IfcOpenShell" or "Xbim"
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ProcessingEngine { get; set; } = default!;

    // ============ File Information ============

    /// <summary>
    /// Size of the IFC file in bytes
    /// </summary>
    [Required]
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// Original filename
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = default!;

    // ============ Timing Metrics (milliseconds) ============

    /// <summary>
    /// Total end-to-end processing time in milliseconds
    /// </summary>
    public int? TotalProcessingTimeMs { get; set; }

    /// <summary>
    /// IFC file parsing time in milliseconds
    /// </summary>
    public int? ParseTimeMs { get; set; }

    /// <summary>
    /// Element and property extraction time in milliseconds
    /// </summary>
    public int? ElementExtractionTimeMs { get; set; }

    /// <summary>
    /// Spatial tree generation time in milliseconds
    /// </summary>
    public int? SpatialTreeTimeMs { get; set; }

    /// <summary>
    /// glTF export time in milliseconds
    /// </summary>
    public int? GltfExportTimeMs { get; set; }

    // ============ Element Statistics ============

    /// <summary>
    /// Total number of IFC elements extracted
    /// </summary>
    public int? TotalElementCount { get; set; }

    public int IfcWallCount { get; set; } = 0;
    public int IfcSlabCount { get; set; } = 0;
    public int IfcBeamCount { get; set; } = 0;
    public int IfcColumnCount { get; set; } = 0;
    public int IfcDoorCount { get; set; } = 0;
    public int IfcWindowCount { get; set; } = 0;
    public int IfcStairCount { get; set; } = 0;
    public int IfcRailingCount { get; set; } = 0;
    public int IfcRoofCount { get; set; } = 0;
    public int IfcCoveringCount { get; set; } = 0;
    public int IfcFurnishingCount { get; set; } = 0;
    public int IfcSpaceCount { get; set; } = 0;
    public int OtherElementCount { get; set; } = 0;

    // ============ Property Statistics ============

    /// <summary>
    /// Total number of property sets extracted
    /// </summary>
    public int TotalPropertySets { get; set; } = 0;

    /// <summary>
    /// Total number of individual properties extracted
    /// </summary>
    public int TotalProperties { get; set; } = 0;

    /// <summary>
    /// Total number of quantities extracted
    /// </summary>
    public int TotalQuantities { get; set; } = 0;

    // ============ Output Statistics ============

    /// <summary>
    /// Size of generated glTF/GLB file in bytes
    /// </summary>
    public long? GltfFileSizeBytes { get; set; }

    /// <summary>
    /// Maximum depth of the spatial tree hierarchy
    /// </summary>
    public int? SpatialTreeDepth { get; set; }

    /// <summary>
    /// Total number of nodes in the spatial tree
    /// </summary>
    public int? SpatialTreeNodeCount { get; set; }

    // ============ Resource Usage ============

    /// <summary>
    /// Peak memory usage during processing in megabytes
    /// </summary>
    public int? PeakMemoryMb { get; set; }

    /// <summary>
    /// CPU time consumed in milliseconds
    /// </summary>
    public int? CpuTimeMs { get; set; }

    // ============ Success/Failure ============

    /// <summary>
    /// Whether processing completed successfully
    /// </summary>
    [Required]
    public bool Success { get; set; } = false;

    /// <summary>
    /// Error message if processing failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Full error stack trace for debugging
    /// </summary>
    public string? ErrorStackTrace { get; set; }

    /// <summary>
    /// Number of warnings encountered during processing
    /// </summary>
    public int WarningCount { get; set; } = 0;

    // ============ Timestamps ============

    /// <summary>
    /// When processing started
    /// </summary>
    [Required]
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When processing completed (success or failure)
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}
