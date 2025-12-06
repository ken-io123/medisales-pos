using MediSales.API.DTOs.Products;
using MediSales.API.Models.Enums;
using System.Text.Json.Serialization;

namespace MediSales.API.DTOs.Alerts
{
    /// <summary>
    /// Stock alert data for API responses.
    /// </summary>
    public class StockAlertDto
    {
        [JsonPropertyName("alertId")]
        public int StockAlertId { get; set; }

        [JsonPropertyName("productId")]
        public int ProductId { get; set; }

        [JsonPropertyName("product")]
        public ProductDto? Product { get; set; }

        [JsonPropertyName("productName")]
        public string ProductName { get; set; } = string.Empty;

        [JsonPropertyName("productCode")]
        public string? ProductCode { get; set; }

        [JsonPropertyName("alertType")]
        public AlertType AlertType { get; set; }

        [JsonPropertyName("message")]
        public string AlertMessage { get; set; } = string.Empty;

        [JsonPropertyName("currentStock")]
        public int CurrentStockLevel { get; set; }

        [JsonPropertyName("reorderLevel")]
        public int? ThresholdLevel { get; set; }

        [JsonPropertyName("daysUntilExpiry")]
        public int? DaysUntilExpiry { get; set; }

        [JsonPropertyName("expiryDate")]
        public DateTime? ExpiryDate { get; set; }

        [JsonPropertyName("isResolved")]
        public bool IsResolved { get; set; }

        [JsonPropertyName("resolvedById")]
        public int? ResolvedBy { get; set; }

        [JsonPropertyName("resolvedByUsername")]
        public string? ResolvedByUsername { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime AlertDate { get; set; }

        [JsonPropertyName("resolvedAt")]
        public DateTime? ResolvedAt { get; set; }

        [JsonPropertyName("severity")]
        public string Severity { get; set; } = "info";
    }
}
