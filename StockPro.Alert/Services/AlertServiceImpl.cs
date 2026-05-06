using Microsoft.EntityFrameworkCore;
using StockPro.Alert.Data;
using StockPro.Alert.DTOs;

namespace StockPro.Alert.Services;

public class AlertServiceImpl : IAlertService
{
    private readonly AlertDbContext _db;
    private readonly ILogger<AlertServiceImpl> _logger;

    public AlertServiceImpl(AlertDbContext db, ILogger<AlertServiceImpl> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task GenerateAlertAsync(
        Guid recipientId, string type, string severity, string title,
        string message, Guid? relatedProductId = null, Guid? relatedWarehouseId = null)
    {
        // Duplicate guard: skip if an unacknowledged alert of same type+product+warehouse exists
        var duplicate = await DuplicateExistsAsync(type, relatedProductId, relatedWarehouseId);
        if (duplicate)
        {
            _logger.LogInformation("[Alert] Skipped duplicate alert: {Type} P={ProductId} W={WarehouseId}",
                type, relatedProductId, relatedWarehouseId);
            return;
        }

        var alert = new Models.Alert
        {
            RecipientId = recipientId,
            Type = type,
            Severity = severity,
            Title = title,
            Message = message,
            RelatedProductId = relatedProductId,
            RelatedWarehouseId = relatedWarehouseId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Alerts.Add(alert);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[Alert] Generated: [{Severity}] {Title} for recipient {RecipientId}", severity, title, recipientId);

        // Email stub for CRITICAL alerts — ready for SendGrid drop-in
        if (severity == "CRITICAL")
        {
            SendEmailNotification(recipientId, title, message);
        }
    }

    public async Task<List<AlertResponseDto>> GetAlertsAsync(Guid recipientId)
    {
        var alerts = await _db.Alerts
            .Where(a => a.RecipientId == recipientId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return alerts.Select(a => new AlertResponseDto
        {
            AlertId = a.AlertId,
            RecipientId = a.RecipientId,
            Type = a.Type,
            Severity = a.Severity,
            Title = a.Title,
            Message = a.Message,
            RelatedProductId = a.RelatedProductId,
            RelatedWarehouseId = a.RelatedWarehouseId,
            IsRead = a.IsRead,
            IsAcknowledged = a.IsAcknowledged,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task MarkAsReadAsync(Guid alertId, Guid requesterId)
    {
        var alert = await _db.Alerts.FindAsync(alertId);
        if (alert == null) return;

        // Security: users can only modify their own alerts
        if (alert.RecipientId != requesterId)
        {
            _logger.LogWarning("[Alert] Unauthorized read attempt: AlertId={AlertId} by User={UserId}", alertId, requesterId);
            return;
        }

        alert.IsRead = true;
        await _db.SaveChangesAsync();
    }

    public async Task AcknowledgeAlertAsync(Guid alertId, Guid requesterId)
    {
        var alert = await _db.Alerts.FindAsync(alertId);
        if (alert == null) return;

        // Security: users can only acknowledge their own alerts
        if (alert.RecipientId != requesterId)
        {
            _logger.LogWarning("[Alert] Unauthorized acknowledge attempt: AlertId={AlertId} by User={UserId}", alertId, requesterId);
            return;
        }

        alert.IsRead = true;
        alert.IsAcknowledged = true;
        await _db.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid recipientId)
    {
        return await _db.Alerts
            .CountAsync(a => a.RecipientId == recipientId && !a.IsRead && !a.IsAcknowledged);
    }

    public async Task<bool> DuplicateExistsAsync(string type, Guid? relatedProductId, Guid? relatedWarehouseId)
    {
        return await _db.Alerts.AnyAsync(a =>
            a.Type == type &&
            a.RelatedProductId == relatedProductId &&
            a.RelatedWarehouseId == relatedWarehouseId &&
            !a.IsAcknowledged);
    }

    // ─── Email stub — ready for SendGrid SDK integration ─────────────
    private void SendEmailNotification(Guid recipientId, string title, string message)
    {
        // TODO: Inject IConfiguration and call SendGrid SDK here when API key is available:
        // var client = new SendGridClient(config["SendGrid:ApiKey"]);
        // var msg = MailHelper.CreateSingleEmail(from, to, title, message, message);
        // await client.SendEmailAsync(msg);
        _logger.LogWarning("[Alert] CRITICAL alert — email notification queued for {RecipientId}: {Title}", recipientId, title);
    }
}
