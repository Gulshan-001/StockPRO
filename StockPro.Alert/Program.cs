using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockPro.Alert.BackgroundJobs;
using StockPro.Alert.Data;
using StockPro.Alert.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ────────────────────────────────────────────────────────
builder.Services.AddDbContext<AlertDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT Authentication (same secret as all other services) ─────────
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
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ─── Services DI ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAlertService, AlertServiceImpl>();

// ─── HTTP Clients for inter-service calls ─────────────────────────────
builder.Services.AddHttpClient("Internal");

// ─── Background Job (IHostedService) ─────────────────────────────────
builder.Services.AddHostedService<AlertMonitorService>();

// ─── Controllers ─────────────────────────────────────────────────────
builder.Services.AddControllers();

// ─── CORS ────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
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

// ─── Auto-migrate on startup ─────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AlertDbContext>();
    try { db.Database.Migrate(); } catch { }
}

app.Run();
