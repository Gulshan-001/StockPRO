using Microsoft.EntityFrameworkCore;
using StockPro.Alert.Models;

namespace StockPro.Alert.Data;

public class AlertDbContext : DbContext
{
    public AlertDbContext(DbContextOptions<AlertDbContext> options) : base(options) { }

    public DbSet<Models.Alert> Alerts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Efficient query for unread alerts per user
        modelBuilder.Entity<Models.Alert>()
            .HasIndex(a => new { a.RecipientId, a.IsAcknowledged });

        // Efficient duplicate check
        modelBuilder.Entity<Models.Alert>()
            .HasIndex(a => new { a.Type, a.RelatedProductId, a.RelatedWarehouseId, a.IsAcknowledged });
    }
}
