using ifcserver.Data;
using ifcserver.Models;
using Microsoft.EntityFrameworkCore;

namespace ifcserver.Services;

/// <summary>
/// Implementation of IProcessingMetricsCollector that stores metrics in the database
/// </summary>
public class ProcessingMetricsCollector : IProcessingMetricsCollector
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProcessingMetricsCollector> _logger;

    public ProcessingMetricsCollector(
        IServiceProvider serviceProvider,
        ILogger<ProcessingMetricsCollector> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public MetricsSession StartSession(int revisionId, string engine, string fileName, long fileSizeBytes)
    {
        var session = new MetricsSession
        {
            RevisionId = revisionId,
            Engine = engine,
            FileName = fileName,
            FileSizeBytes = fileSizeBytes
        };

        _logger.LogInformation(
            "[{Engine}] [{RevisionId}] Started metrics session for {FileName} ({FileSizeMb:F2} MB)",
            engine,
            revisionId,
            fileName,
            fileSizeBytes / (1024.0 * 1024.0));

        return session;
    }

    public async Task RecordSuccessAsync(MetricsSession session)
    {
        session.TotalTimer.Stop();

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var metrics = new ProcessingMetrics
        {
            RevisionId = session.RevisionId,
            ProcessingEngine = session.Engine,
            FileSizeBytes = session.FileSizeBytes,
            FileName = session.FileName,

            // Timings - prefer Python timings if available, otherwise use Stopwatch
            TotalProcessingTimeMs = (int)session.TotalTimer.ElapsedMilliseconds,
            ParseTimeMs = session.PythonParseMs ??
                (session.ParseTimer.IsRunning || session.ParseTimer.ElapsedMilliseconds > 0
                    ? (int)session.ParseTimer.ElapsedMilliseconds
                    : null),
            ElementExtractionTimeMs = session.PythonElementExtractionMs ??
                (session.ElementExtractionTimer.IsRunning || session.ElementExtractionTimer.ElapsedMilliseconds > 0
                    ? (int)session.ElementExtractionTimer.ElapsedMilliseconds
                    : null),
            SpatialTreeTimeMs = session.PythonSpatialTreeMs ??
                (session.SpatialTreeTimer.IsRunning || session.SpatialTreeTimer.ElapsedMilliseconds > 0
                    ? (int)session.SpatialTreeTimer.ElapsedMilliseconds
                    : null),
            GltfExportTimeMs = session.PythonGltfExportMs ??
                (session.GltfExportTimer.IsRunning || session.GltfExportTimer.ElapsedMilliseconds > 0
                    ? (int)session.GltfExportTimer.ElapsedMilliseconds
                    : null),

            // Element counts
            TotalElementCount = session.GetTotalElementCount(),
            IfcWallCount = session.GetIfcTypeCount("IfcWall"),
            IfcSlabCount = session.GetIfcTypeCount("IfcSlab"),
            IfcBeamCount = session.GetIfcTypeCount("IfcBeam"),
            IfcColumnCount = session.GetIfcTypeCount("IfcColumn"),
            IfcDoorCount = session.GetIfcTypeCount("IfcDoor"),
            IfcWindowCount = session.GetIfcTypeCount("IfcWindow"),
            IfcStairCount = session.GetIfcTypeCount("IfcStair"),
            IfcRailingCount = session.GetIfcTypeCount("IfcRailing"),
            IfcRoofCount = session.GetIfcTypeCount("IfcRoof"),
            IfcCoveringCount = session.GetIfcTypeCount("IfcCovering"),
            IfcFurnishingCount = session.GetIfcTypeCount("IfcFurnishing"),
            IfcSpaceCount = session.GetIfcTypeCount("IfcSpace"),
            OtherElementCount = session.GetOtherElementCount(),

            // Property statistics
            TotalPropertySets = session.TotalPropertySets,
            TotalProperties = session.TotalProperties,
            TotalQuantities = session.TotalQuantities,

            // Output statistics
            GltfFileSizeBytes = session.GltfFileSizeBytes,
            SpatialTreeDepth = session.SpatialTreeDepth,
            SpatialTreeNodeCount = session.SpatialTreeNodeCount,

            // Resource usage
            PeakMemoryMb = session.PeakMemoryMb,

            // Success
            Success = true,
            WarningCount = session.WarningCount,
            CompletedAt = DateTime.UtcNow
        };

        context.Set<ProcessingMetrics>().Add(metrics);
        await context.SaveChangesAsync();

        _logger.LogInformation(
            "[{Engine}] [{RevisionId}] Recorded successful processing: {TotalMs}ms, {ElementCount} elements, {WarningCount} warnings",
            session.Engine,
            session.RevisionId,
            metrics.TotalProcessingTimeMs,
            metrics.TotalElementCount,
            metrics.WarningCount);
    }

    public async Task RecordFailureAsync(MetricsSession session, Exception ex)
    {
        session.TotalTimer.Stop();

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var metrics = new ProcessingMetrics
        {
            RevisionId = session.RevisionId,
            ProcessingEngine = session.Engine,
            FileSizeBytes = session.FileSizeBytes,
            FileName = session.FileName,

            // Timings (may be partial)
            TotalProcessingTimeMs = (int)session.TotalTimer.ElapsedMilliseconds,
            ParseTimeMs = session.ParseTimer.ElapsedMilliseconds > 0
                ? (int)session.ParseTimer.ElapsedMilliseconds
                : null,
            ElementExtractionTimeMs = session.ElementExtractionTimer.ElapsedMilliseconds > 0
                ? (int)session.ElementExtractionTimer.ElapsedMilliseconds
                : null,
            SpatialTreeTimeMs = session.SpatialTreeTimer.ElapsedMilliseconds > 0
                ? (int)session.SpatialTreeTimer.ElapsedMilliseconds
                : null,
            GltfExportTimeMs = session.GltfExportTimer.ElapsedMilliseconds > 0
                ? (int)session.GltfExportTimer.ElapsedMilliseconds
                : null,

            // Element counts (may be partial)
            TotalElementCount = session.GetTotalElementCount(),

            // Failure information
            Success = false,
            ErrorMessage = ex.Message,
            ErrorStackTrace = ex.StackTrace,
            WarningCount = session.WarningCount,
            CompletedAt = DateTime.UtcNow
        };

        context.Set<ProcessingMetrics>().Add(metrics);
        await context.SaveChangesAsync();

        _logger.LogError(
            ex,
            "[{Engine}] [{RevisionId}] Recorded failed processing after {TotalMs}ms: {ErrorMessage}",
            session.Engine,
            session.RevisionId,
            metrics.TotalProcessingTimeMs,
            ex.Message);
    }

    public async Task LogAsync(int revisionId, string engine, string level, string message, object? additionalData = null)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var log = new ProcessingLog
        {
            RevisionId = revisionId,
            ProcessingEngine = engine,
            LogLevel = level,
            Message = message
        };

        if (additionalData != null)
        {
            log.SetAdditionalData(additionalData);
        }

        context.Set<ProcessingLog>().Add(log);
        await context.SaveChangesAsync();
    }
}
