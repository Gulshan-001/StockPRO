using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockPro.Alert.Models;

public class Alert
{
    [Key]
    public Guid AlertId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid RecipientId { get; set; }

    [Required]
    [StringLength(30)]
    public string Type { get; set; } = string.Empty;
    // LOW_STOCK | OVERSTOCK | PO_PENDING_APPROVAL | OVERDUE_PO

    [Required]
    [StringLength(20)]
    public string Severity { get; set; } = string.Empty;
    // INFO | WARNING | CRITICAL

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public Guid? RelatedProductId { get; set; }

    public Guid? RelatedWarehouseId { get; set; }

    public bool IsRead { get; set; } = false;

    public bool IsAcknowledged { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
