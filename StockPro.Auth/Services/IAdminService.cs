using StockPro.Auth.DTOs;

namespace StockPro.Auth.Services;

public interface IAdminService
{
    // ── User Management ───────────────────────────────────────────────────────
    Task<List<UserManagementDto>> GetAllUsersAsync();
    Task<UserManagementDto?> GetUserByIdAsync(string userId);
    Task<(bool Success, string? Error)> CreateUserAsync(CreateUserDto dto, string actorId);
    Task<(bool Success, string? Error)> UpdateUserAsync(string userId, UpdateUserDto dto, string actorId);
    Task<(bool Success, string? Error)> DeactivateUserAsync(string userId, string actorId);
    Task<(bool Success, string? Error)> ReactivateUserAsync(string userId, string actorId);

    // ── Role Management ───────────────────────────────────────────────────────
    Task<(bool Success, string? Error)> AssignRoleAsync(AssignRoleDto dto, string actorId);
    IEnumerable<string> GetAvailableRoles();

    // ── Audit Log ─────────────────────────────────────────────────────────────
    Task<List<AuditLogDto>> GetAuditLogsAsync(AuditLogFilterDto filter);
    Task LogActionAsync(LogActionDto dto);
}
