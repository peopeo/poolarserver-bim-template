using Microsoft.EntityFrameworkCore;
using ifcserver.Models;

namespace ifcserver.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ConversionJob> ConversionJobs => Set<ConversionJob>();
}
