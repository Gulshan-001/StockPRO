using Microsoft.EntityFrameworkCore;
using StockPro.StockMovement.Models;

namespace StockPro.StockMovement.Data
{
    public class InventoryDbContext : DbContext
    {
        public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }

        public DbSet<StockLevel> StockLevels { get; set; }
        public DbSet<Models.StockMovement> StockMovements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<StockLevel>()
                .HasIndex(s => new { s.WarehouseId, s.ProductId })
                .IsUnique();

            modelBuilder.Entity<Models.StockMovement>()
                .Property(m => m.MovementType)
                .IsRequired();
        }
    }
}
