using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.Purchase.DTOs;
using StockPro.Purchase.Services;
using System.Security.Claims;

namespace StockPro.Purchase.Controllers;

[ApiController]
[Route("api/purchase-orders")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseService _service;
    private readonly ILogger<PurchaseOrdersController> _logger;

    public PurchaseOrdersController(IPurchaseService service, ILogger<PurchaseOrdersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var pos = await _service.GetAllPOsAsync(status);
        return Ok(pos);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var po = await _service.GetPOByIdAsync(id);
            return Ok(po);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER")]
    public async Task<IActionResult> Create([FromBody] CreatePODto dto)
    {
        try
        {
            var po = await _service.CreatePOAsync(dto, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = po.PoId }, po);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}/submit")]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER")]
    public async Task<IActionResult> Submit(Guid id)
    {
        try
        {
            var po = await _service.SubmitPOAsync(id, GetUserId());
            return Ok(po);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("approve")]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER")]
    public async Task<IActionResult> Approve([FromBody] ApprovePODto dto)
    {
        try
        {
            var po = await _service.ApprovePOAsync(dto, GetUserId());
            return Ok(po);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("reject")]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER")]
    public async Task<IActionResult> Reject([FromBody] RejectPODto dto)
    {
        try
        {
            var po = await _service.RejectPOAsync(dto, GetUserId());
            return Ok(po);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("receive")]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER,WAREHOUSE STAFF")]
    public async Task<IActionResult> Receive([FromBody] ReceiveGoodsDto dto)
    {
        try
        {
            var po = await _service.ReceiveGoodsAsync(dto, GetUserId());
            return Ok(po);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
