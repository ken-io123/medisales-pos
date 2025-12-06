namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Inventory report data.
    /// </summary>
    public class InventoryReportDto
    {
        public int TotalProducts { get; set; }
        public decimal TotalInventoryValue { get; set; }
        public int TotalStockUnits { get; set; }
        public int LowStockProducts { get; set; }
        public int OutOfStockProducts { get; set; }
        public int ExpiringProducts { get; set; }
        public List<ProductInventoryDto> Products { get; set; } = new();
    }

    /// <summary>
    /// Product inventory details.
    /// </summary>
    public class ProductInventoryDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductCode { get; set; }
        public string Category { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalValue { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int DaysUntilExpiry { get; set; }
        public string StockStatus { get; set; } = string.Empty;
    }
}
