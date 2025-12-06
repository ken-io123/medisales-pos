using MediSales.API.DTOs.Reports;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for generating reports and analytics.</summary>
    public interface IReportsService
    {
        Task<SalesReportDto> GetDailySalesReportAsync(DateTime date);
        Task<SalesReportDto> GetStaffDailySalesReportAsync(int userId, DateTime date);
        Task<SalesReportDto> GetWeeklySalesReportAsync(DateTime weekStart);
        Task<SalesReportDto> GetMonthlySalesReportAsync(int month, int year);
        Task<SalesReportDto> GetYearlySalesReportAsync(int year);
        Task<SalesChartDto> GetSalesTrendAsync(string period);
        Task<IEnumerable<ProductSalesDto>> GetTopSellingProductsAsync(int count);
        Task<IEnumerable<CategorySalesDto>> GetSalesByCategoryAsync();
        Task<IEnumerable<PaymentMethodDto>> GetSalesByPaymentMethodAsync();
        Task<IEnumerable<StaffPerformanceDto>> GetStaffPerformanceAsync();
        Task<InventoryReportDto> GetInventoryReportAsync();
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<SalesChartDto> GetSalesChartDataAsync(int days);
        Task<HistoricalSalesDto> GetSalesBySpecificDateAsync(DateTime date);
        Task<SalesComparisonDto> CompareSalesBetweenDatesAsync(DateTime date1, DateTime date2);
    }
}
