using System.ComponentModel.DataAnnotations;
using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.Transactions
{
    /// <summary>
    /// Request to create a new transaction.
    /// </summary>
    public class CreateTransactionDto
    {
        [Required(ErrorMessage = "User ID is required")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Transaction items are required")]
        [MinLength(1, ErrorMessage = "At least one item is required")]
        public List<TransactionItemDto> Items { get; set; } = new();

        [Required(ErrorMessage = "Discount type is required")]
        public DiscountType DiscountType { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        public PaymentMethod PaymentMethod { get; set; }

        [MaxLength(50, ErrorMessage = "Payment reference number cannot exceed 50 characters")]
        public string? PaymentReferenceNumber { get; set; }

        [Required(ErrorMessage = "Amount paid is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount paid must be greater than 0")]
        public decimal AmountPaid { get; set; }
    }
}
