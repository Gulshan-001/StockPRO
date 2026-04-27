using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.StockMovement.DTOs;
using StockPro.StockMovement.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace StockPro.StockMovement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MovementController : ControllerBase
    {
        private readonly IMovementService _movementService;
        private readonly ILogger<MovementController> _logger;

        public MovementController(IMovementService movementService, ILogger<MovementController> logger)
        {
            _movementService = movementService;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId)) return userId;
            return Guid.Empty;
        }

        [HttpPost("stock-in")]
        [HttpPost("stock_in")]
        [Authorize(Roles = "WAREHOUSE STAFF,INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> StockIn([FromBody] StockInRequestDto request)
        {
            try
            {
                var result = await _movementService.StockInAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("stock-out")]
        [HttpPost("stock_out")]
        [Authorize(Roles = "WAREHOUSE STAFF,INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> StockOut([FromBody] StockOutRequestDto request)
        {
            try
            {
                var result = await _movementService.StockOutAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("transfer")]
        [HttpPost("transfer_stock")]
        [Authorize(Roles = "WAREHOUSE STAFF,INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Transfer([FromBody] StockTransferRequestDto request)
        {
            try
            {
                var result = await _movementService.TransferAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("adjustment")]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN")]
        public async Task<IActionResult> Adjustment([FromBody] StockAdjustmentRequestDto request)
        {
            try
            {
                var result = await _movementService.AdjustmentAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("history")]
        [Authorize(Roles = "INVENTORY MANAGER,ADMIN,WAREHOUSE STAFF")]
        public async Task<IActionResult> GetHistory([FromQuery] Guid? productId, [FromQuery] Guid? warehouseId, [FromQuery] string? type)
        {
            _logger.LogInformation($"GetHistory called. productId: {productId}, warehouseId: {warehouseId}, type: {type}");
            try
            {
                var history = await _movementService.GetHistoryAsync(productId, warehouseId, type);
                _logger.LogInformation($"GetHistory returning {history.Count()} items");
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetHistory");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
