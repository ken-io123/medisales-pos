using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Transactions
{
    /// <summary>
    /// Filter options for transaction queries.
    /// </summary>
    public class TransactionFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? StaffId { get; set; }

        [MaxLength(50)]
        public string? PaymentMethod { get; set; }

        [MaxLength(50)]
        public string? DiscountType { get; set; }

        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }

        [MaxLength(100)]
        public string? SearchTerm { get; set; }

        public bool IncludeVoided { get; set; } = false;

        [MaxLength(20)]
        public string? Status { get; set; } = "active";

        public int? Page { get; set; } = 1;
        public int? PageSize { get; set; } = 50;
    }
}
