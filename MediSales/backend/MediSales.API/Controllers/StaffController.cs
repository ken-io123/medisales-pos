using MediSales.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediSales.API.DTOs.Staff;
using MediSales.API.Services.Interfaces;

namespace MediSales.API.Controllers
{
    /// <summary>
    /// Staff management endpoints.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IStaffService _staffService;
        private readonly IAuditLogService _auditLogService;
        private readonly ILogger<StaffController> _logger;

        public StaffController(IStaffService staffService, IAuditLogService auditLogService, ILogger<StaffController> logger)
        {
            _staffService = staffService;
            _auditLogService = auditLogService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllStaff(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? role = null,
            [FromQuery] string? status = null)
        {
            try
            {
                var (staff, totalCount) = await _staffService.GetStaffPaginatedAsync(page, pageSize, searchTerm, role, status);
                
                var response = new
                {
                    Data = staff,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all staff");
                return StatusCode(500, new { message = "An error occurred while retrieving staff members" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StaffDto>> GetStaffById(int id)
        {
            try
            {
                var staff = await _staffService.GetStaffByIdAsync(id);
                if (staff == null)
                {
                    return NotFound(new { message = $"Staff member with ID {id} not found" });
                }

                return Ok(staff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving staff member {StaffId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the staff member" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<StaffDto>> CreateStaff([FromBody] CreateStaffDto createStaffDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

                var staff = await _staffService.CreateStaffAsync(createStaffDto, currentUserId);

                await _auditLogService.LogAsync(
                    "Create", 
                    "Staff", 
                    staff.UserId.ToString(), 
                    currentUserId, 
                    $"Created staff member {staff.Username} ({staff.Role})");

                return CreatedAtAction(nameof(GetStaffById), new { id = staff.UserId }, staff);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation while creating staff: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while creating staff: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating staff member");
                return StatusCode(500, new { message = "An error occurred while creating the staff member" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<StaffDto>> UpdateStaff(int id, [FromBody] UpdateStaffDto updateStaffDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

                var staff = await _staffService.UpdateStaffAsync(id, updateStaffDto, currentUserId);
                if (staff == null)
                {
                    return NotFound(new { message = $"Staff member with ID {id} not found" });
                }

                await _auditLogService.LogAsync(
                    "Update", 
                    "Staff", 
                    id.ToString(), 
                    currentUserId, 
                    $"Updated staff member {staff.Username}");

                return Ok(staff);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation while updating staff: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while updating staff: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating staff member {StaffId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the staff member" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteStaff(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

                var success = await _staffService.DeleteStaffAsync(id, currentUserId);
                if (!success)
                {
                    return NotFound(new { message = $"Staff member with ID {id} not found" });
                }

                await _auditLogService.LogAsync(
                    "Delete", 
                    "Staff", 
                    id.ToString(), 
                    currentUserId, 
                    $"Deleted staff member with ID {id}");

                return Ok(new { message = "Staff member deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting staff member {StaffId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the staff member" });
            }
        }

        [HttpGet("{id}/login-history")]
        public async Task<ActionResult<IEnumerable<StaffLoginHistoryDto>>> GetLoginHistory(int id)
        {
            try
            {
                var history = await _staffService.GetStaffLoginHistoryAsync(id);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving login history for staff {StaffId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving login history" });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult<StaffDto>> UpdateStaffStatus(int id, [FromQuery] string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                {
                    return BadRequest(new { message = "Status is required" });
                }

                var staff = await _staffService.UpdateStaffStatusAsync(id, status);
                if (staff == null)
                {
                    return NotFound(new { message = $"Staff member with ID {id} not found" });
                }

                // Log the status update
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

                await _auditLogService.LogAsync(
                    "Update", 
                    "Staff", 
                    id.ToString(), 
                    currentUserId, 
                    $"Updated status of staff {staff.Username} to {status}");

                return Ok(staff);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid status value: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for staff {StaffId}", id);
                return StatusCode(500, new { message = "An error occurred while updating staff status" });
            }
        }

        [HttpGet("audit-logs")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs([FromQuery] string? entityName = null)
        {
            try
            {
                var logs = await _auditLogService.GetLogsAsync(entityName);
                
                var dtos = logs.Select(log => new AuditLogDto
                {
                    Id = log.Id,
                    Action = log.Action,
                    EntityName = log.EntityName,
                    EntityId = log.EntityId,
                    UserId = log.UserId,
                    UserName = log.User?.FullName ?? log.User?.Username ?? "System",
                    UserRole = log.User?.Role.ToString() ?? "System",
                    Details = log.Details,
                    Timestamp = log.Timestamp
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit logs");
                return StatusCode(500, new { message = "An error occurred while retrieving audit logs" });
            }
        }
    }
}
