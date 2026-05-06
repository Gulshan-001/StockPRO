using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.Analytics.Services;

namespace StockPro.Analytics.Controllers;

/// <summary>
/// Exposes all analytics and reporting endpoints.
/// Case Study Section 4.8 — ReportController.
/// Role-Based Access: MANAGER and ADMIN only (per UC7 spec Section 8 and Case Study Section 2.3, 2.5).
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize(Roles = "MANAGER,ADMIN")]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ILogger<ReportController> _logger;

    public ReportController(IReportService reportService, ILogger<ReportController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    // ─── GET /api/reports/value ────────────────────────────────────────────────
    /// <summary>Total inventory valuation: sum(quantity × cost price) across all warehouses.</summary>
    [HttpGet("value")]
    public async Task<IActionResult> GetTotalStockValue()
    {
        try
        {
            var result = await _reportService.GetTotalStockValueAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get total stock value.");
            return StatusCode(500, new { message = "Failed to calculate inventory value." });
        }
    }

    // ─── GET /api/reports/value/by-warehouse ──────────────────────────────────
    /// <summary>Per-warehouse stock value breakdown.</summary>
    [HttpGet("value/by-warehouse")]
    public async Task<IActionResult> GetStockValueByWarehouse()
    {
        try
        {
            var result = await _reportService.GetStockValueByWarehouseAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get per-warehouse value.");
            return StatusCode(500, new { message = "Failed to calculate warehouse values." });
        }
    }

    // ─── GET /api/reports/turnover ─────────────────────────────────────────────
    /// <summary>Inventory turnover rate = COGS / Average Inventory Value over a date range.</summary>
    [HttpGet("turnover")]
    public async Task<IActionResult> GetInventoryTurnover(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate)
    {
        var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
        var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        try
        {
            var result = await _reportService.GetInventoryTurnoverAsync(start, end);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get inventory turnover.");
            return StatusCode(500, new { message = "Failed to calculate inventory turnover." });
        }
    }

    // ─── GET /api/reports/top-products ────────────────────────────────────────
    /// <summary>Products ranked by total units moved (in + out) over a period.</summary>
    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopMovingProducts(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        [FromQuery] int topN = 10)
    {
        var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
        var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        try
        {
            var result = await _reportService.GetTopMovingProductsAsync(start, end, topN);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get top moving products.");
            return StatusCode(500, new { message = "Failed to retrieve top moving products." });
        }
    }

    // ─── GET /api/reports/slow-products ───────────────────────────────────────
    /// <summary>Products with zero or minimal movement over a configurable period.</summary>
    [HttpGet("slow-products")]
    public async Task<IActionResult> GetSlowMovingProducts(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        [FromQuery] int thresholdUnits = 10)
    {
        var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-3));
        var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        try
        {
            var result = await _reportService.GetSlowMovingProductsAsync(start, end, thresholdUnits);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get slow moving products.");
            return StatusCode(500, new { message = "Failed to retrieve slow moving products." });
        }
    }

    // ─── GET /api/reports/dead-stock ──────────────────────────────────────────
    /// <summary>
    /// Products with no inbound or outbound movement for 90+ days (configurable).
    /// Case Study Section 2.8: Dead stock = no movement for more than 90 days.
    /// </summary>
    [HttpGet("dead-stock")]
    public async Task<IActionResult> GetDeadStock([FromQuery] int days = 90)
    {
        try
        {
            var result = await _reportService.GetDeadStockAsync(days);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get dead stock.");
            return StatusCode(500, new { message = "Failed to retrieve dead stock report." });
        }
    }

    // ─── GET /api/reports/po-summary ──────────────────────────────────────────
    /// <summary>PO count and total spend by supplier and warehouse over a date range.</summary>
    [HttpGet("po-summary")]
    public async Task<IActionResult> GetPOSummary(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate)
    {
        var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-3));
        var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        try
        {
            var result = await _reportService.GetPOSummaryAsync(start, end);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get PO summary.");
            return StatusCode(500, new { message = "Failed to retrieve PO summary." });
        }
    }

    // ─── GET /api/reports/low-stock ───────────────────────────────────────────
    /// <summary>Current stock items below their reorder level (live calculation).</summary>
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStockReport()
    {
        try
        {
            var result = await _reportService.GetLowStockReportAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get low stock report.");
            return StatusCode(500, new { message = "Failed to retrieve low stock report." });
        }
    }

    // ─── GET /api/reports/movement-summary ────────────────────────────────────
    /// <summary>Aggregated movement counts and quantities for a period.</summary>
    [HttpGet("movement-summary")]
    public async Task<IActionResult> GetMovementSummary(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate)
    {
        var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
        var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        try
        {
            var result = await _reportService.GetStockMovementSummaryAsync(start, end);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Failed to get movement summary.");
            return StatusCode(500, new { message = "Failed to retrieve movement summary." });
        }
    }

    // ─── POST /api/reports/snapshot ───────────────────────────────────────────
    /// <summary>
    /// Manually triggers an inventory snapshot.
    /// Restricted to ADMIN only (background job runs this automatically daily).
    /// </summary>
    [HttpPost("snapshot")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> TakeSnapshot([FromQuery] DateOnly? date)
    {
        try
        {
            var result = await _reportService.TakeSnapshotAsync(date);
            _logger.LogInformation("[Reports] Manual snapshot triggered by {User}. Records: {Count}",
                User.Identity?.Name, result.RecordsWritten);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reports] Manual snapshot failed.");
            return StatusCode(500, new { message = "Snapshot failed. Check service connectivity." });
        }
    }
}
