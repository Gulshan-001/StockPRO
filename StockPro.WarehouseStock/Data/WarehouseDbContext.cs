using Microsoft.EntityFrameworkCore;
using StockPro.WarehouseStock.Models;

namespace StockPro.WarehouseStock.Data
{
    public class WarehouseDbContext : DbContext
    {
        public WarehouseDbContext(DbContextOptions<WarehouseDbContext> options) : base(options) { }

        public DbSet<Warehouse> Warehouses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // PostgreSQL compatibility: force lowercase table names
            modelBuilder.Entity<Warehouse>().ToTable("warehouses");

            // Product check is removed here because Product is in another database.
            // Referential integrity for ProductId is now logical, not physical.
        }
    }
}
