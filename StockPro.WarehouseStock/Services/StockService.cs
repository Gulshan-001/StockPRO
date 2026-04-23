using Microsoft.EntityFrameworkCore;
using StockPro.WarehouseStock.Data;
using StockPro.WarehouseStock.DTOs;
using StockPro.WarehouseStock.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockPro.WarehouseStock.Services
{
    public interface IStockService
    {
        Task<IEnumerable<StockResponseDto>> GetStockLevelsAsync(Guid? warehouseId = null, Guid? productId = null);
        Task<StockResponseDto> InitializeStockAsync(StockInitializeDto dto);
        Task<StockResponseDto?> UpdateStockAsync(Guid warehouseId, Guid productId, StockUpdateDto dto);
    }

    public class StockService : IStockService
    {
        private readonly WarehouseDbContext _context;

        public StockService(WarehouseDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockResponseDto>> GetStockLevelsAsync(Guid? warehouseId = null, Guid? productId = null)
        {
            var query = _context.StockLevels
                .Include(s => s.Warehouse)
                .AsQueryable();

            if (warehouseId.HasValue)
                query = query.Where(s => s.WarehouseId == warehouseId.Value);

            if (productId.HasValue)
                query = query.Where(s => s.ProductId == productId.Value);

            var stockLevels = await query.ToListAsync();
            return stockLevels.Select(MapToDto);
        }

        public async Task<StockResponseDto> InitializeStockAsync(StockInitializeDto dto)
        {
            var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
            if (warehouse == null || !warehouse.IsActive)
                throw new InvalidOperationException("Invalid or inactive warehouse.");

            // Note: Product existence check should ideally be done via Catalog API call.
            // For now, we assume the ProductId passed from the UI is valid.

            if (await _context.StockLevels.AnyAsync(s => s.WarehouseId == dto.WarehouseId && s.ProductId == dto.ProductId))
                throw new InvalidOperationException("Stock entry already exists for this product in this warehouse.");

            if (warehouse.UsedCapacity + dto.Quantity > warehouse.Capacity)
                throw new InvalidOperationException("Warehouse capacity exceeded.");

            var stock = new StockLevel
            {
                WarehouseId = dto.WarehouseId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                Location = dto.Location,
                LastUpdated = DateTime.UtcNow
            };

            _context.StockLevels.Add(stock);
            warehouse.UsedCapacity += dto.Quantity;

            await _context.SaveChangesAsync();
            await _context.Entry(stock).Reference(s => s.Warehouse).LoadAsync();

            return MapToDto(stock);
        }

        public async Task<StockResponseDto?> UpdateStockAsync(Guid warehouseId, Guid productId, StockUpdateDto dto)
        {
            var stock = await _context.StockLevels
                .Include(s => s.Warehouse)
                .FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ProductId == productId);

            if (stock == null) return null;

            int diff = dto.Quantity - stock.Quantity;
            if (diff > 0 && stock.Warehouse.UsedCapacity + diff > stock.Warehouse.Capacity)
                throw new InvalidOperationException("Warehouse capacity exceeded.");

            stock.Quantity = dto.Quantity;
            stock.ReservedQuantity = dto.ReservedQuantity;
            stock.Location = dto.Location;
            stock.LastUpdated = DateTime.UtcNow;

            stock.Warehouse.UsedCapacity += diff;

            await _context.SaveChangesAsync();
            return MapToDto(stock);
        }

        private StockResponseDto MapToDto(StockLevel s) => new StockResponseDto
        {
            StockId = s.StockId,
            WarehouseId = s.WarehouseId,
            WarehouseName = s.Warehouse?.Name ?? "Unknown",
            ProductId = s.ProductId,
            // ProductName/SKU will be fetched by the frontend from Catalog service
            ProductName = "Product Ref: " + s.ProductId.ToString().Substring(0, 8),
            ProductSKU = "Ref: " + s.ProductId.ToString().Substring(0, 8),
            Quantity = s.Quantity,
            ReservedQuantity = s.ReservedQuantity,
            AvailableQuantity = s.AvailableQuantity,
            Location = s.Location,
            LastUpdated = s.LastUpdated
        };
    }
}
