using System;

namespace StockPro.StockMovement.DTOs
{
    public class StockInRequestDto
    {
        public Guid ProductId { get; set; }
        public Guid WarehouseId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public string? Notes { get; set; }
        public Guid? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
    }

    public class StockOutRequestDto
    {
        public Guid ProductId { get; set; }
        public Guid WarehouseId { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public Guid? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
    }

    public class StockTransferRequestDto
    {
        public Guid ProductId { get; set; }
        public Guid SourceWarehouseId { get; set; }
        public Guid TargetWarehouseId { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
    }

    public class StockAdjustmentRequestDto
    {
        public Guid ProductId { get; set; }
        public Guid WarehouseId { get; set; }
        public int Quantity { get; set; } 
        public string? Notes { get; set; }
    }

    public class MovementResponseDto
    {
        public Guid MovementId { get; set; }
        public Guid ProductId { get; set; }
        public Guid WarehouseId { get; set; }
        public string MovementType { get; set; }
        public int Quantity { get; set; }
        public decimal? UnitCost { get; set; }
        public int BalanceAfter { get; set; }
        public string Notes { get; set; }
        public DateTime MovementDate { get; set; }
        public string PerformedBy { get; set; }
    }
}
