using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace ifcserver.Models;

/// <summary>
/// Stores structured logs for IFC processing jobs.
/// Enables detailed debugging and analysis of processing behavior.
/// </summary>
public class ProcessingLog
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the revision being processed
    /// </summary>
    [Required]
    public int RevisionId { get; set; }

    /// <summary>
    /// Navigation property to revision
    /// </summary>
    [ForeignKey(nameof(RevisionId))]
    public Revision Revision { get; set; } = default!;

    /// <summary>
    /// Processing engine that generated this log: "IfcOpenShell" or "Xbim"
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ProcessingEngine { get; set; } = default!;

    /// <summary>
    /// Log level: Debug, Info, Warning, Error, Critical
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string LogLevel { get; set; } = default!;

    /// <summary>
    /// Log message
    /// </summary>
    [Required]
    public string Message { get; set; } = default!;

    /// <summary>
    /// Exception details if this is an error log
    /// </summary>
    public string? Exception { get; set; }

    /// <summary>
    /// Additional structured data (stored as JSON)
    /// Can contain custom metrics, context, or debugging info
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? AdditionalData { get; set; }

    /// <summary>
    /// When this log entry was created
    /// </summary>
    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Helper method to set additional data from an object
    /// </summary>
    public void SetAdditionalData(object? data)
    {
        if (data != null)
        {
            AdditionalData = JsonSerializer.Serialize(data);
        }
    }

    /// <summary>
    /// Helper method to get additional data as a typed object
    /// </summary>
    public T? GetAdditionalData<T>()
    {
        if (string.IsNullOrEmpty(AdditionalData))
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(AdditionalData);
    }
}
