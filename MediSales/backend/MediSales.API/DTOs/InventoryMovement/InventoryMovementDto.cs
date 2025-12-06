using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.InventoryMovement
{
    /// <summary>
    /// Inventory movement data for API responses.
    /// </summary>
    public class InventoryMovementDto
    {
        public int MovementId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductCode { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int PreviousQuantity { get; set; }
        public int NewQuantity { get; set; }
        public string ReferenceType { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
        public string? Reason { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
