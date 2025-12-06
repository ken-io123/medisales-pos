namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Sales report summary.
    /// </summary>
    public class SalesReportDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalSales { get; set; }
        public int TransactionCount { get; set; }
        public decimal AverageTransactionAmount { get; set; }
        public decimal TotalDiscounts { get; set; }
        public decimal TotalSubtotal { get; set; }
        public int TotalItemsSold { get; set; }
    }
}
