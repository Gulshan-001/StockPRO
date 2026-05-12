using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StockPro.ProductItem.Data;
using StockPro.ProductItem.Services;

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

builder.Services.AddDbContext<ProductDbContext>(options =>
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
builder.Services.AddScoped<IProductService, ProductService>();

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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StockPro Product/Item API",
        Version = "v1",
        Description = "Product/Item-Service for StockPro (Compliance with UC2)"
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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AngularFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Auto-migrate on startup ─────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProductDbContext>();
    try {
        db.Database.Migrate();
    } catch (Exception ex) {
        Console.WriteLine($"Migration failed: {ex.Message}");
    }
}

app.Run();
