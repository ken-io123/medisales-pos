namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Product sales data.
    /// </summary>
    public class ProductSalesDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductCode { get; set; }
        public string Category { get; set; } = string.Empty;
        public int TotalQuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TransactionCount { get; set; }
        public int CurrentStock { get; set; }
    }
}
