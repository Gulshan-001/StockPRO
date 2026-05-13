using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockPro.StockMovement.Models
{
    public class StockMovement
    {
        [Key]
        public Guid MovementId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        public Guid WarehouseId { get; set; }

        [Required]
        [StringLength(30)]
        public string MovementType { get; set; } = string.Empty;

        [Required]
        public int Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? UnitCost { get; set; }

        public Guid? ReferenceId { get; set; }

        [StringLength(50)]
        public string? ReferenceType { get; set; }

        public Guid PerformedBy { get; set; }

        [StringLength(255)]
        public string? Notes { get; set; }

        public DateTime MovementDate { get; set; } = DateTime.UtcNow;

        [Required]
        public int BalanceAfter { get; set; }
    }

    public class StockLevel
    {
        [Key]
        public Guid StockId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid WarehouseId { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        public int Quantity { get; set; }

        public int ReservedQuantity { get; set; }

        [NotMapped]
        public int AvailableQuantity => Quantity - ReservedQuantity;

        [StringLength(100)]
        public string? Location { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
