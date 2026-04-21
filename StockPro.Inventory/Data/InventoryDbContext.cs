using Microsoft.EntityFrameworkCore;
using StockPro.Inventory.Models;

namespace StockPro.Inventory.Data
{
    public class InventoryDbContext : DbContext
    {
        public InventoryDbContext(DbContextOptions<InventoryDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasIndex(e => e.SKU).IsUnique();
                entity.HasIndex(e => e.Barcode).IsUnique();
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.Brand);

                // Ensure CostPrice <= SellingPrice validation is done at logic level, 
                // but we can add a check constraint if desired (PG specific):
                entity.ToTable(t => t.HasCheckConstraint("CK_Product_Pricing", "\"CostPrice\" <= \"SellingPrice\""));
            });
        }
    }
}
