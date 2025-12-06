using MediSales.API.Models.Entities;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for audit logging operations.</summary>
    public interface IAuditLogService
    {
        Task LogAsync(string action, string entityName, string entityId, int? userId, string details);
        Task<IEnumerable<AuditLog>> GetLogsAsync(string? entityName = null, string? entityId = null);
    }
}
