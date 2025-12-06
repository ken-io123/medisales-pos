using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Tracks user actions for auditing purposes.
    /// </summary>
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Action { get; set; } = string.Empty;

        [Required]
        public string EntityName { get; set; } = string.Empty;

        public string? EntityId { get; set; }

        public int? UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public string? Details { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
