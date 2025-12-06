using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Alerts
{
    /// <summary>
    /// Request data for resolving a stock alert.
    /// </summary>
    public class ResolveAlertDto
    {
        [Required(ErrorMessage = "Resolved by user ID is required")]
        public int ResolvedBy { get; set; }
    }
}
