using Microsoft.EntityFrameworkCore;
using StockPro.Analytics.Models;

namespace StockPro.Analytics.Data;

public class AnalyticsDbContext : DbContext
{
    public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options) { }

    public DbSet<InventorySnapshot> Snapshots { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<InventorySnapshot>(entity =>
        {
            // Efficient per-warehouse date-range queries
            entity.HasIndex(s => new { s.WarehouseId, s.SnapshotDate });

            // Efficient per-product trend queries
            entity.HasIndex(s => new { s.ProductId, s.SnapshotDate });

            // Unique constraint: one snapshot record per product per warehouse per day
            entity.HasIndex(s => new { s.ProductId, s.WarehouseId, s.SnapshotDate })
                  .IsUnique();
        });
    }
}
