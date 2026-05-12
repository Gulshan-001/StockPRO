using Microsoft.EntityFrameworkCore;
using StockPro.Analytics.Data;
using StockPro.Analytics.DTOs;
using StockPro.Analytics.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

namespace StockPro.Analytics.Services;

/// <summary>
/// Implements all analytics and reporting operations.
/// Uses cross-service HTTP calls via IHttpClientFactory for live data
/// (Stock Movement, Warehouse/Stock, Product, Purchase services).
/// Falls back to live calculation when snapshot data is unavailable.
/// Case Study Section 4.8 — ReportServiceImpl.
/// </summary>
public class ReportServiceImpl : IReportService
{
    private readonly AnalyticsDbContext _db;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ReportServiceImpl> _logger;

    private static readonly JsonSerializerOptions _json =
        new() { PropertyNameCaseInsensitive = true };

    public ReportServiceImpl(
        AnalyticsDbContext db,
        IHttpClientFactory httpFactory,
        IConfiguration config,
        ILogger<ReportServiceImpl> logger)
    {
        _db = db;
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    // ─── TakeSnapshot ─────────────────────────────────────────────────────────
    public async Task<SnapshotResult> TakeSnapshotAsync(DateOnly? snapshotDate = null)
    {
        var date = snapshotDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        _logger.LogInformation("[Analytics] Taking inventory snapshot for {Date}", date);

        try
        {
            var http = CreateSystemHttpClient();
            var stockUrl = _config["ServiceUrls:StockMovement"];
            var productUrl = _config["ServiceUrls:ProductItem"];

            // Fetch all stock levels and products in parallel
            var stockTask = http.GetStringAsync($"{stockUrl}/api/stock");
            var productTask = http.GetStringAsync($"{productUrl}/api/products");
            await Task.WhenAll(stockTask, productTask);

            var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(await stockTask, _json) ?? new();
            var products = JsonSerializer.Deserialize<List<ProductDto>>(await productTask, _json) ?? new();

            var costMap = products.ToDictionary(p => p.ProductId, p => p.CostPrice);

            int written = 0;
            foreach (var stock in stockLevels)
            {
                if (!costMap.TryGetValue(stock.ProductId, out var costPrice)) continue;

                var stockValue = stock.Quantity * costPrice;

                // Upsert: if snapshot already exists for this product/warehouse/date, update it
                var existing = await _db.Snapshots.FirstOrDefaultAsync(s =>
                    s.ProductId == stock.ProductId &&
                    s.WarehouseId == stock.WarehouseId &&
                    s.SnapshotDate == date);

                if (existing != null)
                {
                    existing.Quantity = stock.Quantity;
                    existing.StockValue = stockValue;
                }
                else
                {
                    _db.Snapshots.Add(new InventorySnapshot
                    {
                        WarehouseId = stock.WarehouseId,
                        ProductId = stock.ProductId,
                        Quantity = stock.Quantity,
                        StockValue = stockValue,
                        SnapshotDate = date,
                        CreatedAt = DateTime.UtcNow
                    });
                    written++;
                }
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("[Analytics] Snapshot complete: {Count} records for {Date}", written, date);

            return new SnapshotResult
            {
                RecordsWritten = written,
                SnapshotDate = date,
                CreatedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Analytics] Snapshot failed for {Date}", date);
            throw;
        }
    }

    // ─── GetTotalStockValue ────────────────────────────────────────────────────
    public async Task<InventoryValueResult> GetTotalStockValueAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Try snapshot first
        var snapshotExists = await _db.Snapshots.AnyAsync(s => s.SnapshotDate == today);

        if (snapshotExists)
        {
            var totalValue = await _db.Snapshots
                .Where(s => s.SnapshotDate == today)
                .SumAsync(s => s.StockValue);

            var productCount = await _db.Snapshots
                .Where(s => s.SnapshotDate == today)
                .Select(s => s.ProductId)
                .Distinct()
                .CountAsync();

            var warehouseCount = await _db.Snapshots
                .Where(s => s.SnapshotDate == today)
                .Select(s => s.WarehouseId)
                .Distinct()
                .CountAsync();

            return new InventoryValueResult
            {
                TotalStockValue = totalValue,
                TotalProducts = productCount,
                TotalWarehouses = warehouseCount
            };
        }

        // Fallback: live calculation via cross-service calls
        _logger.LogWarning("[Analytics] No snapshot for today — falling back to live calculation.");
        return await GetLiveInventoryValueAsync();
    }

    private async Task<InventoryValueResult> GetLiveInventoryValueAsync()
    {
        var http = CreateSystemHttpClient();
        var stockUrl = _config["ServiceUrls:StockMovement"];
        var productUrl = _config["ServiceUrls:ProductItem"];

        var stockTask = http.GetStringAsync($"{stockUrl}/api/stock");
        var productTask = http.GetStringAsync($"{productUrl}/api/products");
        await Task.WhenAll(stockTask, productTask);

        var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(await stockTask, _json) ?? new();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(await productTask, _json) ?? new();

        var costMap = products.ToDictionary(p => p.ProductId, p => p.CostPrice);

        decimal total = stockLevels
            .Where(s => costMap.ContainsKey(s.ProductId))
            .Sum(s => s.Quantity * costMap[s.ProductId]);

        return new InventoryValueResult
        {
            TotalStockValue = total,
            TotalProducts = stockLevels.Select(s => s.ProductId).Distinct().Count(),
            TotalWarehouses = stockLevels.Select(s => s.WarehouseId).Distinct().Count()
        };
    }

    // ─── GetStockValueByWarehouse ──────────────────────────────────────────────
    public async Task<List<WarehouseValueResult>> GetStockValueByWarehouseAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var snapshotExists = await _db.Snapshots.AnyAsync(s => s.SnapshotDate == today);

        if (snapshotExists)
        {
            var grouped = await _db.Snapshots
                .Where(s => s.SnapshotDate == today)
                .GroupBy(s => s.WarehouseId)
                .Select(g => new WarehouseValueResult
                {
                    WarehouseId = g.Key,
                    StockValue = g.Sum(s => s.StockValue),
                    ProductCount = g.Select(s => s.ProductId).Distinct().Count()
                })
                .ToListAsync();

            // Enrich with warehouse names
            await EnrichWarehouseNamesAsync(grouped);
            return grouped;
        }

        // Fallback: live
        return await GetLiveStockValueByWarehouseAsync();
    }

