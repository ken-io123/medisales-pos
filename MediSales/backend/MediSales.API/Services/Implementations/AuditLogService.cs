using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Services.Implementations
{
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;

        public AuditLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(string action, string entityName, string entityId, int? userId, string details)
        {
            var log = new AuditLog
            {
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                UserId = userId,
                Details = details,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetLogsAsync(string? entityName = null, string? entityId = null)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(entityName))
            {
                query = query.Where(l => l.EntityName == entityName);
            }

            if (!string.IsNullOrEmpty(entityId))
            {
                query = query.Where(l => l.EntityId == entityId);
            }

            return await query
                .Include(l => l.User)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }
    }
}
