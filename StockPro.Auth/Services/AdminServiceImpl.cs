using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StockPro.Auth.Data;
using StockPro.Auth.DTOs;
using StockPro.Auth.Models;

namespace StockPro.Auth.Services;

public class AdminServiceImpl : IAdminService
{
    private static readonly string[] ValidRoles = { "ADMIN", "INVENTORY MANAGER", "STAFF" };

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly AuthDbContext _db;
    private readonly ILogger<AdminServiceImpl> _logger;

    public AdminServiceImpl(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        AuthDbContext db,
        ILogger<AdminServiceImpl> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
        _logger = logger;
    }

    // ── User Management ───────────────────────────────────────────────────────

    public async Task<List<UserManagementDto>> GetAllUsersAsync()
    {
        var users = _userManager.Users.ToList();
        var result = new List<UserManagementDto>();

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(MapToDto(u, roles.FirstOrDefault() ?? "STAFF"));
        }

        return result;
    }

    public async Task<UserManagementDto?> GetUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;
        var roles = await _userManager.GetRolesAsync(user);
        return MapToDto(user, roles.FirstOrDefault() ?? "STAFF");
    }

    public async Task<(bool Success, string? Error)> CreateUserAsync(CreateUserDto dto, string actorId)
    {
        // Validate role
        if (!ValidRoles.Contains(dto.Role))
            return (false, $"Invalid role '{dto.Role}'. Must be one of: {string.Join(", ", ValidRoles)}");

        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return (false, "A user with this email already exists.");

        var user = new ApplicationUser
        {
            FullName = dto.FullName,
            Email = dto.Email,
            UserName = dto.Email,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return (false, string.Join("; ", result.Errors.Select(e => e.Description)));

        if (!await _roleManager.RoleExistsAsync(dto.Role))
            await _roleManager.CreateAsync(new IdentityRole(dto.Role));

        await _userManager.AddToRoleAsync(user, dto.Role);

        await LogActionAsync(new LogActionDto
        {
            UserId = actorId,
            Action = "CREATE_USER",
            EntityName = "ApplicationUser",
            EntityId = Guid.TryParse(user.Id, out var uid) ? uid : null,
            OldValue = null,
            NewValue = $"Email={dto.Email}, Role={dto.Role}"
        });

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> UpdateUserAsync(string userId, UpdateUserDto dto, string actorId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found.");

        var oldValue = $"FullName={user.FullName}, Phone={user.PhoneNumber}";

        user.FullName = dto.FullName;
        user.PhoneNumber = dto.PhoneNumber;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return (false, string.Join("; ", result.Errors.Select(e => e.Description)));

        await LogActionAsync(new LogActionDto
        {
            UserId = actorId,
            Action = "UPDATE_USER",
            EntityName = "ApplicationUser",
            EntityId = Guid.TryParse(userId, out var uid) ? uid : null,
            OldValue = oldValue,
            NewValue = $"FullName={dto.FullName}, Phone={dto.PhoneNumber}"
        });

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeactivateUserAsync(string userId, string actorId)
    {
        // Business Rule: cannot self-deactivate
        if (userId == actorId)
            return (false, "You cannot deactivate your own account.");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found.");

        var oldValue = $"IsActive={user.IsActive}";
        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        await LogActionAsync(new LogActionDto
        {
            UserId = actorId,
            Action = "DEACTIVATE_USER",
            EntityName = "ApplicationUser",
            EntityId = Guid.TryParse(userId, out var uid) ? uid : null,
            OldValue = oldValue,
            NewValue = "IsActive=false"
        });

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ReactivateUserAsync(string userId, string actorId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found.");

        var oldValue = $"IsActive={user.IsActive}";
        user.IsActive = true;
        await _userManager.UpdateAsync(user);

        await LogActionAsync(new LogActionDto
        {
            UserId = actorId,
            Action = "REACTIVATE_USER",
            EntityName = "ApplicationUser",
            EntityId = Guid.TryParse(userId, out var uid) ? uid : null,
            OldValue = oldValue,
            NewValue = "IsActive=true"
        });

        return (true, null);
    }

    // ── Role Management ───────────────────────────────────────────────────────

    public async Task<(bool Success, string? Error)> AssignRoleAsync(AssignRoleDto dto, string actorId)
    {
        // Business Rule: validate role is one of the defined set
        if (!ValidRoles.Contains(dto.NewRole))
            return (false, $"Invalid role '{dto.NewRole}'. Must be one of: {string.Join(", ", ValidRoles)}");

        var user = await _userManager.FindByIdAsync(dto.UserId);
        if (user == null) return (false, "User not found.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        var oldRole = currentRoles.FirstOrDefault() ?? "STAFF";

        if (oldRole == dto.NewRole)
            return (false, $"User already has role '{dto.NewRole}'.");

        // Remove all existing roles first, then assign the new one
        if (currentRoles.Any())
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

        if (!await _roleManager.RoleExistsAsync(dto.NewRole))
            await _roleManager.CreateAsync(new IdentityRole(dto.NewRole));

        var result = await _userManager.AddToRoleAsync(user, dto.NewRole);
        if (!result.Succeeded)
            return (false, string.Join("; ", result.Errors.Select(e => e.Description)));

        await LogActionAsync(new LogActionDto
        {
            UserId = actorId,
            Action = "ASSIGN_ROLE",
            EntityName = "ApplicationUser",
            EntityId = Guid.TryParse(dto.UserId, out var uid) ? uid : null,
            OldValue = $"Role={oldRole}",
            NewValue = $"Role={dto.NewRole}"
        });

        return (true, null);
    }

    public IEnumerable<string> GetAvailableRoles() => ValidRoles;

    // ── Audit Log ─────────────────────────────────────────────────────────────

    public async Task<List<AuditLogDto>> GetAuditLogsAsync(AuditLogFilterDto filter)
    {
        var query = _db.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.UserId))
            query = query.Where(a => a.UserId == filter.UserId);

        if (!string.IsNullOrWhiteSpace(filter.Action))
            query = query.Where(a => a.Action != null && a.Action.Contains(filter.Action));

        if (!string.IsNullOrWhiteSpace(filter.EntityName))
            query = query.Where(a => a.EntityName == filter.EntityName);

        if (filter.FromDate.HasValue)
            query = query.Where(a => a.Timestamp >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
            query = query.Where(a => a.Timestamp <= filter.ToDate.Value);

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Take(500) // Protect against unbounded queries
            .ToListAsync();

        return logs.Select(a => new AuditLogDto
        {
            AuditId     = a.AuditId,
            UserId      = a.UserId,
            UserFullName = a.User?.FullName,
            UserEmail   = a.User?.Email,
            Action      = a.Action,
            EntityName  = a.EntityName,
            EntityId    = a.EntityId,
            OldValue    = a.OldValue,
            NewValue    = a.NewValue,
            Timestamp   = a.Timestamp
        }).ToList();
    }

    /// <summary>
    /// LogAction is write-once (immutable). Failure falls back to ILogger so that
    /// audit log DB failure never breaks the primary business operation.
    /// </summary>
    public async Task LogActionAsync(LogActionDto dto)
    {
        try
        {
            var log = new AuditLog
            {
                AuditId    = Guid.NewGuid(),
                UserId     = dto.UserId,
                Action     = dto.Action,
                EntityName = dto.EntityName,
                EntityId   = dto.EntityId,
                OldValue   = dto.OldValue,
                NewValue   = dto.NewValue,
                Timestamp  = DateTime.UtcNow
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Fallback: ensure the application does not crash on audit failure
            _logger.LogError(ex,
                "AUDIT FALLBACK — failed to write audit log to DB. " +
                "UserId={UserId}, Action={Action}, Entity={Entity}, EntityId={EntityId}",
                dto.UserId, dto.Action, dto.EntityName, dto.EntityId);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static UserManagementDto MapToDto(ApplicationUser u, string role) =>
        new()
        {
            UserId      = u.Id,
            FullName    = u.FullName,
            Email       = u.Email ?? string.Empty,
            PhoneNumber = u.PhoneNumber,
            Role        = role,
            IsActive    = u.IsActive,
            CreatedAt   = u.CreatedAt,
            LastLoginAt = u.LastLoginAt
        };
}
