using StockPro.Alert.DTOs;

namespace StockPro.Alert.Services;

public interface IAlertService
{
    Task GenerateAlertAsync(Guid recipientId, string type, string severity, string title,
        string message, Guid? relatedProductId = null, Guid? relatedWarehouseId = null);

    Task<List<AlertResponseDto>> GetAlertsAsync(Guid recipientId);

    Task MarkAsReadAsync(Guid alertId, Guid requesterId);

    Task AcknowledgeAlertAsync(Guid alertId, Guid requesterId);

    Task<int> GetUnreadCountAsync(Guid recipientId);

    Task<bool> DuplicateExistsAsync(string type, Guid? relatedProductId, Guid? relatedWarehouseId);
}
