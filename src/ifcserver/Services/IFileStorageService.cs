namespace ifcserver.Services;

/// <summary>
/// Service for managing file storage operations
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Save an uploaded IFC file to storage
    /// </summary>
    /// <param name="stream">File content stream</param>
    /// <param name="fileName">Original filename</param>
    /// <returns>Relative path to stored file</returns>
    Task<string> SaveIfcFileAsync(Stream stream, string fileName);

    /// <summary>
    /// Save a generated glTF/GLB file to storage
    /// </summary>
    /// <param name="sourceFilePath">Path to source glTF file</param>
    /// <param name="originalIfcFileName">Original IFC filename for reference</param>
    /// <returns>Relative path to stored file</returns>
    Task<string> SaveGltfFileAsync(string sourceFilePath, string originalIfcFileName);

    /// <summary>
    /// Get full physical path for a stored file
    /// </summary>
    /// <param name="relativePath">Relative path from database</param>
    /// <returns>Full physical path</returns>
    string GetFullPath(string relativePath);

    /// <summary>
    /// Check if a file exists in storage
    /// </summary>
    /// <param name="relativePath">Relative path from database</param>
    /// <returns>True if file exists</returns>
    bool FileExists(string relativePath);

    /// <summary>
    /// Delete a file from storage
    /// </summary>
    /// <param name="relativePath">Relative path from database</param>
    Task DeleteFileAsync(string relativePath);

    /// <summary>
    /// Get file size in bytes
    /// </summary>
    /// <param name="relativePath">Relative path from database</param>
    /// <returns>File size in bytes</returns>
    long GetFileSize(string relativePath);

    /// <summary>
    /// Calculate SHA256 hash of a file
    /// </summary>
    /// <param name="stream">File stream</param>
    /// <returns>SHA256 hash as hex string</returns>
    Task<string> CalculateFileHashAsync(Stream stream);
}
