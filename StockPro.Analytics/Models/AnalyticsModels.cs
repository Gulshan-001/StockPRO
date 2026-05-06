using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockPro.Analytics.Models;

/// <summary>
/// Point-in-time snapshot of stock quantity and value per product per warehouse.
/// Written daily by the SnapshotBackgroundService IHostedService at midnight (UTC).
/// Case Study Section 4.8: InventorySnapshot entity.
/// </summary>
[Table("InventorySnapshots")]
public class InventorySnapshot
{
    [Key]
    public Guid SnapshotId { get; set; } = Guid.NewGuid();

    /// <summary>FK reference to Warehouse (cross-service — no nav property).</summary>
    [Required]
    public Guid WarehouseId { get; set; }

    /// <summary>FK reference to Product (cross-service — no nav property).</summary>
    [Required]
    public Guid ProductId { get; set; }

    /// <summary>Quantity on hand at the time of the snapshot.</summary>
    [Required]
    public int Quantity { get; set; }

    /// <summary>Stock value = Quantity × CostPrice at snapshot time.</summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal StockValue { get; set; }

    /// <summary>The calendar date this snapshot represents.</summary>
    [Required]
    public DateOnly SnapshotDate { get; set; }

    /// <summary>UTC timestamp of when this record was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
