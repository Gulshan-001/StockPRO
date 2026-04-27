namespace StockPro.Purchase.DTOs;

// ─── Supplier DTOs ────────────────────────────────────────────────────────────

public class CreateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PaymentTerms { get; set; }
    public int? LeadTimeDays { get; set; }
    public decimal? Rating { get; set; }
}

public class UpdateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PaymentTerms { get; set; }
    public int? LeadTimeDays { get; set; }
    public decimal? Rating { get; set; }
    public bool IsActive { get; set; }
}

public class SupplierResponseDto
{
    public Guid SupplierId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PaymentTerms { get; set; }
    public int LeadTimeDays { get; set; }
    public decimal Rating { get; set; }
    public bool IsActive { get; set; }
}

// ─── Purchase Order DTOs ──────────────────────────────────────────────────────

public class CreatePOLineItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

public class CreatePODto
{
    public Guid SupplierId { get; set; }
    public Guid WarehouseId { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public string? Notes { get; set; }
    public List<CreatePOLineItemDto> Items { get; set; } = new();
}

public class ApprovePODto
{
    public Guid PoId { get; set; }
    public string? Notes { get; set; }
}

public class RejectPODto
{
    public Guid PoId { get; set; }
    public string? Notes { get; set; }
}

public class ReceiveLineItemDto
{
    public Guid LineItemId { get; set; }
    public int ReceivedQty { get; set; }
}

public class ReceiveGoodsDto
{
    public Guid PoId { get; set; }
    public List<ReceiveLineItemDto> Items { get; set; } = new();
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

public class LineItemResponseDto
{
    public Guid LineItemId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public int ReceivedQty { get; set; }
    public string ReceiptStatus => ReceivedQty == 0 ? "PENDING"
        : ReceivedQty >= Quantity ? "FULLY RECEIVED"
        : "PARTIALLY RECEIVED";
}

public class POResponseDto
{
    public Guid PoId { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public Guid CreatedById { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public string? Notes { get; set; }
    public List<LineItemResponseDto> LineItems { get; set; } = new();
}
