using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Authentication
{
    /// <summary>
    /// User login request data.
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
        public string Password { get; set; } = string.Empty;
    }
}
