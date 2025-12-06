namespace MediSales.API.DTOs.Products
{
    public class ExpiringProductsStatsDto
    {
        public int TotalExpiring { get; set; }
        public int ExpiringIn7Days { get; set; }
        public int ExpiringIn30Days { get; set; }
        public int ExpiringIn60Days { get; set; }
        public Dictionary<string, int> ByCategory { get; set; } = new();
        public decimal TotalValueAtRisk { get; set; }
    }
}
