using MediSales.API.Models.Entities;

namespace MediSales.API.Repositories.Interfaces
{
    /// <summary>Repository for stock alert data access.</summary>
    public interface IStockAlertRepository
    {
        Task<IEnumerable<StockAlert>> GetActiveAlertsAsync();
        Task<StockAlert?> GetAlertByIdAsync(int alertId);
        Task<StockAlert> CreateAlertAsync(StockAlert alert);
        Task<StockAlert> UpdateAlertAsync(StockAlert alert);
        Task<bool> AlertExistsAsync(int productId, Models.Enums.AlertType alertType);
    }
}
