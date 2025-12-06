using Microsoft.AspNetCore.Mvc;
using MediSales.API.DTOs.Alerts;
using MediSales.API.Services.Interfaces;

namespace MediSales.API.Controllers
{
    /// <summary>Stock and expiry alert endpoints.</summary>
    [ApiController]
    [Route("api/alerts")]
    public class AlertsController : ControllerBase
    {
        private readonly IStockAlertService _stockAlertService;
        private readonly ILogger<AlertsController> _logger;

        public AlertsController(
            IStockAlertService stockAlertService,
            ILogger<AlertsController> logger)
        {
            _stockAlertService = stockAlertService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<StockAlertDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetActiveAlerts()
        {
            try
            {
                _logger.LogInformation("Fetching all active alerts");
                var alerts = await _stockAlertService.GetActiveAlertsAsync();
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching active alerts");
                return StatusCode(500, new { message = "An error occurred while fetching alerts", error = ex.Message });
            }
        }

        [HttpGet("stock")]
        [ProducesResponseType(typeof(IEnumerable<StockAlertDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetStockAlerts()
        {
            try
            {
                _logger.LogInformation("Fetching stock alerts only");
                var alerts = await _stockAlertService.GetStockAlertsOnlyAsync();
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching stock alerts");
                return StatusCode(500, new { message = "An error occurred while fetching stock alerts", error = ex.Message });
            }
        }

        [HttpGet("expiration")]
        [ProducesResponseType(typeof(IEnumerable<StockAlertDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetExpirationAlerts()
        {
            try
            {
                _logger.LogInformation("Fetching expiration alerts only");
                var alerts = await _stockAlertService.GetExpirationAlertsAsync();
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching expiration alerts");
                return StatusCode(500, new { message = "An error occurred while fetching expiration alerts", error = ex.Message });
            }
        }

        [HttpGet("check")]
        [ProducesResponseType(typeof(IEnumerable<StockAlertDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> RunAlertChecks()
        {
            try
            {
                _logger.LogInformation("Running stock and expiry alert checks");
                var alerts = await _stockAlertService.RunAllChecksAsync();
                
                _logger.LogInformation("Alert checks completed. {Count} new alerts generated", alerts.Count());
                
                return Ok(new 
                { 
                    message = $"{alerts.Count()} new alerts generated",
                    alerts 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while running alert checks");
                return StatusCode(500, new { message = "An error occurred while running alert checks", error = ex.Message });
            }
        }

        [HttpPost("auto-resolve")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> AutoResolveAlerts()
        {
            try
            {
                _logger.LogInformation("Running auto-resolve for stale alerts");
                var resolvedCount = await _stockAlertService.AutoResolveAlertsAsync();
                
                return Ok(new 
                { 
                    message = $"{resolvedCount} alerts auto-resolved",
                    resolvedCount 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while auto-resolving alerts");
                return StatusCode(500, new { message = "An error occurred while auto-resolving alerts", error = ex.Message });
            }
        }

        [HttpPut("{id}/resolve")]
        [ProducesResponseType(typeof(StockAlertDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> ResolveAlert(int id, [FromBody] ResolveAlertDto resolveDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for alert resolution");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Resolving alert ID: {AlertId} by user ID: {UserId}", id, resolveDto.ResolvedBy);

                var alert = await _stockAlertService.ResolveAlertAsync(id, resolveDto.ResolvedBy);

                return Ok(alert);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Alert with ID {AlertId} not found or already resolved", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while resolving alert ID: {AlertId}", id);
                return StatusCode(500, new { message = "An error occurred while resolving alert", error = ex.Message });
            }
        }

        [HttpGet("summary")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetAlertSummary()
        {
            try
            {
                var allAlerts = await _stockAlertService.GetActiveAlertsAsync();
                var alertsList = allAlerts.ToList();
                
                var summary = new
                {
                    TotalActiveAlerts = alertsList.Count,
                    StockAlerts = new
                    {
                        LowStock = alertsList.Count(a => a.AlertType == Models.Enums.AlertType.LowStock),
                        OutOfStock = alertsList.Count(a => a.AlertType == Models.Enums.AlertType.OutOfStock)
                    },
                    ExpirationAlerts = new
                    {
                        ExpiringIn7Days = alertsList.Count(a => a.AlertType == Models.Enums.AlertType.ExpiringIn7Days),
                        ExpiringIn30Days = alertsList.Count(a => a.AlertType == Models.Enums.AlertType.ExpiringIn30Days),
                        ExpiringIn60Days = alertsList.Count(a => a.AlertType == Models.Enums.AlertType.ExpiringIn60Days),
                        Expired = alertsList.Count(a => a.AlertType == Models.Enums.AlertType.Expired)
                    },
                    CriticalCount = alertsList.Count(a => a.Severity == "critical"),
                    WarningCount = alertsList.Count(a => a.Severity == "warning"),
                    InfoCount = alertsList.Count(a => a.Severity == "info")
                };
                
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching alert summary");
                return StatusCode(500, new { message = "An error occurred while fetching alert summary", error = ex.Message });
            }
        }
    }
}
