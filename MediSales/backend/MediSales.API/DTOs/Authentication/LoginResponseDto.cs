using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.Authentication
{
    /// <summary>
    /// Login response with user info.
    /// </summary>
    public class LoginResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string? Token { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
