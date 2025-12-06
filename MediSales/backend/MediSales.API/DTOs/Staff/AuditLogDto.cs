using System;

namespace MediSales.API.DTOs.Staff
{
    public class AuditLogDto
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; } // Full Name or Username
        public string? UserRole { get; set; }
        public string? Details { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
