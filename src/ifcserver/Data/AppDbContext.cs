using Microsoft.EntityFrameworkCore;
using ifcserver.Models;

namespace ifcserver.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ConversionJob> ConversionJobs => Set<ConversionJob>();
    public DbSet<IfcModel> IfcModels => Set<IfcModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure IfcModel indexes for better query performance
        modelBuilder.Entity<IfcModel>()
            .HasIndex(m => m.FileHash)
            .HasDatabaseName("IX_IfcModels_FileHash");

        modelBuilder.Entity<IfcModel>()
            .HasIndex(m => m.UploadedAt)
            .HasDatabaseName("IX_IfcModels_UploadedAt");

        modelBuilder.Entity<IfcModel>()
            .HasIndex(m => m.ProjectName)
            .HasDatabaseName("IX_IfcModels_ProjectName");

        modelBuilder.Entity<IfcModel>()
            .HasIndex(m => m.Schema)
            .HasDatabaseName("IX_IfcModels_Schema");
    }
}
