using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace StockPro.WarehouseStock.Models
{
    public class Warehouse
    {
        [Key]
        public Guid WarehouseId { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(150)]
        public string? Location { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        public Guid? ManagerId { get; set; }

        public int Capacity { get; set; }

        public int UsedCapacity { get; set; } = 0;

        [StringLength(20)]
        public string? Phone { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<StockLevel> StockLevels { get; set; } = new List<StockLevel>();
    }
}
