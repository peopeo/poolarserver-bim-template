namespace ifcserver.Services
{
    public interface IIfcService
    {
        /// <summary>
        /// Converts an IFC file to another format (e.g., glTF).
        /// </summary>
        /// <param name="inputPath">The source IFC file path.</param>
        /// <param name="outputPath">The destination output file path.</param>
        /// <returns>Conversion log or success message.</returns>
        Task<string> ConvertIfcAsync(string inputPath, string outputPath);
    }
}
