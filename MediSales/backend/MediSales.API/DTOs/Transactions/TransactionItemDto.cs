using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Transactions
{
    /// <summary>
    /// Transaction line item data.
    /// </summary>
    public class TransactionItemDto
    {
        public int TransactionItemId { get; set; }

        [Required(ErrorMessage = "Product ID is required")]
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;
        public string? ProductCode { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Unit price is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }
    }
}
