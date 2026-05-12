using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StockPro.Auth.Models;

namespace StockPro.Auth.Data;

public class AuthDbContext : IdentityDbContext<ApplicationUser>
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Seed default roles
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().HasData(
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "1", Name = "ADMIN", NormalizedName = "ADMIN" },
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "2", Name = "INVENTORY MANAGER", NormalizedName = "INVENTORY MANAGER" },
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "4", Name = "STAFF", NormalizedName = "STAFF" }
        );

        // AuditLog → AspNetUsers FK
        builder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditId);
            entity.Property(e => e.AuditId).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.EntityName).HasMaxLength(100);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
