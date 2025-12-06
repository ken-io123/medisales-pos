using MediSales.API.DTOs.Authentication;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for authentication operations.</summary>
    public interface IAuthenticationService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginRequest);
        Task<bool> LogoutAsync(int userId);
        Task<LoginResponseDto?> RegisterAsync(RegisterStaffDto registerRequest);
    }
}
