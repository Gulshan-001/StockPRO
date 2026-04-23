using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockPro.WarehouseStock.Models
{
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

        public int ReservedQuantity { get; set; } = 0;

        [StringLength(100)]
        public string? Location { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("WarehouseId")]
        public Warehouse Warehouse { get; set; } = null!;

        // Note: Product is now managed by the Product/Item-Service.
        // We store the ProductId as a reference.

        [NotMapped]
        public int AvailableQuantity => Quantity - ReservedQuantity;
    }
}
