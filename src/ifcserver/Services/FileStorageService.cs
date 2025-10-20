using System.Security.Cryptography;
using System.Text;

namespace ifcserver.Services;

/// <summary>
/// Directory-based file storage service for IFC and glTF files
/// </summary>
public class FileStorageService : IFileStorageService
{
    private readonly string _baseStoragePath;
    private readonly ILogger<FileStorageService> _logger;

    private const string IFC_FOLDER = "ifc-models";
    private const string GLTF_FOLDER = "gltf-models";

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _logger = logger;

        // Get storage path from configuration or use default
        _baseStoragePath = configuration["FileStorage:BasePath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "storage");

        // Ensure base directory exists
        Directory.CreateDirectory(_baseStoragePath);
        Directory.CreateDirectory(Path.Combine(_baseStoragePath, IFC_FOLDER));
        Directory.CreateDirectory(Path.Combine(_baseStoragePath, GLTF_FOLDER));

        _logger.LogInformation("File storage initialized at: {Path}", _baseStoragePath);
    }

    public async Task<string> SaveIfcFileAsync(Stream stream, string fileName)
    {
        // Create year/month subfolder structure
        var now = DateTime.UtcNow;
        var relativePath = Path.Combine(
            IFC_FOLDER,
            now.Year.ToString(),
            now.Month.ToString("D2"),
            $"{Guid.NewGuid()}{Path.GetExtension(fileName)}"
        );

        var fullPath = GetFullPath(relativePath);

        // Ensure directory exists
        var directory = Path.GetDirectoryName(fullPath);
        if (directory != null)
        {
            Directory.CreateDirectory(directory);
        }

        // Save file
        using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
        {
            await stream.CopyToAsync(fileStream);
        }

        _logger.LogInformation("Saved IFC file to: {Path}", relativePath);
        return relativePath;
    }

    public async Task<string> SaveGltfFileAsync(string sourceFilePath, string originalIfcFileName)
    {
        // Create year/month subfolder structure
        var now = DateTime.UtcNow;
        var extension = Path.GetExtension(sourceFilePath); // .glb or .gltf
        var relativePath = Path.Combine(
            GLTF_FOLDER,
            now.Year.ToString(),
            now.Month.ToString("D2"),
            $"{Guid.NewGuid()}{extension}"
        );

        var fullPath = GetFullPath(relativePath);

        // Ensure directory exists
        var directory = Path.GetDirectoryName(fullPath);
        if (directory != null)
        {
            Directory.CreateDirectory(directory);
        }

        // Copy file
        File.Copy(sourceFilePath, fullPath, overwrite: true);

        _logger.LogInformation("Saved glTF file to: {Path}", relativePath);
        return relativePath;
    }

    public string GetFullPath(string relativePath)
    {
        return Path.Combine(_baseStoragePath, relativePath);
    }

    public bool FileExists(string relativePath)
    {
        var fullPath = GetFullPath(relativePath);
        return File.Exists(fullPath);
    }

    public async Task DeleteFileAsync(string relativePath)
    {
        var fullPath = GetFullPath(relativePath);

        if (File.Exists(fullPath))
        {
            await Task.Run(() => File.Delete(fullPath));
            _logger.LogInformation("Deleted file: {Path}", relativePath);
        }
    }

    public long GetFileSize(string relativePath)
    {
        var fullPath = GetFullPath(relativePath);

        if (!File.Exists(fullPath))
        {
            return 0;
        }

        var fileInfo = new FileInfo(fullPath);
        return fileInfo.Length;
    }

    public async Task<string> CalculateFileHashAsync(Stream stream)
    {
        using var sha256 = SHA256.Create();

        // Reset stream position if possible
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        var hashBytes = await sha256.ComputeHashAsync(stream);

        // Reset stream position for subsequent reads
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        // Convert to hex string
        var sb = new StringBuilder();
        foreach (var b in hashBytes)
        {
            sb.Append(b.ToString("x2"));
        }

        return sb.ToString();
    }
}
