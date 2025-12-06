using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Represents a pharmaceutical product in the inventory.
    /// </summary>
    [Index(nameof(ProductCode), IsUnique = true)]
    [Index(nameof(ProductName))]
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Product code is required")]
        [MaxLength(20, ErrorMessage = "Product code cannot exceed 20 characters")]
        public string ProductCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product name is required")]
        [MaxLength(100, ErrorMessage = "Product name cannot exceed 100 characters")]
        public string ProductName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        [MaxLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Unit price is required")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0.01, 999999.99, ErrorMessage = "Unit price must be between 0.01 and 999999.99")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative")]
        public int StockQuantity { get; set; } = 0;

        [MaxLength(100, ErrorMessage = "Supplier name cannot exceed 100 characters")]
        public string? SupplierName { get; set; }

        [Required(ErrorMessage = "Expiry date is required")]
        public DateTime ExpiryDate { get; set; }

        public DateTime? ManufacturingDate { get; set; }

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsArchived { get; set; } = false;

        public DateTime? ArchivedAt { get; set; }

        [ForeignKey(nameof(ArchivedByUser))]
        public int? ArchivedBy { get; set; }

        // Navigation properties
        public virtual ICollection<TransactionItem> TransactionItems { get; set; } = new List<TransactionItem>();
        public virtual ICollection<StockAlert> StockAlerts { get; set; } = new List<StockAlert>();
        public virtual User? ArchivedByUser { get; set; }
    }
}
