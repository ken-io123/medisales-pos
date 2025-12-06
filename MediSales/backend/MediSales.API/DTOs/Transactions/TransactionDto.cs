using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.Transactions
{
    /// <summary>
    /// Transaction data for API responses.
    /// </summary>
    public class TransactionDto
    {
        public int TransactionId { get; set; }
        public string TransactionCode { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string StaffName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal SubtotalAmount { get; set; }
        public DiscountType DiscountType { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal DiscountPercentage { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? PaymentReferenceNumber { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal ChangeAmount { get; set; }
        public DateTime TransactionDate { get; set; }
        public bool IsVoided { get; set; }
        public DateTime? VoidedAt { get; set; }
        public int? VoidedBy { get; set; }
        public string? VoidedByName { get; set; }
        public string? VoidReason { get; set; }
        public List<TransactionItemDto> Items { get; set; } = new();
        public string ItemsSummary { get; set; } = string.Empty;
    }
}
