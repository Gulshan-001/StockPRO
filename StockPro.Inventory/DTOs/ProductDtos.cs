using System;
using System.ComponentModel.DataAnnotations;

namespace StockPro.Inventory.DTOs
{
    public class ProductCreateDto
    {
        [Required]
        [StringLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? UnitOfMeasure { get; set; }

        [Range(0, double.MaxValue)]
        public decimal CostPrice { get; set; }

        [Range(0, double.MaxValue)]
        public decimal SellingPrice { get; set; }

        [Range(0, int.MaxValue)]
        public int ReorderLevel { get; set; }

        [Range(0, int.MaxValue)]
        public int MaxStockLevel { get; set; }

        public int? LeadTimeDays { get; set; }
        public string? Barcode { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ProductUpdateDto : ProductCreateDto
    {
        public bool IsActive { get; set; }
    }

    public class ProductResponseDto
    {
        public Guid ProductId { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? UnitOfMeasure { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int ReorderLevel { get; set; }
        public int MaxStockLevel { get; set; }
        public int? LeadTimeDays { get; set; }
        public string? Barcode { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
