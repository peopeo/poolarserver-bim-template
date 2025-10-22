using System.Diagnostics;
using ifcserver.Models;

namespace ifcserver.Services;

/// <summary>
/// Service for collecting and storing processing metrics and logs
/// </summary>
public interface IProcessingMetricsCollector
{
    /// <summary>
    /// Start a new metrics collection session
    /// </summary>
    MetricsSession StartSession(int revisionId, string engine, string fileName, long fileSizeBytes);

    /// <summary>
    /// Record a successful processing job
    /// </summary>
    Task RecordSuccessAsync(MetricsSession session);

    /// <summary>
    /// Record a failed processing job
    /// </summary>
    Task RecordFailureAsync(MetricsSession session, Exception ex);

    /// <summary>
    /// Log a message for a processing job
    /// </summary>
    Task LogAsync(int revisionId, string engine, string level, string message, object? additionalData = null);
}

/// <summary>
/// Represents an active metrics collection session for a processing job.
/// Provides convenient stopwatches and statistics tracking.
/// </summary>
public class MetricsSession
{
    public int RevisionId { get; set; }
    public string Engine { get; set; } = default!;
    public string FileName { get; set; } = default!;
    public long FileSizeBytes { get; set; }

    // Timers for different processing stages
    public Stopwatch TotalTimer { get; } = Stopwatch.StartNew();
    public Stopwatch ParseTimer { get; } = new();
    public Stopwatch ElementExtractionTimer { get; } = new();
    public Stopwatch SpatialTreeTimer { get; } = new();
    public Stopwatch GltfExportTimer { get; } = new();

    // Python timing overrides (when Python provides timing instead of C# Stopwatch)
    public int? PythonParseMs { get; set; }
    public int? PythonElementExtractionMs { get; set; }
    public int? PythonSpatialTreeMs { get; set; }
    public int? PythonGltfExportMs { get; set; }

    // Element statistics
    public Dictionary<string, int> ElementCounts { get; } = new();
    public int TotalPropertySets { get; set; }
    public int TotalProperties { get; set; }
    public int TotalQuantities { get; set; }

    // Output statistics
    public long? GltfFileSizeBytes { get; set; }
    public int? SpatialTreeDepth { get; set; }
    public int? SpatialTreeNodeCount { get; set; }

    // Resource usage
    public int? PeakMemoryMb { get; set; }

    // Warnings
    public int WarningCount { get; set; }

    /// <summary>
    /// Get total element count from ElementCounts dictionary
    /// </summary>
    public int GetTotalElementCount()
    {
        return ElementCounts.Values.Sum();
    }

    /// <summary>
    /// Increment element count by type
    /// </summary>
    public void IncrementElementCount(string elementType)
    {
        if (ElementCounts.ContainsKey(elementType))
        {
            ElementCounts[elementType]++;
        }
        else
        {
            ElementCounts[elementType] = 1;
        }
    }

    /// <summary>
    /// Get element count for a specific IFC type
    /// Maps from IFC type name to count with fuzzy matching
    /// </summary>
    public int GetIfcTypeCount(string ifcTypeName)
    {
        // Try exact match first
        if (ElementCounts.TryGetValue(ifcTypeName, out var exactCount))
        {
            return exactCount;
        }

        // Try case-insensitive match
        var match = ElementCounts.FirstOrDefault(kvp =>
            kvp.Key.Equals(ifcTypeName, StringComparison.OrdinalIgnoreCase));

        if (match.Key != null)
        {
            return match.Value;
        }

        // Try partial match (contains)
        match = ElementCounts.FirstOrDefault(kvp =>
            kvp.Key.Contains(ifcTypeName, StringComparison.OrdinalIgnoreCase) ||
            ifcTypeName.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase));

        return match.Key != null ? match.Value : 0;
    }

    /// <summary>
    /// Get count for elements that don't match specific IFC types
    /// </summary>
    public int GetOtherElementCount()
    {
        var knownTypes = new[]
        {
            "IfcWall", "IfcSlab", "IfcBeam", "IfcColumn", "IfcDoor", "IfcWindow",
            "IfcStair", "IfcRailing", "IfcRoof", "IfcCovering", "IfcFurnishing", "IfcSpace"
        };

        var knownCount = knownTypes.Sum(type => GetIfcTypeCount(type));
        return Math.Max(0, GetTotalElementCount() - knownCount);
    }
}
