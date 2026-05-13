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

        [HttpGet("debug-auth")]
        [AllowAnonymous]
        public IActionResult DebugAuth()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value });
            var identity = User.Identity;
            return Ok(new
            {
                IsAuthenticated = identity?.IsAuthenticated,
                Name = identity?.Name,
                Claims = claims,
                Roles = User.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value)
            });
        }

        public MovementController(IMovementService movementService, ILogger<MovementController> logger)
        {
            _movementService = movementService;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value;
            
            if (Guid.TryParse(userIdClaim, out var userId)) return userId;
            return Guid.Empty;
        }

        [HttpPost("stock-in")]
        [HttpPost("stock_in")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> StockIn([FromBody] StockInRequestDto request)
        {
            try
            {
                var result = await _movementService.StockInAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = msg });
            }
        }

        [HttpPost("stock-out")]
        [HttpPost("stock_out")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> StockOut([FromBody] StockOutRequestDto request)
        {
            try
            {
                var result = await _movementService.StockOutAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = msg });
            }
        }

        [HttpPost("transfer")]
        [HttpPost("transfer_stock")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> Transfer([FromBody] StockTransferRequestDto request)
        {
            try
            {
                var result = await _movementService.TransferAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = msg });
            }
        }

        [HttpPost("adjustment")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> Adjustment([FromBody] StockAdjustmentRequestDto request)
        {
            try
            {
                var result = await _movementService.AdjustmentAsync(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = msg });
            }
        }

        [HttpGet("history")]
        [Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER,STAFF,WAREHOUSE STAFF,OFFICER")]
        public async Task<IActionResult> GetHistory([FromQuery] Guid? productId, [FromQuery] Guid? warehouseId, [FromQuery] string? type, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            _logger.LogInformation($"GetHistory called. productId: {productId}, warehouseId: {warehouseId}, type: {type}, start: {startDate}, end: {endDate}");
            try
            {
                var history = await _movementService.GetHistoryAsync(productId, warehouseId, type, startDate, endDate);
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
