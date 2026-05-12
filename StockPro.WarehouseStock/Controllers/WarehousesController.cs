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
    public class WarehousesController : ControllerBase
    {
        private readonly IWarehouseService _warehouseService;

        public WarehousesController(IWarehouseService warehouseService)
        {
            _warehouseService = warehouseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var warehouses = await _warehouseService.GetAllWarehousesAsync();
            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var warehouse = await _warehouseService.GetWarehouseByIdAsync(id);
            if (warehouse == null) return NotFound();
            return Ok(warehouse);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> Create([FromBody] WarehouseCreateDto dto)
        {
            var warehouse = await _warehouseService.CreateWarehouseAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = warehouse.WarehouseId }, warehouse);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> Update(Guid id, [FromBody] WarehouseUpdateDto dto)
        {
            var warehouse = await _warehouseService.UpdateWarehouseAsync(id, dto);
            if (warehouse == null) return NotFound();
            return Ok(warehouse);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var success = await _warehouseService.DeleteWarehouseAsync(id);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
