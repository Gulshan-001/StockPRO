using Microsoft.EntityFrameworkCore;
using StockPro.StockMovement.Data;
using StockPro.StockMovement.DTOs;
using StockPro.StockMovement.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockPro.StockMovement.Services
{
    public interface IMovementService
    {
        Task<MovementResponseDto> StockInAsync(StockInRequestDto request, Guid performedBy);
        Task<MovementResponseDto> StockOutAsync(StockOutRequestDto request, Guid performedBy);
        Task<MovementResponseDto> TransferAsync(StockTransferRequestDto request, Guid performedBy);
        Task<MovementResponseDto> AdjustmentAsync(StockAdjustmentRequestDto request, Guid performedBy);
        Task<IEnumerable<MovementResponseDto>> GetHistoryAsync(Guid? productId, Guid? warehouseId, string type, DateTime? startDate = null, DateTime? endDate = null);
    }

    public class MovementServiceImpl : IMovementService
    {
        private readonly InventoryDbContext _context;

        public MovementServiceImpl(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<MovementResponseDto> StockInAsync(StockInRequestDto request, Guid performedBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var stock = await GetOrCreateStockLevel(request.WarehouseId, request.ProductId);
                stock.Quantity += request.Quantity;
                stock.LastUpdated = DateTime.UtcNow;

                var movement = new Models.StockMovement
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.WarehouseId,
                    MovementType = "STOCK_IN",
                    Quantity = request.Quantity,
                    UnitCost = request.UnitCost,
                    ReferenceId = request.ReferenceId,
                    ReferenceType = request.ReferenceType ?? "GRN",
                    PerformedBy = performedBy,
                    Notes = request.Notes,
                    BalanceAfter = stock.Quantity
                };

                _context.StockMovements.Add(movement);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToDto(movement);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<MovementResponseDto> StockOutAsync(StockOutRequestDto request, Guid performedBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var stock = await _context.StockLevels
                    .FirstOrDefaultAsync(s => s.WarehouseId == request.WarehouseId && s.ProductId == request.ProductId);

                if (stock == null || stock.AvailableQuantity < request.Quantity)
                    throw new InvalidOperationException("Insufficient stock for this operation.");

                stock.Quantity -= request.Quantity;
                stock.LastUpdated = DateTime.UtcNow;

                var movement = new Models.StockMovement
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.WarehouseId,
                    MovementType = "STOCK_OUT",
                    Quantity = -request.Quantity,
                    ReferenceId = request.ReferenceId,
                    ReferenceType = request.ReferenceType ?? "ISSUE",
                    PerformedBy = performedBy,
                    Notes = request.Notes,
                    BalanceAfter = stock.Quantity
                };

                _context.StockMovements.Add(movement);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToDto(movement);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<MovementResponseDto> TransferAsync(StockTransferRequestDto request, Guid performedBy)
        {
            if (request.SourceWarehouseId == request.TargetWarehouseId)
                throw new InvalidOperationException("Source and target warehouses must be different.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Source
                var sourceStock = await _context.StockLevels
                    .FirstOrDefaultAsync(s => s.WarehouseId == request.SourceWarehouseId && s.ProductId == request.ProductId);

                if (sourceStock == null || sourceStock.AvailableQuantity < request.Quantity)
                    throw new InvalidOperationException("Insufficient stock in source warehouse.");

                sourceStock.Quantity -= request.Quantity;
                sourceStock.LastUpdated = DateTime.UtcNow;

                var outMovement = new Models.StockMovement
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.SourceWarehouseId,
                    MovementType = "TRANSFER_OUT",
                    Quantity = -request.Quantity,
                    ReferenceType = "TRANSFER",
                    PerformedBy = performedBy,
                    Notes = $"Transfer to {request.TargetWarehouseId}. " + request.Notes,
                    BalanceAfter = sourceStock.Quantity
                };

                // Target
                var targetStock = await GetOrCreateStockLevel(request.TargetWarehouseId, request.ProductId);
                targetStock.Quantity += request.Quantity;
                targetStock.LastUpdated = DateTime.UtcNow;

                var inMovement = new Models.StockMovement
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.TargetWarehouseId,
                    MovementType = "TRANSFER_IN",
                    Quantity = request.Quantity,
                    ReferenceType = "TRANSFER",
                    PerformedBy = performedBy,
                    Notes = $"Transfer from {request.SourceWarehouseId}. " + request.Notes,
                    BalanceAfter = targetStock.Quantity
                };

                _context.StockMovements.Add(outMovement);
                _context.StockMovements.Add(inMovement);
                
                try 
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    throw new Exception($"Database Update Error: {dbEx.InnerException?.Message ?? dbEx.Message}");
                }

                await transaction.CommitAsync();
                return MapToDto(outMovement);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<MovementResponseDto> AdjustmentAsync(StockAdjustmentRequestDto request, Guid performedBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var stock = await GetOrCreateStockLevel(request.WarehouseId, request.ProductId);
                if (stock.Quantity + request.Quantity < 0)
                    throw new InvalidOperationException("Adjustment would result in negative stock.");

                stock.Quantity += request.Quantity;
                stock.LastUpdated = DateTime.UtcNow;

                var movement = new Models.StockMovement
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.WarehouseId,
                    MovementType = "ADJUSTMENT",
                    Quantity = request.Quantity,
                    ReferenceType = "ADJUSTMENT",
                    PerformedBy = performedBy,
                    Notes = request.Notes,
                    BalanceAfter = stock.Quantity
                };

                _context.StockMovements.Add(movement);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToDto(movement);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<MovementResponseDto>> GetHistoryAsync(Guid? productId, Guid? warehouseId, string type, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.StockMovements.AsQueryable();

            if (productId.HasValue) query = query.Where(m => m.ProductId == productId.Value);
            if (warehouseId.HasValue) query = query.Where(m => m.WarehouseId == warehouseId.Value);
            if (!string.IsNullOrEmpty(type)) query = query.Where(m => m.MovementType == type);
            
            if (startDate.HasValue)
            {
                var startUtc = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
                query = query.Where(m => m.MovementDate >= startUtc);
            }
            if (endDate.HasValue)
            {
                var endUtc = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
                query = query.Where(m => m.MovementDate <= endUtc);
            }

            var list = await query.OrderByDescending(m => m.MovementDate).ToListAsync();
            return list.Select(MapToDto);
        }

        private async Task<StockLevel> GetOrCreateStockLevel(Guid warehouseId, Guid productId)
        {
            var stock = await _context.StockLevels
                .FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ProductId == productId);

            if (stock == null)
            {
                stock = new StockLevel
                {
                    WarehouseId = warehouseId,
                    ProductId = productId,
                    Quantity = 0,
                    ReservedQuantity = 0,
                    Location = "UNASSIGNED",
                    LastUpdated = DateTime.UtcNow
                };
                _context.StockLevels.Add(stock);
            }
            return stock;
        }

        private MovementResponseDto MapToDto(Models.StockMovement m) => new MovementResponseDto
        {
            MovementId = m.MovementId,
            ProductId = m.ProductId,
            WarehouseId = m.WarehouseId,
            MovementType = m.MovementType,
            Quantity = m.Quantity,
            UnitCost = m.UnitCost,
            BalanceAfter = m.BalanceAfter,
            Notes = m.Notes,
            MovementDate = m.MovementDate,
            PerformedBy = m.PerformedBy.ToString()
        };
    }
}