    private async Task<List<WarehouseValueResult>> GetLiveStockValueByWarehouseAsync()
    {
        var http = CreateSystemHttpClient();
        var stockUrl = _config["ServiceUrls:StockMovement"];
        var productUrl = _config["ServiceUrls:ProductItem"];

        var stockJson = await http.GetStringAsync($"{stockUrl}/api/stock");
        var productJson = await http.GetStringAsync($"{productUrl}/api/products");

        var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(stockJson, _json) ?? new();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson, _json) ?? new();
        var costMap = products.ToDictionary(p => p.ProductId, p => p.CostPrice);

        var result = stockLevels
            .Where(s => costMap.ContainsKey(s.ProductId))
            .GroupBy(s => s.WarehouseId)
            .Select(g => new WarehouseValueResult
            {
                WarehouseId = g.Key,
                StockValue = g.Sum(s => s.Quantity * costMap[s.ProductId]),
                ProductCount = g.Select(s => s.ProductId).Distinct().Count()
            })
            .ToList();

        await EnrichWarehouseNamesAsync(result);
        return result;
    }

    private async Task EnrichWarehouseNamesAsync(List<WarehouseValueResult> results)
    {
        try
        {
            var http = CreateSystemHttpClient();
            var warehouseUrl = _config["ServiceUrls:WarehouseStock"];
            var warehouseJson = await http.GetStringAsync($"{warehouseUrl}/api/warehouses");
            var warehouses = JsonSerializer.Deserialize<List<WarehouseDto>>(warehouseJson, _json) ?? new();
            var nameMap = warehouses.ToDictionary(w => w.WarehouseId, w => w.Name);

            foreach (var r in results)
            {
                if (nameMap.TryGetValue(r.WarehouseId, out var name))
                    r.WarehouseName = name;
            }
        }
        catch
        {
            // Non-critical — warehouse names are enrichment only
        }
    }

    // ─── GetInventoryTurnover ──────────────────────────────────────────────────
    public async Task<TurnoverResult> GetInventoryTurnoverAsync(DateOnly startDate, DateOnly endDate)
    {
        var http = CreateSystemHttpClient();
        var movementUrl = _config["ServiceUrls:StockMovement"];

        var movementsJson = await http.GetStringAsync(
            $"{movementUrl}/api/movement/history?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");
        var movements = JsonSerializer.Deserialize<List<MovementDto>>(movementsJson, _json) ?? new();

        // COGS = sum of (quantity × unitCost) for all STOCK_OUT movements in the period
        var cogs = movements
            .Where(m => m.MovementType == "STOCK_OUT")
            .Sum(m => Math.Abs(m.Quantity) * (m.UnitCost ?? 0));

        // Average Inventory Value from snapshots
        var snapshotStart = await _db.Snapshots
            .Where(s => s.SnapshotDate >= startDate)
            .SumAsync(s => (decimal?)s.StockValue) ?? 0;

        var snapshotEnd = await _db.Snapshots
            .Where(s => s.SnapshotDate <= endDate)
            .SumAsync(s => (decimal?)s.StockValue) ?? 0;

        var avgInventoryValue = (snapshotStart + snapshotEnd) / 2;

        // Prevent division by zero
        var turnoverRate = avgInventoryValue > 0 ? Math.Round(cogs / avgInventoryValue, 2) : 0;

        return new TurnoverResult
        {
            TurnoverRate = turnoverRate,
            CostOfGoodsSold = cogs,
            AverageInventoryValue = avgInventoryValue,
            StartDate = startDate,
            EndDate = endDate
        };
    }

    // ─── GetTopMovingProducts ──────────────────────────────────────────────────
    public async Task<List<TopMovingProduct>> GetTopMovingProductsAsync(
        DateOnly startDate, DateOnly endDate, int topN = 10)
    {
        var http = CreateSystemHttpClient();
        var movementUrl = _config["ServiceUrls:StockMovement"];
        var productUrl = _config["ServiceUrls:ProductItem"];

        var movementsJson = await http.GetStringAsync(
            $"{movementUrl}/api/movement/history?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");
        var productJson = await http.GetStringAsync($"{productUrl}/api/products");

        var movements = JsonSerializer.Deserialize<List<MovementDto>>(movementsJson, _json) ?? new();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson, _json) ?? new();
        var productMap = products.ToDictionary(p => p.ProductId);

        var ranked = movements
            .GroupBy(m => m.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalIn = g.Where(m => m.MovementType == "STOCK_IN").Sum(m => m.Quantity),
                TotalOut = g.Where(m => m.MovementType == "STOCK_OUT").Sum(m => m.Quantity),
                TotalMoved = g.Sum(m => m.Quantity)
            })
            .OrderByDescending(x => x.TotalMoved)
            .Take(topN)
            .Select((x, index) => new TopMovingProduct
            {
                ProductId = x.ProductId,
                ProductName = productMap.TryGetValue(x.ProductId, out var p) ? p.Name : "Unknown",
                SKU = productMap.TryGetValue(x.ProductId, out var p2) ? p2.SKU : "",
                TotalUnitsIn = x.TotalIn,
                TotalUnitsOut = x.TotalOut,
                TotalUnitsMoved = x.TotalMoved,
                Rank = index + 1
            })
            .ToList();

        return ranked;
    }

    // ─── GetSlowMovingProducts ─────────────────────────────────────────────────
    public async Task<List<SlowMovingProduct>> GetSlowMovingProductsAsync(
        DateOnly startDate, DateOnly endDate, int thresholdUnits = 10)
    {
        var http = CreateSystemHttpClient();
        var movementUrl = _config["ServiceUrls:StockMovement"];
        var productUrl = _config["ServiceUrls:ProductItem"];
        var stockUrl = _config["ServiceUrls:StockMovement"];

        var movementsJson = await http.GetStringAsync(
            $"{movementUrl}/api/movement/history?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");
        var productJson = await http.GetStringAsync($"{productUrl}/api/products");
        var stockJson = await http.GetStringAsync($"{stockUrl}/api/stock");

        var movements = JsonSerializer.Deserialize<List<MovementDto>>(movementsJson, _json) ?? new();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson, _json) ?? new();
        var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(stockJson, _json) ?? new();

        var movementMap = movements
            .GroupBy(m => m.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(m => m.Quantity));

        var stockMap = stockLevels
            .GroupBy(s => s.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.Quantity));

        var costMap = products.ToDictionary(p => p.ProductId, p => p.CostPrice);

        return products
            .Where(p => p.IsActive)
            .Where(p =>
            {
                movementMap.TryGetValue(p.ProductId, out var moved);
                return moved <= thresholdUnits;
            })
            .Select(p =>
            {
                movementMap.TryGetValue(p.ProductId, out var moved);
                stockMap.TryGetValue(p.ProductId, out var qty);
                return new SlowMovingProduct
                {
                    ProductId = p.ProductId,
                    ProductName = p.Name,
                    SKU = p.SKU,
                    TotalUnitsMoved = moved,
                    CurrentStock = qty,
                    StockValue = qty * p.CostPrice
                };
            })
            .OrderBy(x => x.TotalUnitsMoved)
            .ToList();
    }

    // ─── GetDeadStock ──────────────────────────────────────────────────────────
    public async Task<List<DeadStockItem>> GetDeadStockAsync(int daysSinceMovement = 90)
    {
        var cutoff = DateTime.UtcNow.AddDays(-daysSinceMovement);
        var http = CreateSystemHttpClient();
        var movementUrl = _config["ServiceUrls:StockMovement"];
        var productUrl = _config["ServiceUrls:ProductItem"];
        var stockUrl = _config["ServiceUrls:StockMovement"];

        var movementsJson = await http.GetStringAsync($"{movementUrl}/api/movement/history");
        var productJson = await http.GetStringAsync($"{productUrl}/api/products");
        var stockJson = await http.GetStringAsync($"{stockUrl}/api/stock");

        var movements = JsonSerializer.Deserialize<List<MovementDto>>(movementsJson, _json) ?? new();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson, _json) ?? new();
        var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(stockJson, _json) ?? new();

        // Last movement date per product
        var lastMovementMap = movements
            .GroupBy(m => m.ProductId)
            .ToDictionary(g => g.Key, g => g.Max(m => m.MovementDate));

        var stockMap = stockLevels
            .GroupBy(s => s.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.Quantity));

        return products
            .Where(p => p.IsActive)
            .Where(p =>
            {
                // Dead if never had movement OR last movement is before cutoff
                if (!lastMovementMap.TryGetValue(p.ProductId, out var lastDate))
                    return true; // Never moved — definitely dead stock
                return lastDate < cutoff;
            })
            .Select(p =>
            {
                lastMovementMap.TryGetValue(p.ProductId, out var lastDate);
                stockMap.TryGetValue(p.ProductId, out var qty);
                var daysSince = lastDate == default
                    ? daysSinceMovement
                    : (int)(DateTime.UtcNow - lastDate).TotalDays;

                return new DeadStockItem
                {
                    ProductId = p.ProductId,
                    ProductName = p.Name,
                    SKU = p.SKU,
                    CurrentStock = qty,
                    StockValue = qty * p.CostPrice,
                    LastMovementDate = lastDate == default ? null : lastDate,
                    DaysSinceLastMovement = daysSince
                };
            })
            .OrderByDescending(x => x.DaysSinceLastMovement)
            .ToList();
    }

    // ─── GetPOSummary ──────────────────────────────────────────────────────────
    public async Task<POSummaryResult> GetPOSummaryAsync(DateOnly startDate, DateOnly endDate)
    {
        var http = CreateSystemHttpClient();
        var purchaseUrl = _config["ServiceUrls:Purchase"];

        var poJson = await http.GetStringAsync(
            $"{purchaseUrl}/api/purchase-orders?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");
        var orders = JsonSerializer.Deserialize<List<PurchaseOrderDto>>(poJson, _json) ?? new();

        var receivedOrders = orders.Where(o => o.Status == "RECEIVED" || o.Status == "PARTIALLY_RECEIVED").ToList();

        var bySupplier = receivedOrders
            .GroupBy(o => o.SupplierId)
            .Select(g => new SupplierSpendItem
            {
                SupplierId = g.Key,
                SupplierName = g.First().SupplierName,
                POCount = g.Count(),
                TotalSpend = g.Sum(o => o.TotalAmount)
            })
            .OrderByDescending(s => s.TotalSpend)
            .ToList();

        var byWarehouse = receivedOrders
            .GroupBy(o => o.WarehouseId)
            .Select(g => new WarehouseSpendItem
            {
                WarehouseId = g.Key,
                WarehouseName = g.First().WarehouseName,
                POCount = g.Count(),
                TotalSpend = g.Sum(o => o.TotalAmount)
            })
            .OrderByDescending(w => w.TotalSpend)
            .ToList();

        return new POSummaryResult
        {
            TotalPOs = orders.Count,
            TotalSpend = receivedOrders.Sum(o => o.TotalAmount),
            BySupplier = bySupplier,
            ByWarehouse = byWarehouse,
            StartDate = startDate,
            EndDate = endDate
        };
    }

    // ─── GetLowStockReport ─────────────────────────────────────────────────────
    public async Task<List<LowStockItem>> GetLowStockReportAsync()
    {
        var http = CreateSystemHttpClient();
        var stockUrl = _config["ServiceUrls:StockMovement"];
        var productUrl = _config["ServiceUrls:ProductItem"];

        var stockJson = await http.GetStringAsync($"{stockUrl}/api/stock");
        var productJson = await http.GetStringAsync($"{productUrl}/api/products");

        var stockLevels = JsonSerializer.Deserialize<List<StockLevelDto>>(stockJson, _json) ?? new();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(productJson, _json) ?? new();

        var stockMap = stockLevels
            .GroupBy(s => s.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.Quantity));

        return products
            .Where(p => p.IsActive && p.ReorderLevel > 0)
            .Where(p =>
            {
                stockMap.TryGetValue(p.ProductId, out var qty);
                return qty < p.ReorderLevel;
            })
            .Select(p =>
            {
                stockMap.TryGetValue(p.ProductId, out var qty);
                return new LowStockItem
                {
                    ProductId = p.ProductId,
                    ProductName = p.Name,
                    SKU = p.SKU,
                    CurrentStock = qty,
                    ReorderLevel = p.ReorderLevel,
                    ShortfallUnits = p.ReorderLevel - qty
                };
            })
            .OrderByDescending(x => x.ShortfallUnits)
            .ToList();
    }

    // ─── GetStockMovementSummary ───────────────────────────────────────────────
    public async Task<MovementSummaryResult> GetStockMovementSummaryAsync(DateOnly startDate, DateOnly endDate)
    {
        var http = CreateSystemHttpClient();
        var movementUrl = _config["ServiceUrls:StockMovement"];

        var movementsJson = await http.GetStringAsync(
            $"{movementUrl}/api/movement/history?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");
        var movements = JsonSerializer.Deserialize<List<MovementDto>>(movementsJson, _json) ?? new();

        return new MovementSummaryResult
        {
            TotalMovements = movements.Count,
            TotalStockIn = movements.Where(m => m.MovementType == "STOCK_IN").Sum(m => m.Quantity),
            TotalStockOut = movements.Where(m => m.MovementType == "STOCK_OUT").Sum(m => m.Quantity),
            TotalTransfers = movements.Count(m => m.MovementType is "TRANSFER_IN" or "TRANSFER_OUT"),
            TotalAdjustments = movements.Count(m => m.MovementType == "ADJUSTMENT"),
            StartDate = startDate,
            EndDate = endDate
        };
    }

    // ─── JWT Helper (same pattern as AlertMonitorService) ─────────────────────
    private HttpClient CreateSystemHttpClient()
    {
        var http = _httpFactory.CreateClient("Internal");
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", GenerateSystemToken());
        return http;
    }

    private string GenerateSystemToken()
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.Empty.ToString()),
            new Claim("UserId", Guid.Empty.ToString()),
            new Claim(ClaimTypes.Role, "ADMIN"),
            new Claim("sub", Guid.Empty.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(10),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
