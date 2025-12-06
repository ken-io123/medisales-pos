namespace MediSales.API.DTOs.Products
{
    public class AlertCheckResultDto
    {
        public int LowStockAlertsGenerated { get; set; }
        public int ExpiringProductsFound { get; set; }
        public int OutOfStockProducts { get; set; }
        public DateTime CheckedAt { get; set; }
    }
}
