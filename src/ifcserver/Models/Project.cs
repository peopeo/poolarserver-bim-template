using System.ComponentModel.DataAnnotations;

namespace ifcserver.Models;

/// <summary>
/// Top-level container for organizing related IFC model revisions.
/// Similar to BIMServer's project concept.
/// </summary>
public class Project
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User-friendly project name (e.g., "Office Building Renovation")
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = default!;

    /// <summary>
    /// Optional project description or notes
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Timestamp when project was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when project was last modified (auto-updated by trigger)
    /// Updated automatically when revisions are added/removed
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property: All revisions belonging to this project
    /// </summary>
    public ICollection<Revision> Revisions { get; set; } = new List<Revision>();
}
