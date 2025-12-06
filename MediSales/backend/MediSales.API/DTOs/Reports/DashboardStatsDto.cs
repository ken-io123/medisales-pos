using System.Text.Json.Serialization;

namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Dashboard statistics overview.
    /// </summary>
    public class DashboardStatsDto
    {
        [JsonPropertyName("totalRevenue")]
        public decimal TotalRevenue { get; set; }
        
        [JsonPropertyName("totalTransactions")]
        public int TotalTransactions { get; set; }
        
        [JsonPropertyName("totalProducts")]
        public int TotalProducts { get; set; }
        
        [JsonPropertyName("lowStockProducts")]
        public int LowStockProducts { get; set; }
        
        [JsonPropertyName("lowStockItems")]
        public int LowStockItems => LowStockProducts;
        
        [JsonPropertyName("todaySales")]
        public decimal TodaySales { get; set; }
        
        [JsonPropertyName("weeklySales")]
        public decimal WeeklySales { get; set; }
        
        [JsonPropertyName("monthlySales")]
        public decimal MonthlySales { get; set; }
        
        [JsonPropertyName("expiringSoon")]
        public int ExpiringSoon { get; set; }
        
        [JsonPropertyName("revenueGrowthPercent")]
        public double RevenueGrowthPercent { get; set; }
        
        [JsonPropertyName("transactionGrowthPercent")]
        public double TransactionGrowthPercent { get; set; }
    }
}
