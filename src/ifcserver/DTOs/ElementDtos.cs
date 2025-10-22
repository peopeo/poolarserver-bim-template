namespace ifcserver.DTOs;

/// <summary>
/// Response DTO for IFC element details
/// Prevents circular reference issues by not including navigation properties
/// </summary>
public class IfcElementResponse
{
    public int Id { get; set; }
    public int RevisionId { get; set; }
    public string IfcGuid { get; set; } = default!;
    public string ElementType { get; set; } = default!;
    public string? Name { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Detailed response DTO for IFC element with properties
/// </summary>
public class IfcElementDetailResponse
{
    public int Id { get; set; }
    public int RevisionId { get; set; }
    public string IfcGuid { get; set; } = default!;
    public string ElementType { get; set; } = default!;
    public string? Name { get; set; }
    public string? Description { get; set; }

    // All properties as JSON (no navigation to Revision)
    public string PropertiesJson { get; set; } = default!;
}

/// <summary>
/// Lightweight response DTO for element lists
/// </summary>
public class IfcElementSummaryResponse
{
    public int Id { get; set; }
    public string IfcGuid { get; set; } = default!;
    public string ElementType { get; set; } = default!;
    public string? Name { get; set; }
}
