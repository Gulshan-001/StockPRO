using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.Alert.Services;
using System.Security.Claims;

namespace StockPro.Alert.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;
    private readonly ILogger<AlertsController> _logger;

    public AlertsController(IAlertService alertService, ILogger<AlertsController> logger)
    {
        _alertService = alertService;
        _logger = logger;
    }

    // ─── GET /api/alerts ─────────────────────────────────────────────────
    /// <summary>Returns all alerts for the currently authenticated user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyAlerts()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var alerts = await _alertService.GetAlertsAsync(userId);
        return Ok(alerts);
    }

    // ─── GET /api/alerts/unread-count ────────────────────────────────────
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var count = await _alertService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    // ─── PUT /api/alerts/read/{id} ───────────────────────────────────────
    [HttpPut("read/{id:guid}")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        await _alertService.MarkAsReadAsync(id, userId);
        return Ok(new { message = "Alert marked as read." });
    }

    // ─── PUT /api/alerts/acknowledge/{id} ───────────────────────────────
    [HttpPut("acknowledge/{id:guid}")]
    public async Task<IActionResult> AcknowledgeAlert(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        await _alertService.AcknowledgeAlertAsync(id, userId);
        return Ok(new { message = "Alert acknowledged." });
    }

    // ─── POST /api/alerts/register-recipient ────────────────────────────
    /// <summary>
    /// Called by the frontend on login to register the user as a recipient
    /// so the background jobs can fan-out alerts to them.
    /// This is a seed endpoint — safe to call multiple times (idempotent).
    /// </summary>
    [HttpPost("register-recipient")]
    public async Task<IActionResult> RegisterRecipient()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        // Check if user has ANY alerts to ensure they are seeded in the DB for background jobs
        var existingAlerts = await _alertService.GetAlertsAsync(userId);
        if (!existingAlerts.Any())
        {
            await _alertService.GenerateAlertAsync(
                recipientId: userId,
                type: "SYSTEM",
                severity: "INFO",
                title: "Alert System Active",
                message: "Your notification center is now active and monitoring inventory levels."
            );
            _logger.LogInformation("[AlertsController] New recipient seeded: {UserId}", userId);
        }

        return Ok(new { recipientId = userId, registered = true });
    }

    // ─── Helper ─────────────────────────────────────────────────────────
    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub")
                 ?? User.FindFirst("UserId");

        if (claim == null) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
