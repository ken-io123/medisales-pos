using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Represents an individual item within a transaction.
    /// </summary>
    public class TransactionItem
    {
        [Key]
        public int TransactionItemId { get; set; }

        [Required(ErrorMessage = "Transaction ID is required")]
        [ForeignKey(nameof(Transaction))]
        public int TransactionId { get; set; }

        [Required(ErrorMessage = "Product ID is required")]
        [ForeignKey(nameof(Product))]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Product name is required")]
        [MaxLength(100, ErrorMessage = "Product name cannot exceed 100 characters")]
        public string ProductName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Unit price is required")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0.01, 999999.99, ErrorMessage = "Unit price must be between 0.01 and 999999.99")]
        public decimal UnitPrice { get; set; }

        [Required(ErrorMessage = "Subtotal is required")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0.01, 999999.99, ErrorMessage = "Subtotal must be between 0.01 and 999999.99")]
        public decimal Subtotal { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Transaction Transaction { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}
