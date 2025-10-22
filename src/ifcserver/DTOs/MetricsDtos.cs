namespace ifcserver.DTOs;

/// <summary>
/// Response DTO for processing metrics of a single revision
/// </summary>
public class ProcessingMetricsResponse
{
    public int Id { get; set; }
    public int RevisionId { get; set; }
    public string ProcessingEngine { get; set; } = default!;

    // File Information
    public long FileSizeBytes { get; set; }
    public double FileSizeMb => FileSizeBytes / (1024.0 * 1024.0);
    public string FileName { get; set; } = default!;

    // Timing Metrics
    public TimingMetrics? Timings { get; set; }

    // Element Statistics
    public ElementStatistics? Elements { get; set; }

    // Property Statistics
    public PropertyStatistics? Properties { get; set; }

    // Output Statistics
    public OutputStatistics? Outputs { get; set; }

    // Resource Usage
    public ResourceMetrics? Resources { get; set; }

    // Success/Failure
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int WarningCount { get; set; }

    // Timestamps
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? TotalDurationSeconds => CompletedAt.HasValue
        ? (int)(CompletedAt.Value - StartedAt).TotalSeconds
        : null;
}

public class TimingMetrics
{
    public int? TotalProcessingTimeMs { get; set; }
    public int? ParseTimeMs { get; set; }
    public int? ElementExtractionTimeMs { get; set; }
    public int? SpatialTreeTimeMs { get; set; }
    public int? GltfExportTimeMs { get; set; }

    // Calculated percentages
    public double? ParsePercent => CalculatePercent(ParseTimeMs, TotalProcessingTimeMs);
    public double? ElementExtractionPercent => CalculatePercent(ElementExtractionTimeMs, TotalProcessingTimeMs);
    public double? SpatialTreePercent => CalculatePercent(SpatialTreeTimeMs, TotalProcessingTimeMs);
    public double? GltfExportPercent => CalculatePercent(GltfExportTimeMs, TotalProcessingTimeMs);

    private double? CalculatePercent(int? part, int? total)
    {
        if (part.HasValue && total.HasValue && total.Value > 0)
            return Math.Round((part.Value / (double)total.Value) * 100, 2);
        return null;
    }
}

public class ElementStatistics
{
    public int TotalElementCount { get; set; }
    public int IfcWallCount { get; set; }
    public int IfcSlabCount { get; set; }
    public int IfcBeamCount { get; set; }
    public int IfcColumnCount { get; set; }
    public int IfcDoorCount { get; set; }
    public int IfcWindowCount { get; set; }
    public int IfcStairCount { get; set; }
    public int IfcRailingCount { get; set; }
    public int IfcRoofCount { get; set; }
    public int IfcCoveringCount { get; set; }
    public int IfcFurnishingCount { get; set; }
    public int IfcSpaceCount { get; set; }
    public int OtherElementCount { get; set; }
}

public class PropertyStatistics
{
    public int TotalPropertySets { get; set; }
    public int TotalProperties { get; set; }
    public int TotalQuantities { get; set; }
}

public class OutputStatistics
{
    public long? GltfFileSizeBytes { get; set; }
    public double? GltfFileSizeMb => GltfFileSizeBytes.HasValue
        ? GltfFileSizeBytes.Value / (1024.0 * 1024.0)
        : null;
    public int? SpatialTreeDepth { get; set; }
    public int? SpatialTreeNodeCount { get; set; }
}

public class ResourceMetrics
{
    public int? PeakMemoryMb { get; set; }
    public int? CpuTimeMs { get; set; }
}

/// <summary>
/// Response DTO for comparing two engines processing the same file
/// </summary>
public class EngineComparisonResponse
{
    public ComparisonInfo Comparison { get; set; } = default!;
    public ProcessingMetricsResponse? IfcOpenShell { get; set; }
    public ProcessingMetricsResponse? Xbim { get; set; }
    public ComparisonSummary Summary { get; set; } = default!;
}

public class ComparisonInfo
{
    public string FileName { get; set; } = default!;
    public long FileSizeBytes { get; set; }
    public double FileSizeMb => FileSizeBytes / (1024.0 * 1024.0);
    public DateTime ComparisonDate { get; set; } = DateTime.UtcNow;
}

public class ComparisonSummary
{
    // Speed Comparison
    public string? FasterEngine { get; set; }
    public int? SpeedDifferenceMs { get; set; }
    public double? SpeedDifferencePercent { get; set; }
    public string? SpeedSummary { get; set; }

    // Element Count Comparison
    public bool ElementCountsMatch { get; set; }
    public int? ElementCountDifference { get; set; }
    public string? ElementCountSummary { get; set; }

    // Reliability Comparison
    public string? MoreReliableEngine { get; set; }
    public int? WarningDifference { get; set; }
    public string? ReliabilitySummary { get; set; }

    // File Size Comparison (glTF)
    public string? SmallerGltfEngine { get; set; }
    public long? GltfSizeDifferenceBytes { get; set; }
    public double? GltfSizeDifferenceMb => GltfSizeDifferenceBytes.HasValue
        ? GltfSizeDifferenceBytes.Value / (1024.0 * 1024.0)
        : null;
    public string? GltfSizeSummary { get; set; }

    // Overall Recommendation
    public string? Recommendation { get; set; }
}

/// <summary>
/// Response DTO for aggregate engine statistics
/// </summary>
public class EngineStatisticsResponse
{
    public string Engine { get; set; } = default!;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Job Counts
    public int TotalJobs { get; set; }
    public int SuccessfulJobs { get; set; }
    public int FailedJobs { get; set; }
    public double SuccessRatePercent { get; set; }

    // Timing Statistics
    public int? AverageProcessingTimeMs { get; set; }
    public int? MedianProcessingTimeMs { get; set; }
    public int? MinProcessingTimeMs { get; set; }
    public int? MaxProcessingTimeMs { get; set; }

    // Element Statistics
    public double? AverageElementCount { get; set; }
    public long TotalElementsProcessed { get; set; }

    // File Size Statistics
    public double? AverageFileSizeMb { get; set; }
    public double? MinFileSizeMb { get; set; }
    public double? MaxFileSizeMb { get; set; }

    // Common Failure Reasons
    public List<FailureReason>? TopFailureReasons { get; set; }
}

public class FailureReason
{
    public string ErrorMessage { get; set; } = default!;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

/// <summary>
/// Response DTO for failure report
/// </summary>
public class FailureReportResponse
{
    public int MetricId { get; set; }
    public int RevisionId { get; set; }
    public string ProcessingEngine { get; set; } = default!;
    public string IfcFileName { get; set; } = default!;
    public double FileSizeMb { get; set; }
    public string ErrorMessage { get; set; } = default!;
    public string? ErrorStackTrace { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? TotalProcessingTimeMs { get; set; }
}

/// <summary>
/// Response DTO for processing logs
/// </summary>
public class ProcessingLogResponse
{
    public int Id { get; set; }
    public int RevisionId { get; set; }
    public string ProcessingEngine { get; set; } = default!;
    public string LogLevel { get; set; } = default!;
    public string Message { get; set; } = default!;
    public string? Exception { get; set; }
    public Dictionary<string, object>? AdditionalData { get; set; }
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Response DTO for performance by file size
/// </summary>
public class PerformanceByFileSizeResponse
{
    public string ProcessingEngine { get; set; } = default!;
    public string FileSizeRange { get; set; } = default!;
    public int JobCount { get; set; }
    public int? AvgProcessingTimeMs { get; set; }
    public int? AvgElementCount { get; set; }
    public double? MsPerElement { get; set; }
}
