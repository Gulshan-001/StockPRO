namespace StockPro.Alert.DTOs;

public class AlertResponseDto
{
    public Guid AlertId { get; set; }
    public Guid RecipientId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedProductId { get; set; }
    public Guid? RelatedWarehouseId { get; set; }
    public bool IsRead { get; set; }
    public bool IsAcknowledged { get; set; }
    public DateTime CreatedAt { get; set; }
}
