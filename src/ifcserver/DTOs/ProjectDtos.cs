using System.ComponentModel.DataAnnotations;

namespace ifcserver.DTOs;

/// <summary>
/// Request DTO for creating a new project
/// </summary>
public class CreateProjectRequest
{
    [Required(ErrorMessage = "Project name is required")]
    [MaxLength(255, ErrorMessage = "Project name must be less than 255 characters")]
    public string Name { get; set; } = default!;

    [MaxLength(2000, ErrorMessage = "Description must be less than 2000 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// Request DTO for updating an existing project
/// </summary>
public class UpdateProjectRequest
{
    [Required(ErrorMessage = "Project name is required")]
    [MaxLength(255, ErrorMessage = "Project name must be less than 255 characters")]
    public string Name { get; set; } = default!;

    [MaxLength(2000, ErrorMessage = "Description must be less than 2000 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// Response DTO for project summary (list view)
/// </summary>
public class ProjectSummaryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int RevisionCount { get; set; }
    public string? LatestVersionIdentifier { get; set; }
    public string? ActiveVersionIdentifier { get; set; }
}

/// <summary>
/// Response DTO for project details (includes revisions)
/// </summary>
public class ProjectDetailResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<RevisionSummaryResponse> Revisions { get; set; } = new();
}

/// <summary>
/// Response DTO for revision summary (in project details)
/// </summary>
public class RevisionSummaryResponse
{
    public int Id { get; set; }
    public string VersionIdentifier { get; set; } = default!;
    public int SequenceNumber { get; set; }
    public string? Comment { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsActive { get; set; }
    public string IfcFileName { get; set; } = default!;
    public string ProcessingStatus { get; set; } = default!;
    public string? ProcessingError { get; set; }
    public int ElementCount { get; set; }
}
