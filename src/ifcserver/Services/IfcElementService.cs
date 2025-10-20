using System.Text.Json;
using ifcserver.Data;
using ifcserver.Models;
using Microsoft.EntityFrameworkCore;

namespace ifcserver.Services;

/// <summary>
/// Service for querying IFC element properties from the database.
/// This provides fast property retrieval by querying cached data instead of parsing IFC files.
/// </summary>
public class IfcElementService : IIfcElementService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<IfcElementService> _logger;

    public IfcElementService(AppDbContext dbContext, ILogger<IfcElementService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get element properties by model ID and global ID.
    /// Returns properties in the same format as the Python property extractor.
    /// </summary>
    public async Task<object?> GetElementPropertiesAsync(int modelId, string globalId)
    {
        try
        {
            var element = await _dbContext.IfcElements
                .Where(e => e.ModelId == modelId && e.GlobalId == globalId)
                .FirstOrDefaultAsync();

            if (element == null)
            {
                _logger.LogWarning($"Element not found: ModelId={modelId}, GlobalId={globalId}");
                return null;
            }

            // Parse the stored JSON properties
            var properties = JsonSerializer.Deserialize<Dictionary<string, object>>(element.PropertiesJson);

            // Return in the format expected by the frontend
            return new
            {
                global_id = element.GlobalId,
                element_type = element.ElementType,
                name = element.Name,
                description = element.Description,
                property_sets = GetPropertySection(properties, "property_sets"),
                quantities = GetPropertySection(properties, "quantities"),
                type_properties = GetPropertySection(properties, "type_properties")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving element properties: ModelId={modelId}, GlobalId={globalId}");
            throw;
        }
    }

    /// <summary>
    /// Get all elements for a specific model
    /// </summary>
    public async Task<List<IfcElement>> GetModelElementsAsync(int modelId)
    {
        return await _dbContext.IfcElements
            .Where(e => e.ModelId == modelId)
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
            .Where(e => e.ModelId == modelId && e.ElementType == elementType)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Get element count for a specific model
    /// </summary>
    public async Task<int> GetElementCountAsync(int modelId)
    {
        return await _dbContext.IfcElements
            .Where(e => e.ModelId == modelId)
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

            // Add new elements
            await _dbContext.IfcElements.AddRangeAsync(elements);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation($"Stored {elements.Count} elements for model {modelId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error storing elements for model {modelId}");
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
                .Where(e => e.ModelId == modelId)
                .ToListAsync();

            if (elements.Any())
            {
                _dbContext.IfcElements.RemoveRange(elements);
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Deleted {elements.Count} elements for model {modelId}");
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
