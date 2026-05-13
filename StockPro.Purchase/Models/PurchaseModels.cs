using System;

namespace StockPro.Purchase.Models;

public class Supplier
{
    public Guid SupplierId { get; set; } = Guid.NewGuid();
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
    public bool IsActive { get; set; } = true;

    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
}

public class PurchaseOrder
{
    public Guid PoId { get; set; } = Guid.NewGuid();
    public Guid SupplierId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid CreatedById { get; set; }
    public string Status { get; set; } = "DRAFT"; // DRAFT | PENDING | APPROVED | RECEIVED | CANCELLED
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public string? Notes { get; set; }

    public Supplier Supplier { get; set; } = null!;
    public ICollection<POLineItem> LineItems { get; set; } = new List<POLineItem>();
}

public class POLineItem
{
    public Guid LineItemId { get; set; } = Guid.NewGuid();
    public Guid PoId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public int ReceivedQty { get; set; } = 0;

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
}
