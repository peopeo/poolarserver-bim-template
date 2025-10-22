namespace ifcserver.Services;

/// <summary>
/// Helper class for structured logging during IFC processing.
/// Logs to both the standard ILogger and the ProcessingLogs database table.
/// </summary>
public class ProcessingLogger
{
    private readonly IProcessingMetricsCollector _metricsCollector;
    private readonly ILogger<ProcessingLogger> _logger;

    public ProcessingLogger(IProcessingMetricsCollector metricsCollector, ILogger<ProcessingLogger> logger)
    {
        _metricsCollector = metricsCollector;
        _logger = logger;
    }

    /// <summary>
    /// Log a debug message
    /// </summary>
    public async Task DebugAsync(int revisionId, string engine, string message, object? data = null)
    {
        _logger.LogDebug("[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        await _metricsCollector.LogAsync(revisionId, engine, "Debug", message, data);
    }

    /// <summary>
    /// Log an informational message
    /// </summary>
    public async Task InfoAsync(int revisionId, string engine, string message, object? data = null)
    {
        _logger.LogInformation("[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        await _metricsCollector.LogAsync(revisionId, engine, "Info", message, data);
    }

    /// <summary>
    /// Log a warning message
    /// </summary>
    public async Task WarningAsync(int revisionId, string engine, string message, object? data = null)
    {
        _logger.LogWarning("[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        await _metricsCollector.LogAsync(revisionId, engine, "Warning", message, data);
    }

    /// <summary>
    /// Log an error message with exception
    /// </summary>
    public async Task ErrorAsync(int revisionId, string engine, string message, Exception? ex = null, object? data = null)
    {
        if (ex != null)
        {
            _logger.LogError(ex, "[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        }
        else
        {
            _logger.LogError("[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        }

        var logData = new { Exception = ex?.ToString(), Data = data };
        await _metricsCollector.LogAsync(revisionId, engine, "Error", message, logData);
    }

    /// <summary>
    /// Log a critical error message with exception
    /// </summary>
    public async Task CriticalAsync(int revisionId, string engine, string message, Exception? ex = null, object? data = null)
    {
        if (ex != null)
        {
            _logger.LogCritical(ex, "[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        }
        else
        {
            _logger.LogCritical("[{Engine}] [{RevisionId}] {Message}", engine, revisionId, message);
        }

        var logData = new { Exception = ex?.ToString(), Data = data };
        await _metricsCollector.LogAsync(revisionId, engine, "Critical", message, logData);
    }

    /// <summary>
    /// Log processing stage timing
    /// </summary>
    public async Task LogTimingAsync(int revisionId, string engine, string stage, long elapsedMs)
    {
        var message = $"{stage} completed in {elapsedMs}ms";
        await InfoAsync(revisionId, engine, message, new { Stage = stage, ElapsedMs = elapsedMs });
    }

    /// <summary>
    /// Log element statistics
    /// </summary>
    public async Task LogElementStatsAsync(
        int revisionId,
        string engine,
        int totalElements,
        Dictionary<string, int>? elementCounts = null)
    {
        var message = $"Extracted {totalElements} elements";
        await InfoAsync(revisionId, engine, message, new
        {
            TotalElements = totalElements,
            ElementCounts = elementCounts
        });
    }

    /// <summary>
    /// Log property statistics
    /// </summary>
    public async Task LogPropertyStatsAsync(
        int revisionId,
        string engine,
        int propertySetCount,
        int propertyCount,
        int quantityCount)
    {
        var message = $"Extracted {propertySetCount} property sets, {propertyCount} properties, {quantityCount} quantities";
        await InfoAsync(revisionId, engine, message, new
        {
            PropertySets = propertySetCount,
            Properties = propertyCount,
            Quantities = quantityCount
        });
    }

    /// <summary>
    /// Log file size information
    /// </summary>
    public async Task LogFileSizeAsync(int revisionId, string engine, string fileType, long sizeBytes)
    {
        var sizeMb = sizeBytes / (1024.0 * 1024.0);
        var message = $"{fileType} file size: {sizeMb:F2} MB";
        await InfoAsync(revisionId, engine, message, new
        {
            FileType = fileType,
            SizeBytes = sizeBytes,
            SizeMb = sizeMb
        });
    }
}
