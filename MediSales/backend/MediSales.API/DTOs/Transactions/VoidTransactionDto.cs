using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Transactions
{
    /// <summary>
    /// Request to void a transaction.
    /// </summary>
    public class VoidTransactionDto
    {
        [Required(ErrorMessage = "Void reason is required")]
        [MaxLength(500, ErrorMessage = "Void reason cannot exceed 500 characters")]
        public string VoidReason { get; set; } = string.Empty;
    }
}
