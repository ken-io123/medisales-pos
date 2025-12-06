using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.InventoryMovement
{
    /// <summary>
    /// Request for manual stock adjustment.
    /// </summary>
    public class RecordAdjustmentDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
        public int? UserId { get; set; }
    }
}
