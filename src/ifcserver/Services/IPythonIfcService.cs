using ifcserver.Models;

namespace ifcserver.Services
{
    /// <summary>
    /// Service interface for Python-based IFC intelligence operations.
    /// </summary>
    public interface IPythonIfcService
    {
        /// <summary>
        /// Parses an IFC file and extracts metadata using Python IfcOpenShell.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>IfcMetadata object with project info and entity counts</returns>
        Task<IfcMetadata> ParseIfcFileAsync(string ifcFilePath);

        /// <summary>
        /// Exports an IFC file to glTF/GLB format using Python IfcConvert.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="outputPath">Absolute path for the output glTF/GLB file</param>
        /// <param name="options">Export options (format, use-names, etc.)</param>
        /// <returns>GltfExportResult with success status and file info</returns>
        Task<GltfExportResult> ExportGltfAsync(string ifcFilePath, string outputPath, GltfExportOptions? options = null);

        /// <summary>
        /// Extracts properties from an IFC element by GlobalId using Python IfcOpenShell.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="elementGuid">GlobalId (GUID) of the element</param>
        /// <returns>IfcElementProperties object with property data</returns>
        Task<IfcElementProperties> ExtractPropertiesAsync(string ifcFilePath, string elementGuid);

        /// <summary>
        /// Extracts spatial hierarchy tree from an IFC file using Python IfcOpenShell.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <param name="flat">If true, returns flat list instead of tree structure</param>
        /// <returns>SpatialNode tree or SpatialElementsList (if flat=true)</returns>
        Task<object> ExtractSpatialTreeAsync(string ifcFilePath, bool flat = false);

        /// <summary>
        /// Extracts all element properties from an IFC file in bulk using Python IfcOpenShell.
        /// This is used during upload to populate the IfcElements table for fast property queries.
        /// </summary>
        /// <param name="ifcFilePath">Absolute path to the IFC file</param>
        /// <returns>List of IfcElement objects with properties</returns>
        Task<List<IfcElement>> ExtractAllElementsAsync(string ifcFilePath);
    }
}
