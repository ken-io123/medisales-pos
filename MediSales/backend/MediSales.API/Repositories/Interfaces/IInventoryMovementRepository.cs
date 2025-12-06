using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;

namespace MediSales.API.Repositories.Interfaces
{
    /// <summary>Repository for inventory movement data access.</summary>
    public interface IInventoryMovementRepository
    {
        Task<InventoryMovement> AddMovementAsync(InventoryMovement movement);
        Task<IEnumerable<InventoryMovement>> GetMovementsAsync(
            int? productId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            MovementType? movementType = null);
        Task<IEnumerable<InventoryMovement>> GetProductMovementsAsync(int productId, int? limit = null);
        Task<InventoryMovement?> GetMovementByIdAsync(int movementId);
        Task<(int TotalInbound, int TotalOutbound, int NetChange)> GetMovementSummaryAsync(int productId, int month, int year);
    }
}
