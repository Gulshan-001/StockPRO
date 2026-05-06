using StockPro.Analytics.DTOs;

namespace StockPro.Analytics.Services;

/// <summary>
/// Business contract for the Report/Analytics service.
/// Declared exactly per Case Study Section 4.8.
/// </summary>
public interface IReportService
{
    /// <summary>
    /// Captures a point-in-time snapshot of all stock quantities and values
    /// per product per warehouse. Called by SnapshotBackgroundService daily at midnight.
    /// </summary>
    Task<SnapshotResult> TakeSnapshotAsync(DateOnly? snapshotDate = null);

    /// <summary>
    /// GET /api/reports/value
    /// Returns total inventory valuation: sum of (quantity × cost price) across all warehouses.
    /// Falls back to live calculation if no snapshot exists for today.
    /// </summary>
    Task<InventoryValueResult> GetTotalStockValueAsync();

    /// <summary>
    /// GET /api/reports/value/by-warehouse
    /// Returns per-warehouse stock value breakdown.
    /// </summary>
    Task<List<WarehouseValueResult>> GetStockValueByWarehouseAsync();

    /// <summary>
    /// GET /api/reports/turnover?startDate=&endDate=
    /// Inventory turnover rate = COGS / Average Inventory Value over a date range.
    /// COGS = sum of (quantity × unitCost) for all STOCK_OUT movements in the period.
    /// </summary>
    Task<TurnoverResult> GetInventoryTurnoverAsync(DateOnly startDate, DateOnly endDate);

    /// <summary>
    /// GET /api/reports/top-products?startDate=&endDate=&topN=10
    /// Products ranked by total units moved (STOCK_IN + STOCK_OUT) over a period.
    /// </summary>
    Task<List<TopMovingProduct>> GetTopMovingProductsAsync(DateOnly startDate, DateOnly endDate, int topN = 10);

    /// <summary>
    /// GET /api/reports/slow-products?startDate=&endDate=
    /// Products with zero or minimal movement over a configurable period.
    /// </summary>
    Task<List<SlowMovingProduct>> GetSlowMovingProductsAsync(DateOnly startDate, DateOnly endDate, int thresholdUnits = 10);

    /// <summary>
    /// GET /api/reports/dead-stock?days=90
    /// Products with no inbound or outbound movement for more than the specified days (default: 90).
    /// Case Study Section 2.8: Dead stock = no movement for 90+ days.
    /// </summary>
    Task<List<DeadStockItem>> GetDeadStockAsync(int daysSinceMovement = 90);

    /// <summary>
    /// GET /api/reports/po-summary?startDate=&endDate=
    /// PO count, total spend, by supplier and by warehouse over a date range.
    /// </summary>
    Task<POSummaryResult> GetPOSummaryAsync(DateOnly startDate, DateOnly endDate);

    /// <summary>
    /// GET /api/reports/low-stock
    /// Current products with stock below their reorder level (live calculation fallback).
    /// </summary>
    Task<List<LowStockItem>> GetLowStockReportAsync();

    /// <summary>
    /// GET /api/reports/movement-summary?startDate=&endDate=
    /// Aggregated movement counts and quantities for a period.
    /// </summary>
    Task<MovementSummaryResult> GetStockMovementSummaryAsync(DateOnly startDate, DateOnly endDate);
}
