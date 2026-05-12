using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockPro.Analytics.BackgroundJobs;
using StockPro.Analytics.Data;
using StockPro.Analytics.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Database Configuration ──────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
if (builder.Environment.IsProduction() && 
    !connectionString.Contains("SSL Mode") && 
    !connectionString.Contains("sslmode") &&
    !connectionString.StartsWith("postgres://") && 
    !connectionString.StartsWith("postgresql://"))
{
    connectionString += ";SSL Mode=Require;Trust Server Certificate=true";
}

builder.Services.AddDbContext<AnalyticsDbContext>(options =>
    options.UseNpgsql(connectionString));

// ─── JWT Authentication (same secret as all other StockPro services) ─────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

// ─── Services DI ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IReportService, ReportServiceImpl>();

// ─── HTTP Clients for inter-service calls ─────────────────────────────────────
builder.Services.AddHttpClient("Internal");

// ─── Background Job (IHostedService) — daily snapshot at midnight UTC ─────────
builder.Services.AddHostedService<SnapshotBackgroundService>();

// ─── Controllers ──────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin for Render deployment
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AngularFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Auto-migrate on startup ──────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();
    try { db.Database.Migrate(); } catch { }
}

app.Run();
