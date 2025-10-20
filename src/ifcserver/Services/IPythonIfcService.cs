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
    }
}
