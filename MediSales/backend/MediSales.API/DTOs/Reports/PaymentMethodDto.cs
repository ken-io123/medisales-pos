using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Payment method sales data.
    /// </summary>
    public class PaymentMethodDto
    {
        public PaymentMethod PaymentMethod { get; set; }
        public string PaymentMethodName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int TransactionCount { get; set; }
        public decimal Percentage { get; set; }
    }
}
