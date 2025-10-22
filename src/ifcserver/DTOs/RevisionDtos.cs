using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ifcserver.DTOs;

/// <summary>
/// Request DTO for uploading a new IFC file revision
/// </summary>
public class UploadRevisionRequest
{
    [Required(ErrorMessage = "IFC file is required")]
    public IFormFile File { get; set; } = default!;

    [MaxLength(500, ErrorMessage = "Comment must be less than 500 characters")]
    public string? Comment { get; set; }
}

/// <summary>
/// Request DTO for updating a revision's comment
/// </summary>
public class UpdateRevisionCommentRequest
{
    [MaxLength(500, ErrorMessage = "Comment must be less than 500 characters")]
    public string? Comment { get; set; }
}

/// <summary>
/// Response DTO for revision details
/// </summary>
public class RevisionDetailResponse
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string VersionIdentifier { get; set; } = default!;
    public int SequenceNumber { get; set; }
    public string? Comment { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsActive { get; set; }

    public string IfcFilePath { get; set; } = default!;
    public string IfcFileName { get; set; } = default!;
    public string? GltfFilePath { get; set; }

    public string ProcessingStatus { get; set; } = default!;
    public string? ProcessingError { get; set; }

    public int ElementCount { get; set; }
    public bool HasSpatialTree { get; set; }
}

/// <summary>
/// Response DTO for revision upload result
/// </summary>
public class UploadRevisionResponse
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string VersionIdentifier { get; set; } = default!;
    public int SequenceNumber { get; set; }
    public string? Comment { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsActive { get; set; }
    public string IfcFileName { get; set; } = default!;
    public string ProcessingStatus { get; set; } = default!;
    public string Message { get; set; } = default!;
}
