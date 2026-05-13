using System;
using System.ComponentModel.DataAnnotations;

namespace StockPro.WarehouseStock.DTOs
{
    public class WarehouseCreateDto
    {
        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(150)]
        public string? Location { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        public Guid? ManagerId { get; set; }

        [Range(0, int.MaxValue)]
        public int Capacity { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }
    }

    public class WarehouseUpdateDto : WarehouseCreateDto
    {
        public bool IsActive { get; set; }
    }

    public class WarehouseResponseDto
    {
        public Guid WarehouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? Address { get; set; }
        public Guid? ManagerId { get; set; }
        public int Capacity { get; set; }
        public int UsedCapacity { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
