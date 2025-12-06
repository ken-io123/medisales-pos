namespace MediSales.API.DTOs.Products
{
    /// <summary>
    /// Filter options for product search.
    /// </summary>
    public class ProductSearchFilterDto
    {
        public string? SearchTerm { get; set; }
        public string? Category { get; set; }
        public int? MinStock { get; set; }
        public int? MaxStock { get; set; }
        public int? ExpiringInDays { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
    }
}
