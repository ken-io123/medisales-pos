namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Staff performance metrics.
    /// </summary>
    public class StaffPerformanceDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
        public int TransactionCount { get; set; }
        public decimal AverageTransactionAmount { get; set; }
        public int TotalItemsSold { get; set; }
        public decimal TotalDiscounts { get; set; }
    }
}
