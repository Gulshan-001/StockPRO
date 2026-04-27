using Microsoft.EntityFrameworkCore;
using StockPro.Purchase.Models;

namespace StockPro.Purchase.Data;

public class PurchaseDbContext : DbContext
{
    public PurchaseDbContext(DbContextOptions<PurchaseDbContext> options) : base(options) { }

    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<POLineItem> POLineItems => Set<POLineItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Supplier
        modelBuilder.Entity<Supplier>(e =>
        {
            e.HasKey(s => s.SupplierId);
            e.Property(s => s.Name).IsRequired().HasMaxLength(200);
            e.Property(s => s.ContactPerson).HasMaxLength(150);
            e.Property(s => s.Email).IsRequired().HasMaxLength(150);
            e.HasIndex(s => s.Email).IsUnique();
            e.Property(s => s.Phone).HasMaxLength(20);
            e.Property(s => s.Address).HasMaxLength(255);
            e.Property(s => s.City).HasMaxLength(100);
            e.Property(s => s.Country).HasMaxLength(100);
            e.Property(s => s.PaymentTerms).HasMaxLength(50);
            e.Property(s => s.Rating).HasPrecision(3, 2);
        });

        // PurchaseOrder
        modelBuilder.Entity<PurchaseOrder>(e =>
        {
            e.HasKey(p => p.PoId);
            e.Property(p => p.Status).IsRequired().HasMaxLength(20);
            e.Property(p => p.TotalAmount).HasPrecision(18, 2);
            e.HasOne(p => p.Supplier)
             .WithMany(s => s.PurchaseOrders)
             .HasForeignKey(p => p.SupplierId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // POLineItem
        modelBuilder.Entity<POLineItem>(e =>
        {
            e.HasKey(l => l.LineItemId);
            e.Property(l => l.UnitCost).HasPrecision(18, 2);
            e.HasOne(l => l.PurchaseOrder)
             .WithMany(p => p.LineItems)
             .HasForeignKey(l => l.PoId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
