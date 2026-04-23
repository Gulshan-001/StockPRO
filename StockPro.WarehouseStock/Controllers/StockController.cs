using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.WarehouseStock.DTOs;
using StockPro.WarehouseStock.Services;
using System;
using System.Threading.Tasks;

namespace StockPro.WarehouseStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockController : ControllerBase
    {
        private readonly IStockService _stockService;

        public StockController(IStockService stockService)
        {
            _stockService = stockService;
        }

        [HttpGet]
        public async Task<IActionResult> GetStock([FromQuery] Guid? warehouseId, [FromQuery] Guid? productId)
        {
            var stock = await _stockService.GetStockLevelsAsync(warehouseId, productId);
            return Ok(stock);
        }

        [HttpPost("initialize")]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Initialize([FromBody] StockInitializeDto dto)
        {
            try
            {
                var stock = await _stockService.InitializeStockAsync(dto);
                return Ok(stock);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{warehouseId}/{productId}")]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Update(Guid warehouseId, Guid productId, [FromBody] StockUpdateDto dto)
        {
            try
            {
                var stock = await _stockService.UpdateStockAsync(warehouseId, productId, dto);
                if (stock == null) return NotFound();
                return Ok(stock);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
