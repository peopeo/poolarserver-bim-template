using ifcserver.Data;
using ifcserver.Models;

namespace ifcserver.Services
{
    public class IfcService : IIfcService
    {
        private readonly AppDbContext _context;

        public IfcService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> ConvertIfcAsync(string inputPath, string outputPath)
        {
            // Create a new conversion job entry in the database
            var job = new ConversionJob
            {
                InputPath = inputPath,
                OutputPath = outputPath,
                Type = "xkt",
                CreatedAt = DateTime.UtcNow,
                Status = "running"
            };

            _context.ConversionJobs.Add(job);
            await _context.SaveChangesAsync();

            try
            {
                // Run ifcconvert via ProcessRunner
                string args = $"{inputPath} {outputPath}";
                string result = await ProcessRunner.RunProcessAsync("ifcconvert", args);

                job.Status = "done";
                await _context.SaveChangesAsync();

                return $"✅ Conversion job {job.Id} completed successfully.\n\nOutput:\n{result}";
            }
            catch (Exception ex)
            {
                job.Status = "error";
                job.Error = ex.Message;
                await _context.SaveChangesAsync();

                return $"❌ Conversion job {job.Id} failed: {ex.Message}";
            }
        }
    }
}
