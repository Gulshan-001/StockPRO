using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockPro.Auth.Models;

[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    public Guid AuditId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Maps to AspNetUsers.Id (string, NVARCHAR) — Identity default.
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Action { get; set; }

    [MaxLength(100)]
    public string? EntityName { get; set; }

    public Guid? EntityId { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey(nameof(UserId))]
    public ApplicationUser? User { get; set; }
}
