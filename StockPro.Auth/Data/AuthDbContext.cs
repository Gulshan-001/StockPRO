using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StockPro.Auth.Models;

namespace StockPro.Auth.Data;

public class AuthDbContext : IdentityDbContext<ApplicationUser>
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Seed default roles
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().HasData(
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "1", Name = "ADMIN", NormalizedName = "ADMIN" },
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "2", Name = "MANAGER", NormalizedName = "MANAGER" },
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "3", Name = "OFFICER", NormalizedName = "OFFICER" },
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "4", Name = "STAFF", NormalizedName = "STAFF" }
        );
    }
}
