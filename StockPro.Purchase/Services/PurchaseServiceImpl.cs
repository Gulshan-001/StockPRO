using Microsoft.EntityFrameworkCore;
using StockPro.Purchase.Data;
using StockPro.Purchase.DTOs;
using StockPro.Purchase.Models;
using System.Text;
using System.Text.Json;

namespace StockPro.Purchase.Services;

public class PurchaseServiceImpl : IPurchaseService
{
    private readonly PurchaseDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<PurchaseServiceImpl> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PurchaseServiceImpl(
        PurchaseDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<PurchaseServiceImpl> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    // ─── Suppliers ────────────────────────────────────────────────────────────

    public async Task<SupplierResponseDto> CreateSupplierAsync(CreateSupplierDto dto)
    {
        var exists = await _db.Suppliers.AnyAsync(s => s.Email == dto.Email);
        if (exists)
            throw new InvalidOperationException($"A supplier with email '{dto.Email}' already exists.");

        var supplier = new Supplier
        {
            Name = dto.Name,
            ContactPerson = dto.ContactPerson,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            PaymentTerms = dto.PaymentTerms,
            LeadTimeDays = dto.LeadTimeDays ?? 0,
            Rating = dto.Rating ?? 0
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();
        return MapSupplier(supplier);
    }

    public async Task<SupplierResponseDto> UpdateSupplierAsync(Guid supplierId, UpdateSupplierDto dto)
    {
        var supplier = await _db.Suppliers.FindAsync(supplierId)
            ?? throw new KeyNotFoundException("Supplier not found.");

        // Check for duplicate email (excluding self)
        var emailConflict = await _db.Suppliers
            .AnyAsync(s => s.Email == dto.Email && s.SupplierId != supplierId);
        if (emailConflict)
            throw new InvalidOperationException($"A supplier with email '{dto.Email}' already exists.");

        supplier.Name = dto.Name;
        supplier.ContactPerson = dto.ContactPerson;
        supplier.Email = dto.Email;
        supplier.Phone = dto.Phone;
        supplier.Address = dto.Address;
        supplier.City = dto.City;
        supplier.Country = dto.Country;
        supplier.PaymentTerms = dto.PaymentTerms;
        supplier.LeadTimeDays = dto.LeadTimeDays ?? 0;
        supplier.Rating = dto.Rating ?? 0;
        supplier.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return MapSupplier(supplier);
    }

    public async Task<IEnumerable<SupplierResponseDto>> GetAllSuppliersAsync()
    {
        var suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
        return suppliers.Select(MapSupplier);
    }

    public async Task<SupplierResponseDto> GetSupplierByIdAsync(Guid supplierId)
    {
        var supplier = await _db.Suppliers.FindAsync(supplierId)
            ?? throw new KeyNotFoundException("Supplier not found.");
        return MapSupplier(supplier);
    }

    // ─── Purchase Orders ──────────────────────────────────────────────────────

    public async Task<POResponseDto> CreatePOAsync(CreatePODto dto, Guid createdById)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            throw new InvalidOperationException("A Purchase Order must have at least one line item.");

        var supplier = await _db.Suppliers.FindAsync(dto.SupplierId)
            ?? throw new KeyNotFoundException("Supplier not found.");

        if (!supplier.IsActive)
            throw new InvalidOperationException("Cannot create a Purchase Order for an inactive supplier.");

        var po = new PurchaseOrder
        {
            SupplierId = dto.SupplierId,
            WarehouseId = dto.WarehouseId,
            CreatedById = createdById,
            Status = "DRAFT",
            OrderDate = DateTime.UtcNow,
            ExpectedDate = dto.ExpectedDate.HasValue ? DateTime.SpecifyKind(dto.ExpectedDate.Value, DateTimeKind.Utc) : null,
            Notes = dto.Notes,
            LineItems = dto.Items.Select(i => new POLineItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitCost = i.UnitCost,
                ReceivedQty = 0
            }).ToList()
        };

        po.TotalAmount = po.LineItems.Sum(l => l.Quantity * l.UnitCost);

        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync();

        return await BuildPOResponse(po.PoId);
    }

    public async Task<POResponseDto> SubmitPOAsync(Guid poId, Guid userId)
    {
        var po = await _db.PurchaseOrders.FindAsync(poId)
            ?? throw new KeyNotFoundException("Purchase Order not found.");

        if (po.Status != "DRAFT")
            throw new InvalidOperationException($"Only DRAFT orders can be submitted. Current status: {po.Status}");

        po.Status = "PENDING";
        await _db.SaveChangesAsync();
        return await BuildPOResponse(po.PoId);
    }

    public async Task<POResponseDto> ApprovePOAsync(ApprovePODto dto, Guid userId)
    {
        var po = await _db.PurchaseOrders.FindAsync(dto.PoId)
            ?? throw new KeyNotFoundException("Purchase Order not found.");

        if (po.Status != "PENDING")
            throw new InvalidOperationException($"Only PENDING orders can be approved. Current status: {po.Status}");

        po.Status = "APPROVED";
        if (dto.Notes != null) po.Notes = dto.Notes;
        await _db.SaveChangesAsync();
        return await BuildPOResponse(po.PoId);
    }

