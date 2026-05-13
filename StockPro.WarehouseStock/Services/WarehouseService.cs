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
    public interface IWarehouseService
    {
        Task<IEnumerable<WarehouseResponseDto>> GetAllWarehousesAsync();
        Task<WarehouseResponseDto?> GetWarehouseByIdAsync(Guid id);
        Task<WarehouseResponseDto> CreateWarehouseAsync(WarehouseCreateDto dto);
        Task<WarehouseResponseDto?> UpdateWarehouseAsync(Guid id, WarehouseUpdateDto dto);
        Task<bool> DeleteWarehouseAsync(Guid id);
    }

    public class WarehouseService : IWarehouseService
    {
        private readonly WarehouseDbContext _context;

        public WarehouseService(WarehouseDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<WarehouseResponseDto>> GetAllWarehousesAsync()
        {
            var warehouses = await _context.Warehouses.ToListAsync();
            return warehouses.Select(MapToDto);
        }

        public async Task<WarehouseResponseDto?> GetWarehouseByIdAsync(Guid id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            return warehouse == null ? null : MapToDto(warehouse);
        }

        public async Task<WarehouseResponseDto> CreateWarehouseAsync(WarehouseCreateDto dto)
        {
            var warehouse = new Warehouse
            {
                Name = dto.Name,
                Location = dto.Location,
                Address = dto.Address,
                ManagerId = dto.ManagerId,
                Capacity = dto.Capacity,
                Phone = dto.Phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            return MapToDto(warehouse);
        }

        public async Task<WarehouseResponseDto?> UpdateWarehouseAsync(Guid id, WarehouseUpdateDto dto)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return null;

            warehouse.Name = dto.Name;
            warehouse.Location = dto.Location;
            warehouse.Address = dto.Address;
            warehouse.ManagerId = dto.ManagerId;
            warehouse.Capacity = dto.Capacity;
            warehouse.Phone = dto.Phone;
            warehouse.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return MapToDto(warehouse);
        }

        public async Task<bool> DeleteWarehouseAsync(Guid id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return false;

            // Note: In a microservices architecture, we should call the StockMovement service 
            // to verify if there is remaining stock before deletion.
            
            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();
            return true;
        }

        private WarehouseResponseDto MapToDto(Warehouse w) => new WarehouseResponseDto
        {
            WarehouseId = w.WarehouseId,
            Name = w.Name,
            Location = w.Location,
            Address = w.Address,
            ManagerId = w.ManagerId,
            Capacity = w.Capacity,
            UsedCapacity = w.UsedCapacity,
            Phone = w.Phone,
            IsActive = w.IsActive,
            CreatedAt = w.CreatedAt
        };
    }
}
