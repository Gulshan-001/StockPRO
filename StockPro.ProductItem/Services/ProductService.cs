using Microsoft.EntityFrameworkCore;
using StockPro.ProductItem.Data;
using StockPro.ProductItem.DTOs;
using StockPro.ProductItem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockPro.ProductItem.Services
{
    public interface IProductService
    {
        Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync(string? query = null);
        Task<ProductResponseDto?> GetProductByIdAsync(Guid id);
        Task<ProductResponseDto?> GetProductByBarcodeAsync(string barcode);
        Task<ProductResponseDto> CreateProductAsync(ProductCreateDto productDto);
        Task<ProductResponseDto?> UpdateProductAsync(Guid id, ProductUpdateDto productDto);
        Task<bool> DeleteProductAsync(Guid id);
        Task<IEnumerable<ProductResponseDto>> SearchProductsAsync(string q);
    }

    public class ProductService : IProductService
    {
        private readonly ProductDbContext _context;

        public ProductService(ProductDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync(string? query = null)
        {
            var products = await _context.Products.ToListAsync();
            return products.Select(MapToDto);
        }

        public async Task<ProductResponseDto?> GetProductByIdAsync(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            return product == null ? null : MapToDto(product);
        }

        public async Task<ProductResponseDto?> GetProductByBarcodeAsync(string barcode)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Barcode == barcode);
            return product == null ? null : MapToDto(product);
        }

        public async Task<ProductResponseDto> CreateProductAsync(ProductCreateDto dto)
        {
            if (await _context.Products.AnyAsync(p => p.SKU == dto.SKU))
                throw new InvalidOperationException("SKU already exists.");

            if (!string.IsNullOrEmpty(dto.Barcode) && await _context.Products.AnyAsync(p => p.Barcode == dto.Barcode))
                throw new InvalidOperationException("Barcode already exists.");

            if (dto.CostPrice > dto.SellingPrice)
                throw new InvalidOperationException("CostPrice cannot be greater than SellingPrice.");

            if (dto.ReorderLevel >= dto.MaxStockLevel)
                throw new InvalidOperationException("ReorderLevel must be less than MaxStockLevel.");

            var product = new Product
            {
                SKU = dto.SKU,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                Brand = dto.Brand,
                UnitOfMeasure = dto.UnitOfMeasure,
                CostPrice = dto.CostPrice,
                SellingPrice = dto.SellingPrice,
                ReorderLevel = dto.ReorderLevel,
                MaxStockLevel = dto.MaxStockLevel,
                LeadTimeDays = dto.LeadTimeDays,
                Barcode = dto.Barcode,
                ImageUrl = dto.ImageUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return MapToDto(product);
        }

        public async Task<ProductResponseDto?> UpdateProductAsync(Guid id, ProductUpdateDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return null;

            if (await _context.Products.AnyAsync(p => p.SKU == dto.SKU && p.ProductId != id))
                throw new InvalidOperationException("SKU already exists.");

            if (!string.IsNullOrEmpty(dto.Barcode) && await _context.Products.AnyAsync(p => p.Barcode == dto.Barcode && p.ProductId != id))
                throw new InvalidOperationException("Barcode already exists.");
            
            if (dto.CostPrice > dto.SellingPrice)
                throw new InvalidOperationException("CostPrice cannot be greater than SellingPrice.");

            if (dto.ReorderLevel >= dto.MaxStockLevel)
                throw new InvalidOperationException("ReorderLevel must be less than MaxStockLevel.");

            product.SKU = dto.SKU;
            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Category = dto.Category;
            product.Brand = dto.Brand;
            product.UnitOfMeasure = dto.UnitOfMeasure;
            product.CostPrice = dto.CostPrice;
            product.SellingPrice = dto.SellingPrice;
            product.ReorderLevel = dto.ReorderLevel;
            product.MaxStockLevel = dto.MaxStockLevel;
            product.LeadTimeDays = dto.LeadTimeDays;
            product.Barcode = dto.Barcode;
            product.ImageUrl = dto.ImageUrl;
            product.IsActive = dto.IsActive;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(product);
        }

        public async Task<bool> DeleteProductAsync(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return false;

            // Note: In an independent microservice, we don't check for cross-service references here.
            // Referential integrity is managed via events or the Orchestrator.
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ProductResponseDto>> SearchProductsAsync(string q)
        {
            var query = _context.Products.AsQueryable();
            
            if (!string.IsNullOrEmpty(q))
            {
                q = q.ToLower();
                query = query.Where(p => 
                    p.Name.ToLower().Contains(q) || 
                    p.SKU.ToLower().Contains(q) || 
                    (p.Barcode != null && p.Barcode.ToLower().Contains(q)) ||
                    (p.Category != null && p.Category.ToLower().Contains(q)) ||
                    (p.Brand != null && p.Brand.ToLower().Contains(q))
                );
            }

            var results = await query.ToListAsync();
            return results.Select(MapToDto);
        }

        private ProductResponseDto MapToDto(Product p) => new ProductResponseDto
        {
            ProductId = p.ProductId,
            SKU = p.SKU,
            Name = p.Name,
            Description = p.Description,
            Category = p.Category,
            Brand = p.Brand,
            UnitOfMeasure = p.UnitOfMeasure,
            CostPrice = p.CostPrice,
            SellingPrice = p.SellingPrice,
            ReorderLevel = p.ReorderLevel,
            MaxStockLevel = p.MaxStockLevel,
            LeadTimeDays = p.LeadTimeDays,
            Barcode = p.Barcode,
            ImageUrl = p.ImageUrl,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}
