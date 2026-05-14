using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StockPro.WarehouseStock.Data;
using StockPro.WarehouseStock.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Database Configuration ──────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(databaseUrl) && (databaseUrl.StartsWith("postgres") || databaseUrl.StartsWith("postgresql")))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var user = userInfo[0];
    var pass = userInfo.Length > 1 ? userInfo[1] : "";
    var host = uri.Host;
    var port = uri.Port == -1 ? 5432 : uri.Port;
    var database = uri.AbsolutePath.TrimStart('/');
    
    connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
}
else if (builder.Environment.IsProduction() && !connectionString.Contains("SSL Mode"))
{
    connectionString += ";SSL Mode=Require;Trust Server Certificate=true";
}

builder.Services.AddDbContext<WarehouseDbContext>(options =>
    options.UseNpgsql(connectionString));

// ─── JWT Authentication ───────────────────────────────────────────
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

// ─── Services DI ────────────────────────────────────────────────────
builder.Services.AddScoped<IWarehouseService, WarehouseService>();

// ─── CORS ───────────────────────────────────────────────────────────
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

// ─── Controllers + Swagger ──────────────────────────────────────────
builder.Services.AddRouting(options => options.LowercaseUrls = true);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StockPro Warehouse/Stock API",
        Version = "v1",
        Description = "Warehouse and Stock Level Management System for StockPro (Compliance with UC3)"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ─── Middleware Pipeline ─────────────────────────────────────────────
app.UseCors("AngularFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Auto-migrate on startup ─────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WarehouseDbContext>();
    try {
        var host = connectionString?.Split(';').FirstOrDefault(x => x.Trim().StartsWith("Host="))?.Split('=')[1] ?? "unknown";
        Console.WriteLine($"Starting database migration on host: {host}...");
        db.Database.Migrate();
        Console.WriteLine("Database migration completed successfully.");
    } catch (Exception ex) {
        Console.WriteLine($"FATAL: Database migration failed: {ex.Message}");
        if (ex.InnerException != null) 
            Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
        
        // In production, we want the app to crash if migrations fail 
        // so Render knows the deployment failed.
        if (app.Environment.IsProduction()) throw; 
    }
}

app.Run();
