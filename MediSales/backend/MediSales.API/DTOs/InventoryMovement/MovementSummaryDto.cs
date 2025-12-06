namespace MediSales.API.DTOs.InventoryMovement
{
    /// <summary>
    /// Monthly movement summary for a product.
    /// </summary>
    public class MovementSummaryDto
    {
        public int ProductId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalInbound { get; set; }
        public int TotalOutbound { get; set; }
        public int NetChange { get; set; }
    }
}
