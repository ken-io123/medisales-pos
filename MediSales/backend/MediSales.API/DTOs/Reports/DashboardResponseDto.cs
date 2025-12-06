using System.Text.Json.Serialization;

namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// Top selling products response.
    /// </summary>
    public class TopProductResponseDto
    {
        [JsonPropertyName("productId")]
        public int ProductId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("unitsSold")]
        public int UnitsSold { get; set; }

        [JsonPropertyName("revenue")]
        public decimal Revenue { get; set; }
    }

    /// <summary>
    /// Recent transactions response.
    /// </summary>
    public class RecentTransactionResponseDto
    {
        [JsonPropertyName("transactionId")]
        public int TransactionId { get; set; }

        [JsonPropertyName("transactionCode")]
        public string TransactionCode { get; set; } = string.Empty;

        [JsonPropertyName("staffName")]
        public string StaffName { get; set; } = string.Empty;

        [JsonPropertyName("paymentMethod")]
        public string PaymentMethod { get; set; } = string.Empty;

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Sales chart data response.
    /// </summary>
    public class SalesChartResponseDto
    {
        [JsonPropertyName("day")]
        public string Day { get; set; } = string.Empty;

        [JsonPropertyName("totalSales")]
        public decimal TotalSales { get; set; }
    }
}
