using Microsoft.EntityFrameworkCore;
using ifcserver.Models;

namespace ifcserver.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ConversionJob> ConversionJobs => Set<ConversionJob>();
    public DbSet<IfcModel> IfcModels => Set<IfcModel>();
    public DbSet<IfcElement> IfcElements => Set<IfcElement>();

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

        modelBuilder.Entity<IfcModel>()
            .HasIndex(m => m.ConversionStatus)
            .HasDatabaseName("IX_IfcModels_ConversionStatus");

        // Configure IfcElement indexes for fast element queries
        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.ModelId)
            .HasDatabaseName("IX_IfcElements_ModelId");

        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => new { e.ModelId, e.GlobalId })
            .IsUnique()
            .HasDatabaseName("IX_IfcElements_ModelId_GlobalId");

        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.ElementType)
            .HasDatabaseName("IX_IfcElements_ElementType");

        // GIN index for JSONB properties - enables fast JSON queries
        // Note: This is created via raw SQL since EF Core doesn't have built-in support
        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.PropertiesJson)
            .HasDatabaseName("IX_IfcElements_PropertiesJson")
            .HasMethod("gin");
    }
}
