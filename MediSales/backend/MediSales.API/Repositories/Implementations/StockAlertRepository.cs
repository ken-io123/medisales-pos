using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Repositories.Implementations
{
    /// <summary>Repository for stock alert data access.</summary>
    public class StockAlertRepository : IStockAlertRepository
    {
        private readonly ApplicationDbContext _context;

        public StockAlertRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockAlert>> GetActiveAlertsAsync()
        {
            return await _context.StockAlerts
                .Include(a => a.Product)
                .Include(a => a.ResolvedByUser)
                .Where(a => !a.IsResolved)
                .OrderByDescending(a => a.AlertDate)
                .ToListAsync();
        }

        public async Task<StockAlert?> GetAlertByIdAsync(int alertId)
        {
            return await _context.StockAlerts
                .Include(a => a.Product)
                .Include(a => a.ResolvedByUser)
                .FirstOrDefaultAsync(a => a.StockAlertId == alertId);
        }

        public async Task<StockAlert> CreateAlertAsync(StockAlert alert)
        {
            _context.StockAlerts.Add(alert);
            await _context.SaveChangesAsync();
            
            // Reload with navigation properties
            return await GetAlertByIdAsync(alert.StockAlertId)
                ?? throw new InvalidOperationException("Failed to create alert");
        }

        public async Task<StockAlert> UpdateAlertAsync(StockAlert alert)
        {
            _context.StockAlerts.Update(alert);
            await _context.SaveChangesAsync();
            
            // Reload with navigation properties
            return await GetAlertByIdAsync(alert.StockAlertId)
                ?? throw new InvalidOperationException("Failed to update alert");
        }

        public async Task<bool> AlertExistsAsync(int productId, AlertType alertType)
        {
            return await _context.StockAlerts
                .AnyAsync(a => a.ProductId == productId && a.AlertType == alertType && !a.IsResolved);
        }
    }
}
