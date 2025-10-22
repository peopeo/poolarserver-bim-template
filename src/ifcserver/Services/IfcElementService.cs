using System.Text.Json;
using ifcserver.Data;
using ifcserver.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ifcserver.Services;

/// <summary>
/// Service for querying IFC element properties from the database.
/// This provides fast property retrieval by querying cached data instead of parsing IFC files.
/// Uses memory caching to avoid repeated database queries for the same elements.
/// </summary>
public class IfcElementService : IIfcElementService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<IfcElementService> _logger;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    public IfcElementService(AppDbContext dbContext, ILogger<IfcElementService> logger, IMemoryCache cache)
    {
        _dbContext = dbContext;
        _logger = logger;
        _cache = cache;
    }

    /// <summary>
    /// Get element properties by revision ID and global ID.
    /// Returns properties in the same format as the Python property extractor.
    /// Uses memory caching to avoid repeated database queries.
    /// </summary>
    public async Task<object?> GetElementPropertiesAsync(int revisionId, string globalId)
    {
        // Create cache key combining revision ID and global ID
        var cacheKey = $"element_props_{revisionId}_{globalId}";

        // Try to get from cache first
        if (_cache.TryGetValue(cacheKey, out object? cachedProperties))
        {
            _logger.LogDebug($"Cache hit for element: RevisionId={revisionId}, GlobalId={globalId}");
            return cachedProperties;
        }

        try
        {
            _logger.LogDebug($"Cache miss for element: RevisionId={revisionId}, GlobalId={globalId}, querying database");

            var element = await _dbContext.IfcElements
                .Where(e => e.RevisionId == revisionId && e.GlobalId == globalId)
                .FirstOrDefaultAsync();

            if (element == null)
            {
                _logger.LogWarning($"Element not found: RevisionId={revisionId}, GlobalId={globalId}");
                return null;
            }

            // Parse the stored JSON properties
            var properties = JsonSerializer.Deserialize<Dictionary<string, object>>(element.PropertiesJson);

            // Return in the format expected by the frontend
            var result = new
            {
                global_id = element.GlobalId,
                element_type = element.ElementType,
                name = element.Name,
                description = element.Description,
                property_sets = GetPropertySection(properties, "property_sets"),
                quantities = GetPropertySection(properties, "quantities"),
                type_properties = GetPropertySection(properties, "type_properties")
            };

            // Cache the result
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(CacheDuration)
                .SetSize(1); // Each entry counts as 1 unit

            _cache.Set(cacheKey, result, cacheOptions);
            _logger.LogDebug($"Cached element properties: RevisionId={revisionId}, GlobalId={globalId}");

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving element properties: RevisionId={revisionId}, GlobalId={globalId}");
            throw;
        }
    }

    /// <summary>
    /// Get all elements for a specific model
    /// </summary>
    public async Task<List<IfcElement>> GetModelElementsAsync(int modelId)
    {
        return await _dbContext.IfcElements
            .Where(e => e.RevisionId == modelId)
            .OrderBy(e => e.ElementType)
            .ThenBy(e => e.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Get elements by type for a specific model
    /// </summary>
    public async Task<List<IfcElement>> GetElementsByTypeAsync(int modelId, string elementType)
    {
        return await _dbContext.IfcElements
            .Where(e => e.RevisionId == modelId && e.ElementType == elementType)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Get element count for a specific model
    /// </summary>
    public async Task<int> GetElementCountAsync(int modelId)
    {
        return await _dbContext.IfcElements
            .Where(e => e.RevisionId == modelId)
            .CountAsync();
    }

    /// <summary>
    /// Store multiple elements in the database
    /// </summary>
    public async Task StoreElementsAsync(int modelId, List<IfcElement> elements)
    {
        try
        {
            // Delete existing elements for this model
            await DeleteModelElementsAsync(modelId);

            // Defensive: Deduplicate by GlobalId in case the Python extractor returns duplicates
            // Note: Python script was fixed to not return duplicates, but this is a safety measure
            // Keep first occurrence of each GlobalId
            var uniqueElements = elements
                .GroupBy(e => e.GlobalId)
                .Select(g => g.First())
                .ToList();

            var duplicateCount = elements.Count - uniqueElements.Count;
            if (duplicateCount > 0)
            {
                _logger.LogWarning($"Found {duplicateCount} duplicate GlobalIds from Python extractor for revision {modelId} - this should not happen! Keeping {uniqueElements.Count} unique elements.");
            }

            // Add unique elements
            await _dbContext.IfcElements.AddRangeAsync(uniqueElements);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation($"Stored {uniqueElements.Count} elements for revision {modelId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error storing elements for revision {modelId}");
            throw;
        }
    }

    /// <summary>
    /// Delete all elements for a specific model
    /// </summary>
    public async Task DeleteModelElementsAsync(int modelId)
    {
        try
        {
            var elements = await _dbContext.IfcElements
                .Where(e => e.RevisionId == modelId)
                .ToListAsync();

            if (elements.Any())
            {
                // Invalidate cache for all deleted elements
                foreach (var element in elements)
                {
                    var cacheKey = $"element_props_{modelId}_{element.GlobalId}";
                    _cache.Remove(cacheKey);
                }

                _dbContext.IfcElements.RemoveRange(elements);
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Deleted {elements.Count} elements for model {modelId} and invalidated cache");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting elements for model {modelId}");
            throw;
        }
    }

    /// <summary>
    /// Helper method to safely extract a property section from the JSON
    /// </summary>
    private static Dictionary<string, object> GetPropertySection(Dictionary<string, object>? properties, string section)
    {
        if (properties == null || !properties.ContainsKey(section))
        {
            return new Dictionary<string, object>();
        }

        try
        {
            // Handle JsonElement from deserialization
            var value = properties[section];
            if (value is JsonElement jsonElement)
            {
                return JsonSerializer.Deserialize<Dictionary<string, object>>(jsonElement.GetRawText())
                    ?? new Dictionary<string, object>();
            }

            return value as Dictionary<string, object> ?? new Dictionary<string, object>();
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }
}
