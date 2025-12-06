using MediSales.API.DTOs.Alerts;
using MediSales.API.Models.Enums;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for managing stock alerts.</summary>
    public interface IStockAlertService
    {
        Task<IEnumerable<StockAlertDto>> CheckLowStockAsync();
        Task<IEnumerable<StockAlertDto>> CheckExpiringAsync();
        Task<IEnumerable<StockAlertDto>> GetActiveAlertsAsync();
        Task<IEnumerable<StockAlertDto>> GetAlertsByTypeAsync(params AlertType[] alertTypes);
        Task<IEnumerable<StockAlertDto>> GetExpirationAlertsAsync();
        Task<IEnumerable<StockAlertDto>> GetStockAlertsOnlyAsync();
        Task<StockAlertDto> ResolveAlertAsync(int alertId, int resolvedBy);
        Task<IEnumerable<StockAlertDto>> RunAllChecksAsync();
        Task<int> AutoResolveAlertsAsync();
    }
}
