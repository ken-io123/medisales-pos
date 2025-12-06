using MediSales.API.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Represents a POS sales transaction.
    /// </summary>
    [Index(nameof(TransactionCode), IsUnique = true)]
    [Index(nameof(TransactionDate))]
    public class Transaction
    {
        [Key]
        public int TransactionId { get; set; }

        [Required(ErrorMessage = "Transaction code is required")]
        [MaxLength(20, ErrorMessage = "Transaction code cannot exceed 20 characters")]
        public string TransactionCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "User ID is required")]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Total amount is required")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0, 999999.99, ErrorMessage = "Total amount must be between 0 and 999999.99")]
        public decimal TotalAmount { get; set; }

        [Required(ErrorMessage = "Subtotal amount is required")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0, 999999.99, ErrorMessage = "Subtotal amount must be between 0 and 999999.99")]
        public decimal SubtotalAmount { get; set; }

        [Required]
        public DiscountType DiscountType { get; set; } = DiscountType.None;

        [Column(TypeName = "decimal(10,2)")]
        [Range(0, 999999.99, ErrorMessage = "Discount amount must be between 0 and 999999.99")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100, ErrorMessage = "Discount percentage must be between 0 and 100")]
        public decimal DiscountPercentage { get; set; } = 0;

        [Required(ErrorMessage = "Payment method is required")]
        public PaymentMethod PaymentMethod { get; set; }

        [MaxLength(50, ErrorMessage = "Payment reference number cannot exceed 50 characters")]
        public string? PaymentReferenceNumber { get; set; }

        [Required(ErrorMessage = "Amount paid is required")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0, 999999.99, ErrorMessage = "Amount paid must be between 0 and 999999.99")]
        public decimal AmountPaid { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        [Range(0, 999999.99, ErrorMessage = "Change amount must be between 0 and 999999.99")]
        public decimal ChangeAmount { get; set; } = 0;

        [Required(ErrorMessage = "Transaction date is required")]
        public DateTime TransactionDate { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsVoided { get; set; } = false;

        public DateTime? VoidedAt { get; set; }

        [ForeignKey(nameof(VoidedByUser))]
        public int? VoidedBy { get; set; }

        [MaxLength(500, ErrorMessage = "Void reason cannot exceed 500 characters")]
        public string? VoidReason { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual User? VoidedByUser { get; set; }
        public virtual ICollection<TransactionItem> TransactionItems { get; set; } = new List<TransactionItem>();
    }
}
