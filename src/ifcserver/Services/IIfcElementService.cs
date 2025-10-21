using ifcserver.Models;

namespace ifcserver.Services;

/// <summary>
/// Service for querying IFC element properties from the database
/// </summary>
public interface IIfcElementService
{
    /// <summary>
    /// Get element properties by model ID and global ID
    /// </summary>
    /// <param name="revisionId">IFC model ID</param>
    /// <param name="globalId">Element GlobalId (GUID)</param>
    /// <returns>Element properties, or null if not found</returns>
    Task<object?> GetElementPropertiesAsync(int revisionId, string globalId);

    /// <summary>
    /// Get all elements for a specific model
    /// </summary>
    /// <param name="revisionId">IFC model ID</param>
    /// <returns>List of elements</returns>
    Task<List<IfcElement>> GetModelElementsAsync(int revisionId);

    /// <summary>
    /// Get elements by type for a specific model
    /// </summary>
    /// <param name="revisionId">IFC model ID</param>
    /// <param name="elementType">Element type (e.g., "IfcWall")</param>
    /// <returns>List of elements</returns>
    Task<List<IfcElement>> GetElementsByTypeAsync(int revisionId, string elementType);

    /// <summary>
    /// Get element count for a specific model
    /// </summary>
    /// <param name="revisionId">IFC model ID</param>
    /// <returns>Number of elements</returns>
    Task<int> GetElementCountAsync(int revisionId);

    /// <summary>
    /// Store multiple elements in the database
    /// </summary>
    /// <param name="revisionId">IFC model ID</param>
    /// <param name="elements">List of elements to store</param>
    Task StoreElementsAsync(int revisionId, List<IfcElement> elements);

    /// <summary>
    /// Delete all elements for a specific model
    /// </summary>
    /// <param name="revisionId">IFC model ID</param>
    Task DeleteModelElementsAsync(int revisionId);
}
