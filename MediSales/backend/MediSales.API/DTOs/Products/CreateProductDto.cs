using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Products
{
    /// <summary>
    /// Request to create a new product.
    /// </summary>
    public class CreateProductDto
    {
        [Required(ErrorMessage = "Product code is required")]
        [StringLength(20, ErrorMessage = "Product code cannot exceed 20 characters")]
        public string ProductCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product name is required")]
        [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters")]
        public string ProductName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string Category { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Unit price is required")]
        [Range(0.01, 999999.99, ErrorMessage = "Unit price must be between 0.01 and 999999.99")]
        public decimal UnitPrice { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative")]
        public int StockQuantity { get; set; }

        [StringLength(100, ErrorMessage = "Supplier name cannot exceed 100 characters")]
        public string? SupplierName { get; set; }

        public DateTime? ManufacturingDate { get; set; }

        [Required(ErrorMessage = "Expiry date is required")]
        public DateTime ExpiryDate { get; set; }
    }
}
