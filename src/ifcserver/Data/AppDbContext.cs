using Microsoft.EntityFrameworkCore;
using ifcserver.Models;

namespace ifcserver.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // New schema: Projects and Revisions
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Revision> Revisions => Set<Revision>();
    public DbSet<IfcElement> IfcElements => Set<IfcElement>();
    public DbSet<SpatialTree> SpatialTrees => Set<SpatialTree>();

    // Metrics and Logging
    public DbSet<ProcessingMetrics> ProcessingMetrics => Set<ProcessingMetrics>();
    public DbSet<ProcessingLog> ProcessingLogs => Set<ProcessingLog>();

    // Legacy models (deprecated, will be removed)
    public DbSet<ConversionJob> ConversionJobs => Set<ConversionJob>();
    public DbSet<IfcModel> IfcModels => Set<IfcModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ============================================================
        // Configure Projects
        // ============================================================
        modelBuilder.Entity<Project>()
            .HasIndex(p => p.Name)
            .HasDatabaseName("IX_Projects_Name");

        modelBuilder.Entity<Project>()
            .HasMany(p => p.Revisions)
            .WithOne(r => r.Project)
            .HasForeignKey(r => r.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // ============================================================
        // Configure Revisions
        // ============================================================
        modelBuilder.Entity<Revision>()
            .HasIndex(r => new { r.ProjectId, r.IsActive })
            .HasDatabaseName("IX_Revisions_ProjectId_IsActive");

        modelBuilder.Entity<Revision>()
            .HasIndex(r => r.VersionIdentifier)
            .HasDatabaseName("IX_Revisions_VersionIdentifier");

        modelBuilder.Entity<Revision>()
            .HasIndex(r => r.ProcessingStatus)
            .HasDatabaseName("IX_Revisions_ProcessingStatus");

        // Unique constraint on ProjectId + SequenceNumber
        modelBuilder.Entity<Revision>()
            .HasIndex(r => new { r.ProjectId, r.SequenceNumber })
            .IsUnique()
            .HasDatabaseName("UQ_Revisions_ProjectId_SequenceNumber");

        // Unique constraint on ProjectId + VersionIdentifier
        modelBuilder.Entity<Revision>()
            .HasIndex(r => new { r.ProjectId, r.VersionIdentifier })
            .IsUnique()
            .HasDatabaseName("UQ_Revisions_ProjectId_VersionIdentifier");

        // Relationships
        modelBuilder.Entity<Revision>()
            .HasMany(r => r.Elements)
            .WithOne(e => e.Revision)
            .HasForeignKey(e => e.RevisionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Revision>()
            .HasOne(r => r.SpatialTree)
            .WithOne(s => s.Revision)
            .HasForeignKey<SpatialTree>(s => s.RevisionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ============================================================
        // Configure IfcElements (updated for RevisionId)
        // ============================================================
        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.RevisionId)
            .HasDatabaseName("IX_IfcElements_RevisionId");

        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => new { e.RevisionId, e.GlobalId })
            .IsUnique()
            .HasDatabaseName("UQ_IfcElements_RevisionId_GlobalId");

        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.ElementType)
            .HasDatabaseName("IX_IfcElements_ElementType");

        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.GlobalId)
            .HasDatabaseName("IX_IfcElements_GlobalId");

        // GIN index for JSONB properties
        modelBuilder.Entity<IfcElement>()
            .HasIndex(e => e.PropertiesJson)
            .HasDatabaseName("IX_IfcElements_PropertiesJson")
            .HasMethod("gin");

        // ============================================================
        // Configure SpatialTrees
        // ============================================================
        modelBuilder.Entity<SpatialTree>()
            .HasIndex(s => s.RevisionId)
            .IsUnique()
            .HasDatabaseName("UQ_SpatialTrees_RevisionId");

        // GIN index for JSONB tree
        modelBuilder.Entity<SpatialTree>()
            .HasIndex(s => s.TreeJson)
            .HasDatabaseName("IX_SpatialTrees_TreeJson")
            .HasMethod("gin");

        // ============================================================
        // Configure ProcessingMetrics
        // ============================================================
        modelBuilder.Entity<ProcessingMetrics>()
            .HasIndex(m => m.RevisionId)
            .IsUnique()
            .HasDatabaseName("UQ_ProcessingMetrics_RevisionId");

        modelBuilder.Entity<ProcessingMetrics>()
            .HasIndex(m => m.ProcessingEngine)
            .HasDatabaseName("IX_ProcessingMetrics_Engine");

        modelBuilder.Entity<ProcessingMetrics>()
            .HasIndex(m => m.Success)
            .HasDatabaseName("IX_ProcessingMetrics_Success");

        modelBuilder.Entity<ProcessingMetrics>()
            .HasIndex(m => m.StartedAt)
            .HasDatabaseName("IX_ProcessingMetrics_StartedAt");

        modelBuilder.Entity<ProcessingMetrics>()
            .HasIndex(m => m.TotalProcessingTimeMs)
            .HasDatabaseName("IX_ProcessingMetrics_TotalProcessingTimeMs");

        modelBuilder.Entity<ProcessingMetrics>()
            .HasIndex(m => m.FileSizeBytes)
            .HasDatabaseName("IX_ProcessingMetrics_FileSizeBytes");

        // Relationship
        modelBuilder.Entity<ProcessingMetrics>()
            .HasOne(m => m.Revision)
            .WithOne()
            .HasForeignKey<ProcessingMetrics>(m => m.RevisionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ============================================================
        // Configure ProcessingLogs
        // ============================================================
        modelBuilder.Entity<ProcessingLog>()
            .HasIndex(l => l.RevisionId)
            .HasDatabaseName("IX_ProcessingLogs_RevisionId");

        modelBuilder.Entity<ProcessingLog>()
            .HasIndex(l => l.ProcessingEngine)
            .HasDatabaseName("IX_ProcessingLogs_Engine");

        modelBuilder.Entity<ProcessingLog>()
            .HasIndex(l => l.LogLevel)
            .HasDatabaseName("IX_ProcessingLogs_LogLevel");

        modelBuilder.Entity<ProcessingLog>()
            .HasIndex(l => l.Timestamp)
            .HasDatabaseName("IX_ProcessingLogs_Timestamp");

        // GIN index for JSONB additional data
        modelBuilder.Entity<ProcessingLog>()
            .HasIndex(l => l.AdditionalData)
            .HasDatabaseName("IX_ProcessingLogs_AdditionalData")
            .HasMethod("gin");

        // Relationship
        modelBuilder.Entity<ProcessingLog>()
            .HasOne(l => l.Revision)
            .WithMany()
            .HasForeignKey(l => l.RevisionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ============================================================
        // Legacy model configurations (deprecated)
        // ============================================================
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
    }
}
