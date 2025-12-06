using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.Services.Interfaces;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Service implementation for inventory movement business logic.
    /// </summary>
    public class InventoryMovementService : IInventoryMovementService
    {
        private readonly IInventoryMovementRepository _movementRepository;
        private readonly IProductRepository _productRepository;
        private readonly IAuditLogService _auditLogService;
        private readonly ILogger<InventoryMovementService> _logger;

        public InventoryMovementService(
            IInventoryMovementRepository movementRepository,
            IProductRepository productRepository,
            IAuditLogService auditLogService,
            ILogger<InventoryMovementService> logger)
        {
            _movementRepository = movementRepository;
            _productRepository = productRepository;
            _auditLogService = auditLogService;
            _logger = logger;
        }

        public async Task<InventoryMovement> RecordInboundAsync(
            int productId,
            int quantity,
            ReferenceType referenceType,
            string? referenceId,
            string? reason,
            int userId)
        {
            if (quantity <= 0)
            {
                throw new ArgumentException("Quantity must be positive for inbound movements", nameof(quantity));
            }

            // Validate product exists
            var product = await _productRepository.GetProductByIdAsync(productId);
            if (product == null)
            {
                throw new KeyNotFoundException($"Product with ID {productId} not found");
            }

            // Get current stock and calculate new stock
            var previousQuantity = product.StockQuantity;
            var newQuantity = previousQuantity + quantity;

            // Create movement record
            var movement = new InventoryMovement
            {
                ProductId = productId,
                MovementType = MovementType.Inbound,
                Quantity = quantity,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                Reason = reason,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            // Save movement
            await _movementRepository.AddMovementAsync(movement);

            // Update product stock
            product.StockQuantity = newQuantity;
            await _productRepository.UpdateProductAsync(product);

            // Log to audit trail for item arrival tracking
            await _auditLogService.LogAsync(
                action: "ItemArrival",
                entityName: "Product",
                entityId: productId.ToString(),
                userId: userId,
                details: $"Inbound: {product.ProductName} - Quantity: {quantity}, New Stock: {newQuantity}, Reference: {referenceType}{(string.IsNullOrEmpty(referenceId) ? "" : $" ({referenceId})")}"
            );

            _logger.LogInformation(
                "Recorded inbound movement: Product {ProductId}, Quantity {Quantity}, New Stock {NewQuantity}, User {UserId}",
                productId, quantity, newQuantity, userId);

            return movement;
        }

        public async Task<InventoryMovement> RecordOutboundAsync(
            int productId,
            int quantity,
            ReferenceType referenceType,
            string? referenceId,
            string? reason,
            int userId)
        {
            if (quantity <= 0)
            {
                throw new ArgumentException("Quantity must be positive for outbound movements", nameof(quantity));
            }

            // Validate product exists
            var product = await _productRepository.GetProductByIdAsync(productId);
            if (product == null)
            {
                throw new KeyNotFoundException($"Product with ID {productId} not found");
            }

            // Check sufficient stock
            if (product.StockQuantity < quantity)
            {
                throw new InvalidOperationException(
                    $"Insufficient stock for product {product.ProductName}. Available: {product.StockQuantity}, Requested: {quantity}");
            }

            // Get current stock and calculate new stock
            var previousQuantity = product.StockQuantity;
            var newQuantity = previousQuantity - quantity;

            // Create movement record (negative quantity for outbound)
            var movement = new InventoryMovement
            {
                ProductId = productId,
                MovementType = MovementType.Outbound,
                Quantity = -quantity, // Store as negative
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                Reason = reason,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            // Save movement
            await _movementRepository.AddMovementAsync(movement);

            // Update product stock
            product.StockQuantity = newQuantity;
            await _productRepository.UpdateProductAsync(product);

            _logger.LogInformation(
                "Recorded outbound movement: Product {ProductId}, Quantity {Quantity}, New Stock {NewQuantity}, User {UserId}",
                productId, quantity, newQuantity, userId);

            return movement;
        }

        public async Task<IEnumerable<InventoryMovement>> GetMovementHistoryAsync(
            int? productId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            MovementType? movementType = null)
        {
            return await _movementRepository.GetMovementsAsync(
                productId,
                startDate,
                endDate,
                movementType);
        }

        public async Task<(int TotalInbound, int TotalOutbound, int NetChange)> GetMovementSummaryAsync(
            int productId,
            int month,
            int year)
        {
            if (month < 1 || month > 12)
            {
                throw new ArgumentException("Month must be between 1 and 12", nameof(month));
            }

            return await _movementRepository.GetMovementSummaryAsync(productId, month, year);
        }

        public async Task<IEnumerable<InventoryMovement>> GetRecentMovementsAsync(int productId, int limit = 50)
        {
            return await _movementRepository.GetProductMovementsAsync(productId, limit);
        }

        public async Task<DateTime?> GetFirstArrivalDateAsync(int productId)
        {
            var movements = await _movementRepository.GetProductMovementsAsync(productId);
            var firstInbound = movements
                .Where(m => m.MovementType == MovementType.Inbound)
                .OrderBy(m => m.CreatedAt)
                .FirstOrDefault();
            
            return firstInbound?.CreatedAt;
        }
    }
}
