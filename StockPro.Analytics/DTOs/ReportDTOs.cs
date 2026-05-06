namespace StockPro.Analytics.DTOs;

// ─── Response DTOs (returned to Angular frontend) ────────────────────────────

/// <summary>Total inventory valuation across all warehouses.</summary>
public class InventoryValueResult
{
    public decimal TotalStockValue { get; set; }
    public int TotalProducts { get; set; }
    public int TotalWarehouses { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Stock value broken down per warehouse.</summary>
public class WarehouseValueResult
{
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public decimal StockValue { get; set; }
    public int ProductCount { get; set; }
}

/// <summary>Inventory turnover rate: COGS / Average Inventory Value.</summary>
public class TurnoverResult
{
    public decimal TurnoverRate { get; set; }
    public decimal CostOfGoodsSold { get; set; }
    public decimal AverageInventoryValue { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

/// <summary>Product ranked by total units moved (in + out) over a period.</summary>
public class TopMovingProduct
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int TotalUnitsIn { get; set; }
    public int TotalUnitsOut { get; set; }
    public int TotalUnitsMoved { get; set; }
    public int Rank { get; set; }
}

/// <summary>Product with zero or minimal movement over a period.</summary>
public class SlowMovingProduct
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int TotalUnitsMoved { get; set; }
    public int CurrentStock { get; set; }
    public decimal StockValue { get; set; }
}

/// <summary>Product with no movement for 90+ days (configurable).</summary>
public class DeadStockItem
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public decimal StockValue { get; set; }
    public DateTime? LastMovementDate { get; set; }
    public int DaysSinceLastMovement { get; set; }
}

/// <summary>PO spend summary: count and total spend by supplier and warehouse.</summary>
public class POSummaryResult
{
    public int TotalPOs { get; set; }
    public decimal TotalSpend { get; set; }
    public List<SupplierSpendItem> BySupplier { get; set; } = new();
    public List<WarehouseSpendItem> ByWarehouse { get; set; } = new();
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

public class SupplierSpendItem
{
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int POCount { get; set; }
    public decimal TotalSpend { get; set; }
}

public class WarehouseSpendItem
{
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int POCount { get; set; }
    public decimal TotalSpend { get; set; }
}

/// <summary>Aggregated stock movement summary for a period.</summary>
public class MovementSummaryResult
{
    public int TotalMovements { get; set; }
    public int TotalStockIn { get; set; }
    public int TotalStockOut { get; set; }
    public int TotalTransfers { get; set; }
    public int TotalAdjustments { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

/// <summary>Current stock item below its reorder level.</summary>
public class LowStockItem
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int ReorderLevel { get; set; }
    public int ShortfallUnits { get; set; }
}

/// <summary>Result of a snapshot operation.</summary>
public class SnapshotResult
{
    public int RecordsWritten { get; set; }
    public DateOnly SnapshotDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ─── Internal DTOs for cross-service HTTP calls ────────────────────────────────

public class StockLevelDto
{
    public Guid StockId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public int ReservedQuantity { get; set; }
}

public class ProductDto
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public int ReorderLevel { get; set; }
    public int MaxStockLevel { get; set; }
    public bool IsActive { get; set; }
}

public class MovementDto
{
    public Guid MovementId { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public DateTime MovementDate { get; set; }
}

public class PurchaseOrderDto
{
    public Guid PoId { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
}

public class WarehouseDto
{
    public Guid WarehouseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
