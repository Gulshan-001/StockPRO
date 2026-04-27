using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockPro.Purchase.DTOs;
using StockPro.Purchase.Services;

namespace StockPro.Purchase.Controllers;

[ApiController]
[Route("api/suppliers")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly IPurchaseService _service;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(IPurchaseService service, ILogger<SuppliersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var suppliers = await _service.GetAllSuppliersAsync();
        return Ok(suppliers);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var supplier = await _service.GetSupplierByIdAsync(id);
            return Ok(supplier);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
    {
        try
        {
            var supplier = await _service.CreateSupplierAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = supplier.SupplierId }, supplier);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN,INVENTORY MANAGER")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupplierDto dto)
    {
        try
        {
            var supplier = await _service.UpdateSupplierAsync(id, dto);
            return Ok(supplier);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
