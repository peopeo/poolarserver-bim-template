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
