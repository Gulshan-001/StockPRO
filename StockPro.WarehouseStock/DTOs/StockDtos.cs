using System;
using System.ComponentModel.DataAnnotations;

namespace StockPro.WarehouseStock.DTOs
{
    public class StockInitializeDto
    {
        [Required]
        public Guid WarehouseId { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }
    }

    public class StockUpdateDto
    {
        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [Range(0, int.MaxValue)]
        public int ReservedQuantity { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }
    }

    public class StockResponseDto
    {
        public Guid StockId { get; set; }
        public Guid WarehouseId { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public Guid ProductId { get; set; }
        // These will be populated by the frontend or by joining data from Catalog service
        public string ProductName { get; set; } = "Unknown";
        public string ProductSKU { get; set; } = "Unknown";
        public int Quantity { get; set; }
        public int ReservedQuantity { get; set; }
        public int AvailableQuantity { get; set; }
        public string? Location { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
