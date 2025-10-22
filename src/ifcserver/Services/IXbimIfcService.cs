using ifcserver.Models;

namespace ifcserver.Services;

/// <summary>
/// Service interface for XBIM Toolkit-based IFC processing operations.
/// Provides the same functionality as IPythonIfcService but using XBIM Toolkit (C#).
/// </summary>
public interface IXbimIfcService
{
    /// <summary>
    /// Parses an IFC file and extracts metadata using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <returns>IfcMetadata object with project info and entity counts</returns>
    Task<IfcMetadata> ParseIfcFileAsync(string ifcFilePath);

    /// <summary>
    /// Exports an IFC file to glTF/GLB format using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <param name="outputPath">Absolute path for the output glTF/GLB file</param>
    /// <param name="options">Export options (format, use-names, etc.)</param>
    /// <returns>GltfExportResult with success status and file info</returns>
    Task<GltfExportResult> ExportGltfAsync(string ifcFilePath, string outputPath, GltfExportOptions? options = null);

    /// <summary>
    /// Extracts properties from an IFC element by GlobalId using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <param name="elementGuid">GlobalId (GUID) of the element</param>
    /// <returns>IfcElementProperties object with property data</returns>
    Task<IfcElementProperties> ExtractPropertiesAsync(string ifcFilePath, string elementGuid);

    /// <summary>
    /// Extracts spatial hierarchy tree from an IFC file using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <param name="flat">If true, returns flat list instead of tree structure</param>
    /// <returns>SpatialNode tree or SpatialElementsList (if flat=true)</returns>
    Task<object> ExtractSpatialTreeAsync(string ifcFilePath, bool flat = false);

    /// <summary>
    /// Extracts all element properties from an IFC file in bulk using XBIM Toolkit.
    /// This is used during upload to populate the IfcElements table for fast property queries.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <returns>List of IfcElement objects with properties</returns>
    Task<List<IfcElement>> ExtractAllElementsAsync(string ifcFilePath);

    /// <summary>
    /// Extracts all elements with metrics tracking using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <param name="session">Optional metrics session for tracking performance</param>
    /// <returns>Tuple of elements list and XbimMetrics</returns>
    Task<(List<IfcElement> elements, XbimMetrics metrics)> ExtractAllElementsWithMetricsAsync(
        string ifcFilePath,
        MetricsSession? session = null);

    /// <summary>
    /// Exports glTF with metrics tracking using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <param name="outputPath">Absolute path for the output glTF/GLB file</param>
    /// <param name="options">Export options</param>
    /// <returns>Tuple of GltfExportResult and XbimMetrics</returns>
    Task<(GltfExportResult result, XbimMetrics metrics)> ExportGltfWithMetricsAsync(
        string ifcFilePath,
        string outputPath,
        GltfExportOptions? options = null);

    /// <summary>
    /// Extracts spatial tree with metrics tracking using XBIM Toolkit.
    /// </summary>
    /// <param name="ifcFilePath">Absolute path to the IFC file</param>
    /// <returns>Tuple of SpatialNode tree and XbimMetrics</returns>
    Task<(SpatialNode tree, XbimMetrics metrics)> ExtractSpatialTreeWithMetricsAsync(string ifcFilePath);
}

/// <summary>
/// Metrics collected during XBIM processing operations.
/// </summary>
public class XbimMetrics
{
    public XbimTimings Timings { get; set; } = new();
    public XbimStatistics Statistics { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
}

/// <summary>
/// Timing information for XBIM processing stages.
/// </summary>
public class XbimTimings
{
    public int? ParseMs { get; set; }
    public int? ElementExtractionMs { get; set; }
    public int? SpatialTreeMs { get; set; }
    public int? GltfExportMs { get; set; }
    public int? TotalMs { get; set; }
}

/// <summary>
/// Statistics collected during XBIM processing.
/// </summary>
public class XbimStatistics
{
    public int? TotalElements { get; set; }
    public Dictionary<string, int>? ElementTypeCounts { get; set; }
    public int? TotalPropertySets { get; set; }
    public int? TotalProperties { get; set; }
    public int? TotalQuantities { get; set; }
    public int? TreeDepth { get; set; }
    public int? NodeCount { get; set; }
    public long? GltfFileSizeBytes { get; set; }
}
