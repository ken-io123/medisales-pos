using MediSales.API.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Represents a system user (Administrator or Staff).
    /// </summary>
    [Index(nameof(Username), IsUnique = true)]
    [Index(nameof(Email), IsUnique = true)]
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Username is required")]
        [MaxLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password hash is required")]
        [MaxLength(255)]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }

        [Required]
        public UserStatus Status { get; set; } = UserStatus.Offline;

        [Required]
        public bool IsOnlineNow { get; set; } = false;

        public DateTime? LastSeenAt { get; set; }

        [MaxLength(500, ErrorMessage = "Profile picture URL cannot exceed 500 characters")]
        public string? ProfilePictureUrl { get; set; }

        [MaxLength(255, ErrorMessage = "Profile picture file name cannot exceed 255 characters")]
        public string? ProfilePictureFileName { get; set; }

        public DateTime? ProfilePictureUploadedAt { get; set; }

        public DateTime? LastLoginDate { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsArchived { get; set; } = false;

        public DateTime? ArchivedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public virtual ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public virtual ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public virtual ICollection<StockAlert> ResolvedAlerts { get; set; } = new List<StockAlert>();
    }
}
