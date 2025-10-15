namespace ifcserver.Models;

public class ConversionJob
{
    public int Id { get; set; }
    public string InputPath { get; set; } = default!;
    public string OutputPath { get; set; } = default!;
    public string Type { get; set; } = "xkt"; // xkt|gltf
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "queued"; // queued|running|done|error
    public string? Error { get; set; }
}
