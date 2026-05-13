using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockPro.StockMovement.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace StockPro.StockMovement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockController : ControllerBase
    {
        private readonly InventoryDbContext _context;

        public StockController(InventoryDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStockLevels([FromQuery] Guid? warehouseId, [FromQuery] Guid? productId)
        {
            var query = _context.StockLevels.AsQueryable();

            if (warehouseId.HasValue)
                query = query.Where(s => s.WarehouseId == warehouseId.Value);

            if (productId.HasValue)
                query = query.Where(s => s.ProductId == productId.Value);

            var stock = await query.ToListAsync();
            return Ok(stock);
        }
    }
}
