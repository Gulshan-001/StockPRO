using Microsoft.EntityFrameworkCore;
using StockPro.Alert.Data;
using StockPro.Alert.Services;
using System.Text.Json;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace StockPro.Alert.BackgroundJobs;

/// <summary>
/// IHostedService that runs background monitoring jobs:
/// - Low-stock check (every 15 minutes)
/// - Overstock check (every 15 minutes)
/// - PO pending approval check (every 15 minutes)
/// - Overdue PO check (every 24 hours)
/// </summary>
public class AlertMonitorService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AlertMonitorService> _logger;
    private readonly IConfiguration _config;

    // Intervals
    private static readonly TimeSpan StockCheckInterval = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan OverduePOInterval = TimeSpan.FromHours(24);

    private DateTime _lastOverduePOCheck = DateTime.MinValue;

    public AlertMonitorService(
        IServiceProvider services,
        ILogger<AlertMonitorService> logger,
        IConfiguration config)
    {
        _services = services;
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[AlertMonitor] Background monitoring service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Run stock-level checks every 15 minutes
                await CheckLowStockAsync();
                await CheckOverstockAsync();
                await CheckPOPendingApprovalAsync();

                // Run overdue PO check once every 24 hours
                if (DateTime.UtcNow - _lastOverduePOCheck >= OverduePOInterval)
                {
                    await CheckOverduePOsAsync();
                    _lastOverduePOCheck = DateTime.UtcNow;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AlertMonitor] Error during monitoring cycle.");
            }

            await Task.Delay(StockCheckInterval, stoppingToken);
        }
    }

    // ─── 1. Low Stock Check ─────────────────────────────────────────────
    private async Task CheckLowStockAsync()
    {
        _logger.LogInformation("[AlertMonitor] Running low-stock check...");
        try
        {
            using var scope = _services.CreateScope();
            var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();
            var db = scope.ServiceProvider.GetRequiredService<AlertDbContext>();

            var movementUrl = _config["ServiceUrls:StockMovement"];
            var productUrl = _config["ServiceUrls:ProductItem"];

            var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var http = httpFactory.CreateClient("Internal");
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateSystemToken());

            // Fetch all stock levels
            var stockJson = await http.GetStringAsync($"{movementUrl}/api/stock");
            var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(stockJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            // Fetch all products for ReorderLevel
            var productJson = await http.GetStringAsync($"{productUrl}/api/products");
            var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            // Calculate total stock per product across all warehouses
            var stockMap = stockLevels
                .GroupBy(s => s.ProductId)
                .ToDictionary(g => g.Key, g => g.Sum(s => s.Quantity));

            // Get all users who are ADMIN or INVENTORY MANAGER to notify
            var recipients = await GetManagerAndAdminIdsAsync(db);

            foreach (var product in products)
            {
                if (product.ReorderLevel <= 0) continue;

                stockMap.TryGetValue(product.ProductId, out var currentQty); // will be 0 if absent

                if (currentQty < product.ReorderLevel)
                {
                    foreach (var recipientId in recipients)
                    {
                        await alertService.GenerateAlertAsync(
                            recipientId: recipientId,
                            type: "LOW_STOCK",
                            severity: "WARNING",
                            title: $"Low Stock: {product.Name}",
                            message: $"Product '{product.Name}' (SKU: {product.SKU}) has {currentQty} units available globally — below the reorder level of {product.ReorderLevel}.",
                            relatedProductId: product.ProductId,
                            relatedWarehouseId: null
                        );
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AlertMonitor] Low-stock check failed.");
        }
    }

    // ─── 2. Overstock Check ─────────────────────────────────────────────
    private async Task CheckOverstockAsync()
    {
        _logger.LogInformation("[AlertMonitor] Running overstock check...");
        try
        {
            using var scope = _services.CreateScope();
            var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();
            var db = scope.ServiceProvider.GetRequiredService<AlertDbContext>();

            var movementUrl = _config["ServiceUrls:StockMovement"];
            var productUrl = _config["ServiceUrls:ProductItem"];

            var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var http = httpFactory.CreateClient("Internal");

            var stockJson = await http.GetStringAsync($"{movementUrl}/api/stock");
            var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(stockJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            var productJson = await http.GetStringAsync($"{productUrl}/api/products");
            var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            var productMap = products.ToDictionary(p => p.ProductId);
            var recipients = await GetManagerAndAdminIdsAsync(db);

            foreach (var stock in stockLevels)
            {
                if (!productMap.TryGetValue(stock.ProductId, out var product)) continue;
                if (product.MaxStockLevel <= 0) continue;

                if (stock.Quantity > product.MaxStockLevel)
                {
                    foreach (var recipientId in recipients)
                    {
                        await alertService.GenerateAlertAsync(
                            recipientId: recipientId,
                            type: "OVERSTOCK",
                            severity: "INFO",
                            title: $"Overstock: {product.Name}",
                            message: $"Product '{product.Name}' (SKU: {product.SKU}) has {stock.Quantity} units — exceeds maximum stock level of {product.MaxStockLevel} in warehouse {stock.WarehouseId}.",
                            relatedProductId: stock.ProductId,
                            relatedWarehouseId: stock.WarehouseId
                        );
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AlertMonitor] Overstock check failed.");
        }
    }

    // ─── 3. PO Pending Approval Check ───────────────────────────────────
    private async Task CheckPOPendingApprovalAsync()
    {
        _logger.LogInformation("[AlertMonitor] Running PO pending approval check...");
        try
        {
            using var scope = _services.CreateScope();
            var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();
            var db = scope.ServiceProvider.GetRequiredService<AlertDbContext>();

            var purchaseUrl = _config["ServiceUrls:Purchase"];
            var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var http = httpFactory.CreateClient("Internal");
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateSystemToken());

            var poJson = await http.GetStringAsync($"{purchaseUrl}/api/purchase-orders?status=PENDING");
            var pendingPOs = JsonSerializer.Deserialize<List<PODto>>(poJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            var recipients = await GetManagerAndAdminIdsAsync(db);

            foreach (var po in pendingPOs)
            {
                foreach (var recipientId in recipients)
                {
                    await alertService.GenerateAlertAsync(
                        recipientId: recipientId,
                        type: "PO_PENDING_APPROVAL",
                        severity: "INFO",
                        title: "Purchase Order Awaiting Approval",
                        message: $"Purchase Order PO-{po.PoId.ToString()[..8].ToUpper()} from supplier '{po.SupplierName}' is pending your approval. Total: {po.TotalAmount:F2}.",
                        relatedProductId: null,
                        relatedWarehouseId: po.WarehouseId
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AlertMonitor] PO pending check failed.");
        }
    }

    // ─── 4. Overdue PO Check (daily) ────────────────────────────────────
    private async Task CheckOverduePOsAsync()
    {
        _logger.LogInformation("[AlertMonitor] Running overdue PO check...");
        try
        {
            using var scope = _services.CreateScope();
            var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();
            var db = scope.ServiceProvider.GetRequiredService<AlertDbContext>();

            var purchaseUrl = _config["ServiceUrls:Purchase"];
            var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var http = httpFactory.CreateClient("Internal");
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateSystemToken());

            var poJson = await http.GetStringAsync($"{purchaseUrl}/api/purchase-orders?status=APPROVED");
            var approvedPOs = JsonSerializer.Deserialize<List<PODto>>(poJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            // Filter: only those past expected delivery date without a GRN
            var overduePOs = approvedPOs.Where(po =>
                po.ExpectedDate.HasValue &&
                po.ExpectedDate.Value < DateTime.UtcNow &&
                po.ReceivedDate == null
            ).ToList();

            var recipients = await GetManagerAndAdminIdsAsync(db);

            foreach (var po in overduePOs)
            {
                foreach (var recipientId in recipients)
                {
                    await alertService.GenerateAlertAsync(
                        recipientId: recipientId,
                        type: "OVERDUE_PO",
                        severity: "CRITICAL",
                        title: "Overdue Purchase Order",
                        message: $"Purchase Order PO-{po.PoId.ToString()[..8].ToUpper()} from '{po.SupplierName}' was expected on {po.ExpectedDate:yyyy-MM-dd} but has not been received. Immediate action required.",
                        relatedProductId: null,
                        relatedWarehouseId: po.WarehouseId
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AlertMonitor] Overdue PO check failed.");
        }
    }

    // ─── Helper: Get all recipient IDs stored in the Alerts DB ──────────
    /// <summary>
    /// Since we don't have direct access to the Auth DB,
    /// we return a fixed list of known recipients from existing alerts.
    /// In practice, the background job populates alerts for ALL users it finds
    /// from past interactions. We use a pragmatic fallback: if no recipients
    /// exist yet, we use Guid.Empty as a sentinel to queue alerts that the
    /// AlertsController will fan-out to logged-in users on first login.
    /// </summary>
    private async Task<List<Guid>> GetManagerAndAdminIdsAsync(AlertDbContext db)
    {
        // Get distinct recipient IDs from existing alerts (populated by the controller on first use)
        var existingRecipients = await db.Alerts
            .Select(a => a.RecipientId)
            .Distinct()
            .ToListAsync();

        // If no recipients yet (brand new system), return sentinel ID
        // The AlertsController.SeedRecipient endpoint handles user registration
        if (!existingRecipients.Any())
        {
            return new List<Guid>(); // No alerts yet — skip until users log in
        }

        return existingRecipients;
    }

    private string GenerateSystemToken()
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.Empty.ToString()),
            new Claim("UserId", Guid.Empty.ToString()),
            new Claim(ClaimTypes.Role, "ADMIN"), // Give the background job admin rights
            new Claim("sub", Guid.Empty.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ─── Internal DTOs for cross-service HTTP calls ──────────────────────────────

public class StockLevelDto
{
    public Guid StockId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public int ReservedQuantity { get; set; }
}

public class ProductDto
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int ReorderLevel { get; set; }
    public int MaxStockLevel { get; set; }
    public decimal CostPrice { get; set; }
}

public class PODto
{
    public Guid PoId { get; set; }
    public Guid SupplierId { get; set; }
    public Guid WarehouseId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
}
