using MediSales.API.Models.Enums;

namespace MediSales.API.DTOs.InventoryMovement
{
    /// <summary>
    /// Request for recording stock received.
    /// </summary>
    public class RecordInboundDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public ReferenceType ReferenceType { get; set; }
        public string? ReferenceId { get; set; }
        public string? Reason { get; set; }
        public int? UserId { get; set; }
    }
}