    public async Task<POResponseDto> RejectPOAsync(RejectPODto dto, Guid userId)
    {
        var po = await _db.PurchaseOrders.FindAsync(dto.PoId)
            ?? throw new KeyNotFoundException("Purchase Order not found.");

        if (po.Status != "PENDING")
            throw new InvalidOperationException($"Only PENDING orders can be rejected. Current status: {po.Status}");

        po.Status = "CANCELLED";
        if (dto.Notes != null) po.Notes = dto.Notes;
        await _db.SaveChangesAsync();
        return await BuildPOResponse(po.PoId);
    }

    public async Task<POResponseDto> ReceiveGoodsAsync(ReceiveGoodsDto dto, Guid userId)
    {
        var po = await _db.PurchaseOrders
            .Include(p => p.LineItems)
            .FirstOrDefaultAsync(p => p.PoId == dto.PoId)
            ?? throw new KeyNotFoundException("Purchase Order not found.");

        if (po.Status == "CANCELLED")
            throw new InvalidOperationException("Cannot receive goods for a cancelled Purchase Order.");

        if (po.Status != "APPROVED")
            throw new InvalidOperationException($"Goods can only be received for APPROVED orders. Current status: {po.Status}");

        foreach (var receiveItem in dto.Items)
        {
            var lineItem = po.LineItems.FirstOrDefault(l => l.LineItemId == receiveItem.LineItemId)
                ?? throw new KeyNotFoundException($"Line item {receiveItem.LineItemId} not found on this PO.");

            var newTotal = lineItem.ReceivedQty + receiveItem.ReceivedQty;
            if (newTotal > lineItem.Quantity)
                throw new InvalidOperationException(
                    $"Cannot receive {receiveItem.ReceivedQty} units for product {lineItem.ProductId}. " +
                    $"Ordered: {lineItem.Quantity}, Already received: {lineItem.ReceivedQty}, Would exceed by: {newTotal - lineItem.Quantity}.");

            lineItem.ReceivedQty = newTotal;

            // Call StockMovement service to create STOCK_IN (GRN)
            await CreateStockInMovementAsync(po.WarehouseId, lineItem.ProductId, receiveItem.ReceivedQty, lineItem.UnitCost, po.PoId, userId);
        }

        // Auto-mark as RECEIVED if all line items are fully received
        var allReceived = po.LineItems.All(l => l.ReceivedQty >= l.Quantity);
        if (allReceived)
        {
            po.Status = "RECEIVED";
            po.ReceivedDate = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return await BuildPOResponse(po.PoId);
    }

    public async Task<IEnumerable<POResponseDto>> GetAllPOsAsync(string? status)
    {
        var query = _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Include(p => p.LineItems)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status.ToUpper());

        var pos = await query.OrderByDescending(p => p.OrderDate).ToListAsync();
        return pos.Select(p => MapPO(p));
    }

    public async Task<POResponseDto> GetPOByIdAsync(Guid poId)
    {
        return await BuildPOResponse(poId);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private async Task CreateStockInMovementAsync(Guid warehouseId, Guid productId, int qty, decimal unitCost, Guid poId, Guid userId)
    {
        try
        {
            var movementUrl = _config["MovementServiceUrl"]
                ?? throw new InvalidOperationException("MovementServiceUrl is not configured.");

            var payload = new
            {
                warehouseId,
                productId,
                quantity = qty,
                unitCost,
                referenceId = poId,
                referenceType = "PURCHASE_ORDER",
                notes = $"GRN via PO#{poId.ToString()[..8].ToUpper()}"
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var client = _httpClientFactory.CreateClient("StockMovement");
            
            // Propagation: Get the JWT token from the current request and add it to the outgoing request
            var authHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader))
            {
                client.DefaultRequestHeaders.Add("Authorization", authHeader);
            }

            var response = await client.PostAsync($"{movementUrl}/api/movement/stock-in", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("StockMovement GRN call failed: {Status} - {Error}", response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call StockMovement service for GRN. Stock levels may be out of sync.");
        }
    }

    private async Task<POResponseDto> BuildPOResponse(Guid poId)
    {
        var po = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Include(p => p.LineItems)
            .FirstOrDefaultAsync(p => p.PoId == poId)
            ?? throw new KeyNotFoundException("Purchase Order not found.");

        return MapPO(po);
    }

    private static POResponseDto MapPO(PurchaseOrder po) => new()
    {
        PoId = po.PoId,
        SupplierId = po.SupplierId,
        SupplierName = po.Supplier?.Name ?? string.Empty,
        WarehouseId = po.WarehouseId,
        CreatedById = po.CreatedById,
        Status = po.Status,
        TotalAmount = po.TotalAmount,
        OrderDate = po.OrderDate,
        ExpectedDate = po.ExpectedDate,
        ReceivedDate = po.ReceivedDate,
        Notes = po.Notes,
        LineItems = po.LineItems.Select(l => new LineItemResponseDto
        {
            LineItemId = l.LineItemId,
            ProductId = l.ProductId,
            Quantity = l.Quantity,
            UnitCost = l.UnitCost,
            ReceivedQty = l.ReceivedQty
        }).ToList()
    };

    private static SupplierResponseDto MapSupplier(Supplier s) => new()
    {
        SupplierId = s.SupplierId,
        Name = s.Name,
        ContactPerson = s.ContactPerson,
        Email = s.Email,
        Phone = s.Phone,
        Address = s.Address,
        City = s.City,
        Country = s.Country,
        PaymentTerms = s.PaymentTerms,
        LeadTimeDays = s.LeadTimeDays,
        Rating = s.Rating,
        IsActive = s.IsActive
    };
}
