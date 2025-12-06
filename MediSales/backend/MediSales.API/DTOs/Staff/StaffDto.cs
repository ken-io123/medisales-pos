namespace MediSales.API.DTOs.Staff
{
    /// <summary>
    /// Staff member data for API responses.
    /// </summary>
    public class StaffDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public DateTime? LastLogin { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public bool IsOnlineNow { get; set; }
    }
}
