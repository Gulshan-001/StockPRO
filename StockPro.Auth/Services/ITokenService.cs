using StockPro.Auth.Models;

namespace StockPro.Auth.Services;

public interface ITokenService
{
    string GenerateToken(ApplicationUser user, string role);
}
