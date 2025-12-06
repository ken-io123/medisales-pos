using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for inventory movement operations.</summary>
    public interface IInventoryMovementService
    {
        Task<InventoryMovement> RecordInboundAsync(
            int productId,
            int quantity,
            ReferenceType referenceType,
            string? referenceId,
            string? reason,
            int userId);

        Task<InventoryMovement> RecordOutboundAsync(
            int productId,
            int quantity,
            ReferenceType referenceType,
            string? referenceId,
            string? reason,
            int userId);

        Task<IEnumerable<InventoryMovement>> GetMovementHistoryAsync(
            int? productId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            MovementType? movementType = null);

        Task<(int TotalInbound, int TotalOutbound, int NetChange)> GetMovementSummaryAsync(
            int productId,
            int month,
            int year);

        Task<IEnumerable<InventoryMovement>> GetRecentMovementsAsync(int productId, int limit = 50);
        Task<DateTime?> GetFirstArrivalDateAsync(int productId);
    }
}
