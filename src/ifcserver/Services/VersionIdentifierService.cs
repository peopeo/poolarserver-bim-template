using ifcserver.Data;
using Microsoft.EntityFrameworkCore;

namespace ifcserver.Services;

/// <summary>
/// Service for generating version identifiers for revisions
/// Format: v{sequenceNumber}_{YYYY-MM-DD_HH-mm-ss}
/// Example: v1_2025-10-21_14-30-45
/// </summary>
public class VersionIdentifierService
{
    private readonly AppDbContext _context;

    public VersionIdentifierService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Generate a new version identifier for a project
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <returns>Tuple of (VersionIdentifier, SequenceNumber)</returns>
    public async Task<(string versionIdentifier, int sequenceNumber)> GenerateVersionIdentifierAsync(int projectId)
    {
        // Get the latest sequence number for this project
        var latestSequenceNumber = await _context.Revisions
            .Where(r => r.ProjectId == projectId)
            .Select(r => r.SequenceNumber)
            .OrderByDescending(s => s)
            .FirstOrDefaultAsync();

        var newSequenceNumber = latestSequenceNumber + 1;

        // Generate timestamp in format: YYYY-MM-DD_HH-mm-ss
        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss");

        // Format: v{seq}_{timestamp}
        var versionIdentifier = $"v{newSequenceNumber}_{timestamp}";

        return (versionIdentifier, newSequenceNumber);
    }

    /// <summary>
    /// Parse a version identifier to extract sequence number and timestamp
    /// </summary>
    /// <param name="versionIdentifier">Version identifier to parse</param>
    /// <returns>Tuple of (SequenceNumber, Timestamp) or null if invalid</returns>
    public static (int sequenceNumber, DateTime? timestamp)? ParseVersionIdentifier(string versionIdentifier)
    {
        if (string.IsNullOrWhiteSpace(versionIdentifier))
            return null;

        // Expected format: v{seq}_{YYYY-MM-DD_HH-mm-ss}
        var parts = versionIdentifier.Split('_');
        if (parts.Length < 3) // Need at least v{seq}, date, time
            return null;

        // Extract sequence number from v{seq}
        if (!parts[0].StartsWith("v") || !int.TryParse(parts[0][1..], out var sequenceNumber))
            return null;

        // Try to parse timestamp
        var timestampStr = string.Join("_", parts[1..]).Replace("_", " ");
        if (DateTime.TryParse(timestampStr, out var timestamp))
        {
            return (sequenceNumber, timestamp);
        }

        return (sequenceNumber, null);
    }
}

/// <summary>
/// Interface for version identifier service (for dependency injection)
/// </summary>
public interface IVersionIdentifierService
{
    Task<(string versionIdentifier, int sequenceNumber)> GenerateVersionIdentifierAsync(int projectId);
}
