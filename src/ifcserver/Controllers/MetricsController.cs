using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ifcserver.Data;
using ifcserver.Models;
using ifcserver.DTOs;
using System.Text.Json;

namespace ifcserver.Controllers;

/// <summary>
/// API endpoints for processing metrics, engine comparison, and performance analysis
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<MetricsController> _logger;

    public MetricsController(AppDbContext context, ILogger<MetricsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get processing metrics for a specific revision
    /// </summary>
    [HttpGet("revisions/{revisionId}")]
    [ProducesResponseType(typeof(ProcessingMetricsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProcessingMetricsResponse>> GetRevisionMetrics(int revisionId)
    {
        _logger.LogInformation("Fetching metrics for revision {RevisionId}", revisionId);

        var metrics = await _context.Set<ProcessingMetrics>()
            .Where(m => m.RevisionId == revisionId)
            .FirstOrDefaultAsync();

        if (metrics == null)
        {
            return NotFound(new { message = $"No metrics found for revision {revisionId}" });
        }

        var response = MapToResponse(metrics);
        return Ok(response);
    }

    /// <summary>
    /// Compare two revisions (same file processed with different engines)
    /// </summary>
    [HttpGet("compare")]
    [ProducesResponseType(typeof(EngineComparisonResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EngineComparisonResponse>> CompareEngines(
        [FromQuery] int? ifcOpenShellRevisionId,
        [FromQuery] int? xbimRevisionId)
    {
        if (!ifcOpenShellRevisionId.HasValue || !xbimRevisionId.HasValue)
        {
            return BadRequest(new { message = "Both ifcOpenShellRevisionId and xbimRevisionId are required" });
        }

        _logger.LogInformation("Comparing engines: IfcOpenShell revision {IfcOpenShellId} vs XBIM revision {XbimId}",
            ifcOpenShellRevisionId, xbimRevisionId);

        var ifcOpenShellMetrics = await _context.Set<ProcessingMetrics>()
            .Where(m => m.RevisionId == ifcOpenShellRevisionId && m.ProcessingEngine == "IfcOpenShell")
            .FirstOrDefaultAsync();

        var xbimMetrics = await _context.Set<ProcessingMetrics>()
            .Where(m => m.RevisionId == xbimRevisionId && m.ProcessingEngine == "Xbim")
            .FirstOrDefaultAsync();

        if (ifcOpenShellMetrics == null && xbimMetrics == null)
        {
            return NotFound(new { message = "No metrics found for the specified revisions" });
        }

        var response = new EngineComparisonResponse
        {
            Comparison = new ComparisonInfo
            {
                FileName = ifcOpenShellMetrics?.FileName ?? xbimMetrics?.FileName ?? "Unknown",
                FileSizeBytes = ifcOpenShellMetrics?.FileSizeBytes ?? xbimMetrics?.FileSizeBytes ?? 0
            },
            IfcOpenShell = ifcOpenShellMetrics != null ? MapToResponse(ifcOpenShellMetrics) : null,
            Xbim = xbimMetrics != null ? MapToResponse(xbimMetrics) : null,
            Summary = GenerateComparisonSummary(ifcOpenShellMetrics, xbimMetrics)
        };

        return Ok(response);
    }

    /// <summary>
    /// Get aggregate statistics for an engine
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(EngineStatisticsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EngineStatisticsResponse>> GetEngineStatistics(
        [FromQuery] string engine,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        if (string.IsNullOrWhiteSpace(engine))
        {
            return BadRequest(new { message = "Engine parameter is required (IfcOpenShell or Xbim)" });
        }

        if (engine != "IfcOpenShell" && engine != "Xbim")
        {
            return BadRequest(new { message = "Engine must be either 'IfcOpenShell' or 'Xbim'" });
        }

        _logger.LogInformation("Fetching statistics for engine {Engine}", engine);

        var query = _context.Set<ProcessingMetrics>()
            .Where(m => m.ProcessingEngine == engine);

        if (startDate.HasValue)
            query = query.Where(m => m.StartedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(m => m.StartedAt <= endDate.Value);

        var metrics = await query.ToListAsync();

        if (!metrics.Any())
        {
            return Ok(new EngineStatisticsResponse
            {
                Engine = engine,
                StartDate = startDate,
                EndDate = endDate,
                TotalJobs = 0,
                SuccessfulJobs = 0,
                FailedJobs = 0,
                SuccessRatePercent = 0
            });
        }

        var successfulMetrics = metrics.Where(m => m.Success).ToList();
        var failedMetrics = metrics.Where(m => !m.Success).ToList();

        var processingTimes = successfulMetrics
            .Where(m => m.TotalProcessingTimeMs.HasValue)
            .Select(m => m.TotalProcessingTimeMs!.Value)
            .OrderBy(t => t)
            .ToList();

        var response = new EngineStatisticsResponse
        {
            Engine = engine,
            StartDate = startDate,
            EndDate = endDate,
            TotalJobs = metrics.Count,
            SuccessfulJobs = successfulMetrics.Count,
            FailedJobs = failedMetrics.Count,
            SuccessRatePercent = Math.Round((successfulMetrics.Count / (double)metrics.Count) * 100, 2),
            AverageProcessingTimeMs = processingTimes.Any() ? (int)processingTimes.Average() : null,
            MedianProcessingTimeMs = processingTimes.Any() ? processingTimes[processingTimes.Count / 2] : null,
            MinProcessingTimeMs = processingTimes.Any() ? processingTimes.Min() : null,
            MaxProcessingTimeMs = processingTimes.Any() ? processingTimes.Max() : null,
            AverageElementCount = successfulMetrics.Any(m => m.TotalElementCount.HasValue)
                ? successfulMetrics.Where(m => m.TotalElementCount.HasValue).Average(m => m.TotalElementCount!.Value)
                : null,
            TotalElementsProcessed = successfulMetrics.Sum(m => m.TotalElementCount ?? 0),
            AverageFileSizeMb = metrics.Average(m => m.FileSizeBytes / (1024.0 * 1024.0)),
            MinFileSizeMb = metrics.Min(m => m.FileSizeBytes) / (1024.0 * 1024.0),
            MaxFileSizeMb = metrics.Max(m => m.FileSizeBytes) / (1024.0 * 1024.0),
            TopFailureReasons = failedMetrics
                .Where(m => !string.IsNullOrEmpty(m.ErrorMessage))
                .GroupBy(m => m.ErrorMessage!)
                .Select(g => new FailureReason
                {
                    ErrorMessage = g.Key,
                    Count = g.Count(),
                    Percentage = Math.Round((g.Count() / (double)failedMetrics.Count) * 100, 2)
                })
                .OrderByDescending(f => f.Count)
                .Take(5)
                .ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Get recent failures
    /// </summary>
    [HttpGet("failures")]
    [ProducesResponseType(typeof(List<FailureReportResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FailureReportResponse>>> GetFailures(
        [FromQuery] string? engine = null,
        [FromQuery] int limit = 50)
    {
        _logger.LogInformation("Fetching failures (engine: {Engine}, limit: {Limit})", engine ?? "all", limit);

        var query = _context.Set<ProcessingMetrics>()
            .Include(m => m.Revision)
            .Where(m => !m.Success);

        if (!string.IsNullOrEmpty(engine))
            query = query.Where(m => m.ProcessingEngine == engine);

        var failures = await query
            .OrderByDescending(m => m.StartedAt)
            .Take(limit)
            .Select(m => new FailureReportResponse
            {
                MetricId = m.Id,
                RevisionId = m.RevisionId,
                ProcessingEngine = m.ProcessingEngine,
                IfcFileName = m.FileName,
                FileSizeMb = Math.Round(m.FileSizeBytes / (1024.0 * 1024.0), 2),
                ErrorMessage = m.ErrorMessage ?? "Unknown error",
                ErrorStackTrace = m.ErrorStackTrace,
                StartedAt = m.StartedAt,
                CompletedAt = m.CompletedAt,
                TotalProcessingTimeMs = m.TotalProcessingTimeMs
            })
            .ToListAsync();

        return Ok(failures);
    }

    /// <summary>
    /// Get processing logs for a revision
    /// </summary>
    [HttpGet("revisions/{revisionId}/logs")]
    [ProducesResponseType(typeof(List<ProcessingLogResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProcessingLogResponse>>> GetLogs(
        int revisionId,
        [FromQuery] string? logLevel = null)
    {
        _logger.LogInformation("Fetching logs for revision {RevisionId}", revisionId);

        var query = _context.Set<ProcessingLog>()
            .Where(l => l.RevisionId == revisionId);

        if (!string.IsNullOrEmpty(logLevel))
            query = query.Where(l => l.LogLevel == logLevel);

        var logs = await query
            .OrderBy(l => l.Timestamp)
            .Select(l => new ProcessingLogResponse
            {
                Id = l.Id,
                RevisionId = l.RevisionId,
                ProcessingEngine = l.ProcessingEngine,
                LogLevel = l.LogLevel,
                Message = l.Message,
                Exception = l.Exception,
                Timestamp = l.Timestamp
            })
            .ToListAsync();

        // Parse AdditionalData if needed
        var fullLogs = await _context.Set<ProcessingLog>()
            .Where(l => l.RevisionId == revisionId)
            .ToListAsync();

        for (int i = 0; i < logs.Count && i < fullLogs.Count; i++)
        {
            if (!string.IsNullOrEmpty(fullLogs[i].AdditionalData))
            {
                try
                {
                    logs[i].AdditionalData = JsonSerializer.Deserialize<Dictionary<string, object>>(fullLogs[i].AdditionalData);
                }
                catch
                {
                    // Ignore deserialization errors
                }
            }
        }

        return Ok(logs);
    }

    /// <summary>
    /// Get performance metrics by file size range
    /// </summary>
    [HttpGet("performance-by-file-size")]
    [ProducesResponseType(typeof(List<PerformanceByFileSizeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PerformanceByFileSizeResponse>>> GetPerformanceByFileSize()
    {
        _logger.LogInformation("Fetching performance by file size");

        var metrics = await _context.Set<ProcessingMetrics>()
            .Where(m => m.Success)
            .ToListAsync();

        var grouped = metrics
            .GroupBy(m => new
            {
                Engine = m.ProcessingEngine,
                Range = GetFileSizeRange(m.FileSizeBytes)
            })
            .Select(g => new PerformanceByFileSizeResponse
            {
                ProcessingEngine = g.Key.Engine,
                FileSizeRange = g.Key.Range,
                JobCount = g.Count(),
                AvgProcessingTimeMs = (int?)g.Average(m => m.TotalProcessingTimeMs),
                AvgElementCount = (int?)g.Where(m => m.TotalElementCount.HasValue).Average(m => m.TotalElementCount),
                MsPerElement = g.Where(m => m.TotalElementCount.HasValue && m.TotalProcessingTimeMs.HasValue).Any()
                    ? g.Where(m => m.TotalElementCount.HasValue && m.TotalProcessingTimeMs.HasValue)
                        .Average(m => m.TotalProcessingTimeMs!.Value / (double)m.TotalElementCount!.Value)
                    : null
            })
            .OrderBy(r => r.ProcessingEngine)
            .ThenBy(r => r.FileSizeRange)
            .ToList();

        return Ok(grouped);
    }

    /// <summary>
    /// Export metrics to CSV
    /// </summary>
    [HttpGet("export/csv")]
    [Produces("text/csv")]
    public async Task<IActionResult> ExportMetricsCsv(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        _logger.LogInformation("Exporting metrics to CSV");

        var query = _context.Set<ProcessingMetrics>().AsQueryable();

        if (startDate.HasValue)
            query = query.Where(m => m.StartedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(m => m.StartedAt <= endDate.Value);

        var metrics = await query.OrderBy(m => m.StartedAt).ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("RevisionId,Engine,FileName,FileSizeMB,Success,TotalTimeMs,ParseTimeMs,ElementExtractionTimeMs,SpatialTreeTimeMs,GltfExportTimeMs,TotalElements,WarningCount,StartedAt,CompletedAt");

        foreach (var m in metrics)
        {
            csv.AppendLine($"{m.RevisionId},{m.ProcessingEngine},{m.FileName},{Math.Round(m.FileSizeBytes / (1024.0 * 1024.0), 2)},{m.Success},{m.TotalProcessingTimeMs},{m.ParseTimeMs},{m.ElementExtractionTimeMs},{m.SpatialTreeTimeMs},{m.GltfExportTimeMs},{m.TotalElementCount},{m.WarningCount},{m.StartedAt:yyyy-MM-dd HH:mm:ss},{m.CompletedAt:yyyy-MM-dd HH:mm:ss}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"metrics-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");
    }

    // Helper methods

    private ProcessingMetricsResponse MapToResponse(ProcessingMetrics metrics)
    {
        return new ProcessingMetricsResponse
        {
            Id = metrics.Id,
            RevisionId = metrics.RevisionId,
            ProcessingEngine = metrics.ProcessingEngine,
            FileSizeBytes = metrics.FileSizeBytes,
            FileName = metrics.FileName,
            Timings = new TimingMetrics
            {
                TotalProcessingTimeMs = metrics.TotalProcessingTimeMs,
                ParseTimeMs = metrics.ParseTimeMs,
                ElementExtractionTimeMs = metrics.ElementExtractionTimeMs,
                SpatialTreeTimeMs = metrics.SpatialTreeTimeMs,
                GltfExportTimeMs = metrics.GltfExportTimeMs
            },
            Elements = new ElementStatistics
            {
                TotalElementCount = metrics.TotalElementCount ?? 0,
                IfcWallCount = metrics.IfcWallCount,
                IfcSlabCount = metrics.IfcSlabCount,
                IfcBeamCount = metrics.IfcBeamCount,
                IfcColumnCount = metrics.IfcColumnCount,
                IfcDoorCount = metrics.IfcDoorCount,
                IfcWindowCount = metrics.IfcWindowCount,
                IfcStairCount = metrics.IfcStairCount,
                IfcRailingCount = metrics.IfcRailingCount,
                IfcRoofCount = metrics.IfcRoofCount,
                IfcCoveringCount = metrics.IfcCoveringCount,
                IfcFurnishingCount = metrics.IfcFurnishingCount,
                IfcSpaceCount = metrics.IfcSpaceCount,
                OtherElementCount = metrics.OtherElementCount
            },
            Properties = new PropertyStatistics
            {
                TotalPropertySets = metrics.TotalPropertySets,
                TotalProperties = metrics.TotalProperties,
                TotalQuantities = metrics.TotalQuantities
            },
            Outputs = new OutputStatistics
            {
                GltfFileSizeBytes = metrics.GltfFileSizeBytes,
                SpatialTreeDepth = metrics.SpatialTreeDepth,
                SpatialTreeNodeCount = metrics.SpatialTreeNodeCount
            },
            Resources = new ResourceMetrics
            {
                PeakMemoryMb = metrics.PeakMemoryMb,
                CpuTimeMs = metrics.CpuTimeMs
            },
            Success = metrics.Success,
            ErrorMessage = metrics.ErrorMessage,
            WarningCount = metrics.WarningCount,
            StartedAt = metrics.StartedAt,
            CompletedAt = metrics.CompletedAt
        };
    }

    private ComparisonSummary GenerateComparisonSummary(ProcessingMetrics? ifcOpenShell, ProcessingMetrics? xbim)
    {
        var summary = new ComparisonSummary();

        // Speed comparison
        if (ifcOpenShell?.TotalProcessingTimeMs != null && xbim?.TotalProcessingTimeMs != null)
        {
            var ifcTime = ifcOpenShell.TotalProcessingTimeMs.Value;
            var xbimTime = xbim.TotalProcessingTimeMs.Value;

            if (ifcTime < xbimTime)
            {
                summary.FasterEngine = "IfcOpenShell";
                summary.SpeedDifferenceMs = xbimTime - ifcTime;
                summary.SpeedDifferencePercent = Math.Round(((xbimTime - ifcTime) / (double)ifcTime) * 100, 2);
                summary.SpeedSummary = $"IfcOpenShell is {summary.SpeedDifferencePercent}% faster ({summary.SpeedDifferenceMs}ms faster)";
            }
            else if (xbimTime < ifcTime)
            {
                summary.FasterEngine = "Xbim";
                summary.SpeedDifferenceMs = ifcTime - xbimTime;
                summary.SpeedDifferencePercent = Math.Round(((ifcTime - xbimTime) / (double)xbimTime) * 100, 2);
                summary.SpeedSummary = $"XBIM is {summary.SpeedDifferencePercent}% faster ({summary.SpeedDifferenceMs}ms faster)";
            }
            else
            {
                summary.SpeedSummary = "Both engines have identical processing times";
            }
        }

        // Element count comparison
        if (ifcOpenShell?.TotalElementCount != null && xbim?.TotalElementCount != null)
        {
            var ifcCount = ifcOpenShell.TotalElementCount.Value;
            var xbimCount = xbim.TotalElementCount.Value;

            summary.ElementCountsMatch = ifcCount == xbimCount;
            summary.ElementCountDifference = Math.Abs(ifcCount - xbimCount);

            if (summary.ElementCountsMatch)
            {
                summary.ElementCountSummary = $"Both engines extracted {ifcCount} elements";
            }
            else
            {
                summary.ElementCountSummary = $"Element count mismatch: IfcOpenShell={ifcCount}, XBIM={xbimCount} (difference: {summary.ElementCountDifference})";
            }
        }

        // Reliability comparison
        if (ifcOpenShell != null && xbim != null)
        {
            if (ifcOpenShell.WarningCount < xbim.WarningCount)
            {
                summary.MoreReliableEngine = "IfcOpenShell";
                summary.WarningDifference = xbim.WarningCount - ifcOpenShell.WarningCount;
                summary.ReliabilitySummary = $"IfcOpenShell had {summary.WarningDifference} fewer warnings";
            }
            else if (xbim.WarningCount < ifcOpenShell.WarningCount)
            {
                summary.MoreReliableEngine = "Xbim";
                summary.WarningDifference = ifcOpenShell.WarningCount - xbim.WarningCount;
                summary.ReliabilitySummary = $"XBIM had {summary.WarningDifference} fewer warnings";
            }
            else
            {
                summary.ReliabilitySummary = "Both engines had the same number of warnings";
            }
        }

        // glTF size comparison
        if (ifcOpenShell?.GltfFileSizeBytes != null && xbim?.GltfFileSizeBytes != null)
        {
            var ifcSize = ifcOpenShell.GltfFileSizeBytes.Value;
            var xbimSize = xbim.GltfFileSizeBytes.Value;

            if (ifcSize < xbimSize)
            {
                summary.SmallerGltfEngine = "IfcOpenShell";
                summary.GltfSizeDifferenceBytes = xbimSize - ifcSize;
                summary.GltfSizeSummary = $"IfcOpenShell generated smaller glTF ({summary.GltfSizeDifferenceMb:F2} MB smaller)";
            }
            else if (xbimSize < ifcSize)
            {
                summary.SmallerGltfEngine = "Xbim";
                summary.GltfSizeDifferenceBytes = ifcSize - xbimSize;
                summary.GltfSizeSummary = $"XBIM generated smaller glTF ({summary.GltfSizeDifferenceMb:F2} MB smaller)";
            }
        }

        // Overall recommendation
        if (summary.FasterEngine != null && summary.ElementCountsMatch)
        {
            summary.Recommendation = $"Recommendation: Use {summary.FasterEngine} for better performance with identical results";
        }
        else if (!summary.ElementCountsMatch)
        {
            summary.Recommendation = "Warning: Element counts don't match. Further investigation recommended.";
        }

        return summary;
    }

    private string GetFileSizeRange(long bytes)
    {
        var mb = bytes / (1024.0 * 1024.0);
        return mb switch
        {
            < 1 => "< 1 MB",
            < 10 => "1-10 MB",
            < 50 => "10-50 MB",
            < 100 => "50-100 MB",
            _ => "> 100 MB"
        };
    }
}
