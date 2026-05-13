using StockPro.Purchase.DTOs;

namespace StockPro.Purchase.Services;

public interface IPurchaseService
{
    // Suppliers
    Task<SupplierResponseDto> CreateSupplierAsync(CreateSupplierDto dto);
    Task<SupplierResponseDto> UpdateSupplierAsync(Guid supplierId, UpdateSupplierDto dto);
    Task<IEnumerable<SupplierResponseDto>> GetAllSuppliersAsync();
    Task<SupplierResponseDto> GetSupplierByIdAsync(Guid supplierId);

    // Purchase Orders
    Task<POResponseDto> CreatePOAsync(CreatePODto dto, Guid createdById);
    Task<POResponseDto> SubmitPOAsync(Guid poId, Guid userId);
    Task<POResponseDto> ApprovePOAsync(ApprovePODto dto, Guid userId);
    Task<POResponseDto> RejectPOAsync(RejectPODto dto, Guid userId);
    Task<POResponseDto> ReceiveGoodsAsync(ReceiveGoodsDto dto, Guid userId);
    Task<IEnumerable<POResponseDto>> GetAllPOsAsync(string? status);
    Task<POResponseDto> GetPOByIdAsync(Guid poId);
}
