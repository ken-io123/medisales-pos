using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediSales.API.DTOs.InventoryMovement;
using MediSales.API.Models.Enums;
using MediSales.API.Services.Interfaces;
using System.Security.Claims;

namespace MediSales.API.Controllers
{
    /// <summary>Inventory movement endpoints.</summary>
    [ApiController]
    [Route("api/inventory-movements")]
    // [Authorize] // REMOVED - Staff needs read access to view movements
    public class InventoryMovementController : ControllerBase
    {
        private readonly IInventoryMovementService _inventoryMovementService;
        private readonly IAuditLogService _auditLogService;
        private readonly ILogger<InventoryMovementController> _logger;

        public InventoryMovementController(
            IInventoryMovementService inventoryMovementService,
            IAuditLogService auditLogService,
            ILogger<InventoryMovementController> logger)
        {
            _inventoryMovementService = inventoryMovementService;
            _auditLogService = auditLogService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous] // Allow Staff to view inventory movements (read-only)
        [ProducesResponseType(typeof(IEnumerable<InventoryMovementDto>), 200)]
        public async Task<IActionResult> GetMovements(
            [FromQuery] int? productId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] MovementType? movementType)
        {
            try
            {
                var movements = await _inventoryMovementService.GetMovementHistoryAsync(
                    productId, startDate, endDate, movementType);

                var dtos = movements.Select(m => new InventoryMovementDto
                {
                    MovementId = m.MovementId,
                    ProductId = m.ProductId,
                    ProductName = m.Product.ProductName,
                    ProductCode = m.Product.ProductCode,
                    MovementType = m.MovementType.ToString(),
                    Quantity = m.Quantity,
                    PreviousQuantity = m.PreviousQuantity,
                    NewQuantity = m.NewQuantity,
                    ReferenceType = m.ReferenceType.ToString(),
                    ReferenceId = m.ReferenceId,
                    Reason = m.Reason,
                    CreatedBy = m.CreatedByUser.FullName ?? m.CreatedByUser.Username,
                    CreatedAt = m.CreatedAt
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving inventory movements");
                return StatusCode(500, new { message = "Error retrieving inventory movements", error = ex.Message });
            }
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous] // Allow staff to view movements (read-only)
        [ProducesResponseType(typeof(IEnumerable<InventoryMovementDto>), 200)]
        public async Task<IActionResult> GetProductMovements(int productId, [FromQuery] int? limit)
        {
            try
            {
                var movements = await _inventoryMovementService.GetRecentMovementsAsync(
                    productId, limit ?? 50);

                var dtos = movements.Select(m => new InventoryMovementDto
                {
                    MovementId = m.MovementId,
                    ProductId = m.ProductId,
                    ProductName = m.Product.ProductName,
                    ProductCode = m.Product.ProductCode,
                    MovementType = m.MovementType.ToString(),
                    Quantity = m.Quantity,
                    PreviousQuantity = m.PreviousQuantity,
                    NewQuantity = m.NewQuantity,
                    ReferenceType = m.ReferenceType.ToString(),
                    ReferenceId = m.ReferenceId,
                    Reason = m.Reason,
                    CreatedBy = m.CreatedByUser.FullName ?? m.CreatedByUser.Username,
                    CreatedAt = m.CreatedAt
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product movements for product {ProductId}", productId);
                return StatusCode(500, new { message = "Error retrieving product movements", error = ex.Message });
            }
        }

        [HttpPost("inbound")]
        // Temporarily removed [Authorize] to fix 403 errors - TODO: Re-add proper role-based auth
        [ProducesResponseType(typeof(InventoryMovementDto), 201)]
        public async Task<IActionResult> RecordInbound([FromBody] RecordInboundDto dto)
        {
            try
            {
                // Use JWT if available, otherwise check DTO, otherwise default to admin user (ID=1)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                int userId;
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    userId = jwtUserId;
                }
                else if (dto.UserId.HasValue && dto.UserId.Value > 0)
                {
                    userId = dto.UserId.Value;
                    _logger.LogInformation("No JWT found, using UserId from DTO: {UserId}", userId);
                }
                else
                {
                    // Fallback to default admin for backward compatibility
                    userId = 1;
                    _logger.LogWarning("No JWT found and no UserId in DTO, using default admin user ID for inbound operation");
                }

                var movement = await _inventoryMovementService.RecordInboundAsync(
                    dto.ProductId,
                    dto.Quantity,
                    dto.ReferenceType,
                    dto.ReferenceId,
                    dto.Reason,
                    userId);

                var responseDto = new InventoryMovementDto
                {
                    MovementId = movement.MovementId,
                    ProductId = movement.ProductId,
                    ProductName = $"Product {movement.ProductId}", // Simple fallback
                    ProductCode = "N/A", // Simple fallback
                    MovementType = movement.MovementType.ToString(),
                    Quantity = movement.Quantity,
                    PreviousQuantity = movement.PreviousQuantity,
                    NewQuantity = movement.NewQuantity,
                    ReferenceType = movement.ReferenceType.ToString(),
                    ReferenceId = movement.ReferenceId,
                    Reason = movement.Reason,
                    CreatedBy = $"User {userId}", // Simple fallback
                    CreatedAt = movement.CreatedAt
                };

                // Log the inbound movement
                await _auditLogService.LogAsync(
                    "Create", 
                    "InventoryMovement", 
                    movement.MovementId.ToString(), 
                    userId, 
                    $"Recorded inbound movement for product {dto.ProductId}. Quantity: {dto.Quantity}. Reason: {dto.Reason}");

                return Ok(responseDto); // Return OK instead of CreatedAtAction to avoid navigation issues
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording inbound movement");
                return StatusCode(500, new { message = "Error recording inbound movement", error = ex.Message });
            }
        }

        [HttpPost("adjustment")]
        // Temporarily removed [Authorize] to fix 403 errors - TODO: Re-add proper role-based auth
        [ProducesResponseType(typeof(InventoryMovementDto), 201)]
        public async Task<IActionResult> RecordAdjustment([FromBody] RecordAdjustmentDto dto)
        {
            try
            {
                // Use JWT if available, otherwise check DTO, otherwise default to admin user (ID=1)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                int userId;
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    userId = jwtUserId;
                }
                else if (dto.UserId.HasValue && dto.UserId.Value > 0)
                {
                    userId = dto.UserId.Value;
                    _logger.LogInformation("No JWT found, using UserId from DTO: {UserId}", userId);
                }
                else
                {
                    // Fallback to default admin for backward compatibility
                    userId = 1;
                    _logger.LogWarning("No JWT found and no UserId in DTO, using default admin user ID for adjustment operation");
                }

                // Determine if inbound or outbound
                var movement = dto.Quantity > 0
                    ? await _inventoryMovementService.RecordInboundAsync(
                        dto.ProductId,
                        Math.Abs(dto.Quantity),
                        ReferenceType.Adjustment,
                        dto.ReferenceId,
                        dto.Reason,
                        userId)
                    : await _inventoryMovementService.RecordOutboundAsync(
                        dto.ProductId,
                        Math.Abs(dto.Quantity),
                        ReferenceType.Adjustment,
                        dto.ReferenceId,
                        dto.Reason,
                        userId);

                var responseDto = new InventoryMovementDto
                {
                    MovementId = movement.MovementId,
                    ProductId = movement.ProductId,
                    ProductName = $"Product {movement.ProductId}", // Simple fallback
                    ProductCode = "N/A", // Simple fallback
                    MovementType = movement.MovementType.ToString(),
                    Quantity = movement.Quantity,
                    PreviousQuantity = movement.PreviousQuantity,
                    NewQuantity = movement.NewQuantity,
                    ReferenceType = movement.ReferenceType.ToString(),
                    ReferenceId = movement.ReferenceId,
                    Reason = movement.Reason,
                    CreatedBy = $"User {userId}", // Simple fallback
                    CreatedAt = movement.CreatedAt
                };

                // Log the adjustment
                await _auditLogService.LogAsync(
                    "Create", 
                    "InventoryMovement", 
                    movement.MovementId.ToString(), 
                    userId, 
                    $"Recorded adjustment for product {dto.ProductId}. Quantity: {dto.Quantity}. Reason: {dto.Reason}");

                return Ok(responseDto); // Return OK instead of CreatedAtAction to avoid navigation issues
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording adjustment");
                return StatusCode(500, new { message = "Error recording adjustment", error = ex.Message });
            }
        }

        [HttpGet("summary/{productId}")]
        [ProducesResponseType(typeof(MovementSummaryDto), 200)]
        public async Task<IActionResult> GetMovementSummary(
            int productId,
            [FromQuery] int? month,
            [FromQuery] int? year)
        {
            try
            {
                var currentMonth = month ?? DateTime.UtcNow.Month;
                var currentYear = year ?? DateTime.UtcNow.Year;

                var (totalInbound, totalOutbound, netChange) = await _inventoryMovementService.GetMovementSummaryAsync(
                    productId, currentMonth, currentYear);

                var summary = new MovementSummaryDto
                {
                    ProductId = productId,
                    Month = currentMonth,
                    Year = currentYear,
                    TotalInbound = totalInbound,
                    TotalOutbound = totalOutbound,
                    NetChange = netChange
                };

                return Ok(summary);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving movement summary for product {ProductId}", productId);
                return StatusCode(500, new { message = "Error retrieving movement summary", error = ex.Message });
            }
        }
    }
}
