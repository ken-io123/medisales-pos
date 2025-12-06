namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Category sales data.
    /// </summary>
    public class CategorySalesDto
    {
        public string Category { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
        public int TotalQuantitySold { get; set; }
        public int TransactionCount { get; set; }
        public decimal Percentage { get; set; }
    }
}
