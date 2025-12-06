using MediSales.API.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Represents a stock alert for low stock or expiring products.
    /// </summary>
    [Index(nameof(AlertDate))]
    public class StockAlert
    {
        [Key]
        public int StockAlertId { get; set; }

        [Required(ErrorMessage = "Product ID is required")]
        [ForeignKey(nameof(Product))]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Alert type is required")]
        public AlertType AlertType { get; set; }

        [Required(ErrorMessage = "Alert message is required")]
        [MaxLength(500, ErrorMessage = "Alert message cannot exceed 500 characters")]
        public string AlertMessage { get; set; } = string.Empty;

        [Required(ErrorMessage = "Current stock level is required")]
        [Range(0, int.MaxValue, ErrorMessage = "Current stock level cannot be negative")]
        public int CurrentStockLevel { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Threshold level cannot be negative")]
        public int? ThresholdLevel { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Days until expiry cannot be negative")]
        public int? DaysUntilExpiry { get; set; }

        public bool IsResolved { get; set; } = false;

        public DateTime? ResolvedAt { get; set; }

        [ForeignKey(nameof(ResolvedByUser))]
        public int? ResolvedBy { get; set; }

        [Required]
        public DateTime AlertDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Product Product { get; set; } = null!;
        public virtual User? ResolvedByUser { get; set; }
    }
}
