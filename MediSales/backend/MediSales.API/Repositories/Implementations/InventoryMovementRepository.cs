using Microsoft.EntityFrameworkCore;
using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Repositories.Interfaces;

namespace MediSales.API.Repositories.Implementations
{
    /// <summary>Repository for inventory movement data access.</summary>
    public class InventoryMovementRepository : IInventoryMovementRepository
    {
        private readonly ApplicationDbContext _context;

        public InventoryMovementRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InventoryMovement> AddMovementAsync(InventoryMovement movement)
        {
            await _context.InventoryMovements.AddAsync(movement);
            await _context.SaveChangesAsync();
            return movement;
        }

        public async Task<IEnumerable<InventoryMovement>> GetMovementsAsync(
            int? productId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            MovementType? movementType = null)
        {
            var query = _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.CreatedByUser)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(m => m.ProductId == productId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt <= endDate.Value);
            }

            if (movementType.HasValue)
            {
                query = query.Where(m => m.MovementType == movementType.Value);
            }

            return await query
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryMovement>> GetProductMovementsAsync(int productId, int? limit = null)
        {
            var query = _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.CreatedByUser)
                .Where(m => m.ProductId == productId)
                .OrderByDescending(m => m.CreatedAt);

            if (limit.HasValue)
            {
                return await query.Take(limit.Value).ToListAsync();
            }

            return await query.ToListAsync();
        }

        public async Task<InventoryMovement?> GetMovementByIdAsync(int movementId)
        {
            return await _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.CreatedByUser)
                .FirstOrDefaultAsync(m => m.MovementId == movementId);
        }

        public async Task<(int TotalInbound, int TotalOutbound, int NetChange)> GetMovementSummaryAsync(
            int productId,
            int month,
            int year)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var movements = await _context.InventoryMovements
                .Where(m => m.ProductId == productId &&
                            m.CreatedAt >= startDate &&
                            m.CreatedAt < endDate)
                .ToListAsync();

            var totalInbound = movements
                .Where(m => m.MovementType == MovementType.Inbound)
                .Sum(m => Math.Abs(m.Quantity));

            var totalOutbound = movements
                .Where(m => m.MovementType == MovementType.Outbound)
                .Sum(m => Math.Abs(m.Quantity));

            var netChange = totalInbound - totalOutbound;

            return (totalInbound, totalOutbound, netChange);
        }
    }
}
