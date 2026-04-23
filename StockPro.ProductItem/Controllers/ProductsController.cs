using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.ProductItem.DTOs;
using StockPro.ProductItem.Services;
using System;
using System.Threading.Tasks;

namespace StockPro.ProductItem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _productService.GetAllProductsAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpGet("barcode/{code}")]
        public async Task<IActionResult> GetByBarcode(string code)
        {
            var product = await _productService.GetProductByBarcodeAsync(code);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            var results = await _productService.SearchProductsAsync(q);
            return Ok(results);
        }

        [HttpPost]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            try
            {
                var product = await _productService.CreateProductAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = product.ProductId }, product);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ProductUpdateDto dto)
        {
            try
            {
                var product = await _productService.UpdateProductAsync(id, dto);
                if (product == null) return NotFound();
                return Ok(product);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _productService.DeleteProductAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
