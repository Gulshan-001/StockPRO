using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StockPro.Auth.DTOs;
using StockPro.Auth.Services;

namespace StockPro.Auth.Controllers;

/// <summary>
/// AdminController — ALL endpoints require [ADMIN] role.
/// Manages users, roles, and the immutable audit log.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN,INVENTORY MANAGER,MANAGER")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // ── Helper to extract the current actor's UserId from JWT ────────────────
    private string ActorId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? string.Empty;

    // =========================================================================
    // USER MANAGEMENT
    // =========================================================================

    /// <summary>GET /api/admin/users — Get all users (Admin only)</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _adminService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>GET /api/admin/users/{id} — Get single user by Id</summary>
    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserById(string id)
    {
        var user = await _adminService.GetUserByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });
        return Ok(user);
    }

    /// <summary>POST /api/admin/users — Admin creates a user with an explicit role</summary>
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var (success, error) = await _adminService.CreateUserAsync(dto, ActorId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "User created successfully." });
    }

    /// <summary>PUT /api/admin/users/{id} — Update user profile details</summary>
    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        var (success, error) = await _adminService.UpdateUserAsync(id, dto, ActorId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "User updated successfully." });
    }

    /// <summary>PUT /api/admin/users/{id}/deactivate — Deactivate a user (soft delete)</summary>
    [HttpPut("users/{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        var (success, error) = await _adminService.DeactivateUserAsync(id, ActorId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "User deactivated. Historical data preserved." });
    }

    /// <summary>PUT /api/admin/users/{id}/reactivate — Reactivate a previously deactivated user</summary>
    [HttpPut("users/{id}/reactivate")]
    public async Task<IActionResult> ReactivateUser(string id)
    {
        var (success, error) = await _adminService.ReactivateUserAsync(id, ActorId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "User reactivated successfully." });
    }

    // =========================================================================
    // ROLE MANAGEMENT
    // =========================================================================

    /// <summary>GET /api/admin/roles — List all available roles</summary>
    [HttpGet("roles")]
    public IActionResult GetAvailableRoles()
    {
        return Ok(_adminService.GetAvailableRoles());
    }

    /// <summary>PUT /api/admin/roles — Assign a new role to a user</summary>
    [HttpPut("roles")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.NewRole))
            return BadRequest(new { message = "UserId and NewRole are required." });

        var (success, error) = await _adminService.AssignRoleAsync(dto, ActorId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = $"Role '{dto.NewRole}' assigned successfully." });
    }

    // =========================================================================
    // AUDIT LOG
    // =========================================================================

    /// <summary>
    /// GET /api/admin/audit — Retrieve immutable audit logs with optional filters.
    /// Supports: userId, action, entityName, fromDate, toDate query parameters.
    /// </summary>
    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? userId,
        [FromQuery] string? action,
        [FromQuery] string? entityName,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var filter = new AuditLogFilterDto
        {
            UserId     = userId,
            Action     = action,
            EntityName = entityName,
            FromDate   = fromDate,
            ToDate     = toDate
        };

        var logs = await _adminService.GetAuditLogsAsync(filter);
        return Ok(logs);
    }

    /// <summary>
    /// POST /api/admin/audit/log — Internal endpoint for other microservices to
    /// submit audit events via synchronous HTTP (UC8 cross-service integration).
    /// This endpoint uses [AllowAnonymous] but validates a shared internal API key
    /// via the X-Internal-Key header to prevent public abuse.
    /// </summary>
    [HttpPost("audit/log")]
    [AllowAnonymous]
    public async Task<IActionResult> LogExternalAction(
        [FromBody] LogActionDto dto,
        [FromHeader(Name = "X-Internal-Key")] string? internalKey,
        [FromServices] IConfiguration config)
    {
        var expectedKey = config["InternalApiKey"];

        // Reject if key is not configured or does not match
        if (string.IsNullOrEmpty(expectedKey) || internalKey != expectedKey)
            return Unauthorized(new { message = "Invalid or missing internal API key." });

        if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.Action))
            return BadRequest(new { message = "UserId and Action are required." });

        await _adminService.LogActionAsync(dto);
        return Ok(new { message = "Audit event recorded." });
    }
}
