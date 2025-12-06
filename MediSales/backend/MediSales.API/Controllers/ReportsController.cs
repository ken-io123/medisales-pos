using Microsoft.AspNetCore.Mvc;
using MediSales.API.DTOs.Reports;
using MediSales.API.Services.Interfaces;

namespace MediSales.API.Controllers
{
    /// <summary>Reports and analytics endpoints.</summary>
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsService _reportsService;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(
            IReportsService reportsService,
            ILogger<ReportsController> logger)
        {
            _reportsService = reportsService;
            _logger = logger;
        }

        [HttpGet("daily")]
        [ProducesResponseType(typeof(SalesReportDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetDailySalesReport([FromQuery] DateTime? date)
        {
            try
            {
                var reportDate = date ?? DateTime.UtcNow.Date;
                _logger.LogInformation("Generating daily sales report for date: {Date}", reportDate);

                var report = await _reportsService.GetDailySalesReportAsync(reportDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating daily sales report");
                return StatusCode(500, new { message = "An error occurred while generating daily sales report", error = ex.Message });
            }
        }

        [HttpGet("weekly")]
        [HttpGet("sales/weekly")] // Alternative route for backward compatibility
        [ProducesResponseType(typeof(SalesReportDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetWeeklySalesReport([FromQuery] DateTime? weekStart)
        {
            try
            {
                var startDate = weekStart ?? GetMonday(DateTime.UtcNow);
                _logger.LogInformation("Generating weekly sales report starting from: {WeekStart}", startDate);

                var report = await _reportsService.GetWeeklySalesReportAsync(startDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating weekly sales report");
                return StatusCode(500, new { message = "An error occurred while generating weekly sales report", error = ex.Message });
            }
        }

        [HttpGet("monthly")]
        [HttpGet("sales/monthly")] // Alternative route for backward compatibility
        [ProducesResponseType(typeof(SalesReportDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetMonthlySalesReport([FromQuery] int? month, [FromQuery] int? year)
        {
            try
            {
                var reportMonth = month ?? DateTime.UtcNow.Month;
                var reportYear = year ?? DateTime.UtcNow.Year;

                if (reportMonth < 1 || reportMonth > 12)
                {
                    return BadRequest(new { message = "Month must be between 1 and 12" });
                }

                _logger.LogInformation("Generating monthly sales report for {Month}/{Year}", reportMonth, reportYear);

                var report = await _reportsService.GetMonthlySalesReportAsync(reportMonth, reportYear);
                return Ok(report);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument for monthly sales report");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating monthly sales report");
                return StatusCode(500, new { message = "An error occurred while generating monthly sales report", error = ex.Message });
            }
        }

        [HttpGet("top-products")]
        [ProducesResponseType(typeof(IEnumerable<ProductSalesDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetTopSellingProducts([FromQuery] int count = 10)
        {
            try
            {
                if (count < 1 || count > 100)
                {
                    return BadRequest(new { message = "Count must be between 1 and 100" });
                }

                _logger.LogInformation("Generating top {Count} selling products report", count);

                var products = await _reportsService.GetTopSellingProductsAsync(count);
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating top selling products report");
                return StatusCode(500, new { message = "An error occurred while generating top selling products report", error = ex.Message });
            }
        }

        [HttpGet("by-category")]
        [HttpGet("sales/by-category")] // Alternative route for backward compatibility
        [ProducesResponseType(typeof(IEnumerable<CategorySalesDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetSalesByCategory()
        {
            try
            {
                _logger.LogInformation("Generating sales by category report");

                var categorySales = await _reportsService.GetSalesByCategoryAsync();
                return Ok(categorySales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating sales by category report");
                return StatusCode(500, new { message = "An error occurred while generating sales by category report", error = ex.Message });
            }
        }

        [HttpGet("by-payment-method")]
        [HttpGet("sales/by-payment-method")] // Alternative route for backward compatibility
        [ProducesResponseType(typeof(IEnumerable<PaymentMethodDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetSalesByPaymentMethod()
        {
            try
            {
                _logger.LogInformation("Generating sales by payment method report");

                var paymentMethodSales = await _reportsService.GetSalesByPaymentMethodAsync();
                return Ok(paymentMethodSales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating sales by payment method report");
                return StatusCode(500, new { message = "An error occurred while generating sales by payment method report", error = ex.Message });
            }
        }

        [HttpGet("staff-performance")]
        [ProducesResponseType(typeof(IEnumerable<StaffPerformanceDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetStaffPerformance()
        {
            try
            {
                _logger.LogInformation("Generating staff performance report");

                var staffPerformance = await _reportsService.GetStaffPerformanceAsync();
                return Ok(staffPerformance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating staff performance report");
                return StatusCode(500, new { message = "An error occurred while generating staff performance report", error = ex.Message });
            }
        }

        [HttpGet("inventory")]
        [ProducesResponseType(typeof(InventoryReportDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetInventoryReport()
        {
            try
            {
                _logger.LogInformation("Generating inventory report");

                var inventoryReport = await _reportsService.GetInventoryReportAsync();
                return Ok(inventoryReport);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating inventory report");
                return StatusCode(500, new { message = "An error occurred while generating inventory report", error = ex.Message });
            }
        }

        [HttpGet("sales/daily")]
        [ProducesResponseType(typeof(SalesReportDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetDailySalesReportAlt([FromQuery] DateTime? date)
        {
            try
            {
                var reportDate = date ?? DateTime.UtcNow.Date;
                _logger.LogInformation("Generating daily sales report for date: {Date}", reportDate);

                var report = await _reportsService.GetDailySalesReportAsync(reportDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating daily sales report");
                return StatusCode(500, new { message = "An error occurred while generating daily sales report", error = ex.Message });
            }
        }

        private DateTime GetMonday(DateTime date)
        {
            var dayOfWeek = (int)date.DayOfWeek;
            var daysToSubtract = dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Handle Sunday (0) as end of week
            return date.Date.AddDays(-daysToSubtract);
        }

        [HttpGet("historical/{date}")]
        [ProducesResponseType(typeof(HistoricalSalesDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetHistoricalSales([FromRoute] DateTime date)
        {
            try
            {
                _logger.LogInformation("Getting historical sales for date: {Date}", date);

                var sales = await _reportsService.GetSalesBySpecificDateAsync(date);
                return Ok(sales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting historical sales");
                return StatusCode(500, new { message = "An error occurred while getting historical sales", error = ex.Message });
            }
        }

        [HttpGet("compare")]
        [ProducesResponseType(typeof(SalesComparisonDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> CompareSales([FromQuery] DateTime date1, [FromQuery] DateTime date2)
        {
            try
            {
                if (date1 == default || date2 == default)
                {
                    return BadRequest(new { message = "Both date1 and date2 must be provided" });
                }

                _logger.LogInformation("Comparing sales between {Date1} and {Date2}", date1, date2);

                var comparison = await _reportsService.CompareSalesBetweenDatesAsync(date1, date2);
                return Ok(comparison);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while comparing sales");
                return StatusCode(500, new { message = "An error occurred while comparing sales", error = ex.Message });
            }
        }

        [HttpGet("weekly-comparison")]
        [ProducesResponseType(typeof(SalesComparisonDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetWeeklyComparison([FromQuery] DateTime? weekStart)
        {
            try
            {
                var startDate = weekStart ?? GetMonday(DateTime.UtcNow);
                var previousWeekStart = startDate.AddDays(-7);

                _logger.LogInformation("Comparing weekly sales: {PreviousWeek} vs {CurrentWeek}", previousWeekStart, startDate);

                // Get sales for both weeks
                var currentWeekReport = await _reportsService.GetWeeklySalesReportAsync(startDate);
                var previousWeekReport = await _reportsService.GetWeeklySalesReportAsync(previousWeekStart);

                // Calculate comparison
                var amountDifference = currentWeekReport.TotalSales - previousWeekReport.TotalSales;
                var isIncrease = amountDifference >= 0;
                decimal percentageChange = 0;

                if (previousWeekReport.TotalSales > 0)
                {
                    percentageChange = Math.Round((amountDifference / previousWeekReport.TotalSales) * 100, 2);
                }
                else if (currentWeekReport.TotalSales > 0)
                {
                    percentageChange = 100;
                }

                string trendDescription;
                if (percentageChange == 0)
                {
                    trendDescription = "No change in weekly sales";
                }
                else if (isIncrease)
                {
                    if (percentageChange > 50)
                        trendDescription = $"Significant weekly increase of {percentageChange}%";
                    else if (percentageChange > 20)
                        trendDescription = $"Notable weekly increase of {percentageChange}%";
                    else
                        trendDescription = $"Slight weekly increase of {percentageChange}%";
                }
                else
                {
                    var absPercentage = Math.Abs(percentageChange);
                    if (absPercentage > 50)
                        trendDescription = $"Significant weekly decrease of {absPercentage}%";
                    else if (absPercentage > 20)
                        trendDescription = $"Notable weekly decrease of {absPercentage}%";
                    else
                        trendDescription = $"Slight weekly decrease of {absPercentage}%";
                }

                var comparison = new SalesComparisonDto
                {
                    Date1 = previousWeekStart,
                    Sales1 = previousWeekReport.TotalSales,
                    Date2 = startDate,
                    Sales2 = currentWeekReport.TotalSales,
                    PercentageChange = percentageChange,
                    AmountDifference = amountDifference,
                    IsIncrease = isIncrease,
                    TrendDescription = trendDescription
                };

                return Ok(comparison);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while comparing weekly sales");
                return StatusCode(500, new { message = "An error occurred while comparing weekly sales", error = ex.Message });
            }
        }

        [HttpGet("monthly-comparison")]
        [ProducesResponseType(typeof(SalesComparisonDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetMonthlyComparison([FromQuery] int? month, [FromQuery] int? year)
        {
            try
            {
                var currentMonth = month ?? DateTime.UtcNow.Month;
                var currentYear = year ?? DateTime.UtcNow.Year;

                if (currentMonth < 1 || currentMonth > 12)
                {
                    return BadRequest(new { message = "Month must be between 1 and 12" });
                }

                // Calculate previous month
                var previousMonth = currentMonth - 1;
                var previousYear = currentYear;
                if (previousMonth < 1)
                {
                    previousMonth = 12;
                    previousYear--;
                }

                _logger.LogInformation("Comparing monthly sales: {PreviousMonth}/{PreviousYear} vs {CurrentMonth}/{CurrentYear}", 
                    previousMonth, previousYear, currentMonth, currentYear);

                // Get sales for both months
                var currentMonthReport = await _reportsService.GetMonthlySalesReportAsync(currentMonth, currentYear);
                var previousMonthReport = await _reportsService.GetMonthlySalesReportAsync(previousMonth, previousYear);

                // Calculate comparison
                var amountDifference = currentMonthReport.TotalSales - previousMonthReport.TotalSales;
                var isIncrease = amountDifference >= 0;
                decimal percentageChange = 0;

                if (previousMonthReport.TotalSales > 0)
                {
                    percentageChange = Math.Round((amountDifference / previousMonthReport.TotalSales) * 100, 2);
                }
                else if (currentMonthReport.TotalSales > 0)
                {
                    percentageChange = 100;
                }

                string trendDescription;
                if (percentageChange == 0)
                {
                    trendDescription = "No change in monthly sales";
                }
                else if (isIncrease)
                {
                    if (percentageChange > 50)
                        trendDescription = $"Significant monthly increase of {percentageChange}%";
                    else if (percentageChange > 20)
                        trendDescription = $"Notable monthly increase of {percentageChange}%";
                    else
                        trendDescription = $"Slight monthly increase of {percentageChange}%";
                }
                else
                {
                    var absPercentage = Math.Abs(percentageChange);
                    if (absPercentage > 50)
                        trendDescription = $"Significant monthly decrease of {absPercentage}%";
                    else if (absPercentage > 20)
                        trendDescription = $"Notable monthly decrease of {absPercentage}%";
                    else
                        trendDescription = $"Slight monthly decrease of {absPercentage}%";
                }

                var comparison = new SalesComparisonDto
                {
                    Date1 = new DateTime(previousYear, previousMonth, 1),
                    Sales1 = previousMonthReport.TotalSales,
                    Date2 = new DateTime(currentYear, currentMonth, 1),
                    Sales2 = currentMonthReport.TotalSales,
                    PercentageChange = percentageChange,
                    AmountDifference = amountDifference,
                    IsIncrease = isIncrease,
                    TrendDescription = trendDescription
                };


                return Ok(comparison);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument for monthly comparison");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while comparing monthly sales");
                return StatusCode(500, new { message = "An error occurred while comparing monthly sales", error = ex.Message });
            }
        }

        [HttpGet("yearly")]
        [HttpGet("sales/yearly")] // Alternative route for backward compatibility
        [ProducesResponseType(typeof(SalesReportDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetYearlySalesReport([FromQuery] int? year)
        {
            try
            {
                var reportYear = year ?? DateTime.UtcNow.Year;

                _logger.LogInformation("Generating yearly sales report for {Year}", reportYear);

                var report = await _reportsService.GetYearlySalesReportAsync(reportYear);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating yearly sales report");
                return StatusCode(500, new { message = "An error occurred while generating yearly sales report", error = ex.Message });
            }
        }

        [HttpGet("sales/trend")]
        [ProducesResponseType(typeof(SalesChartDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetSalesTrend([FromQuery] string period = "daily")
        {
            try
            {
                _logger.LogInformation("Generating sales trend report for period: {Period}", period);

                var trend = await _reportsService.GetSalesTrendAsync(period);
                return Ok(trend);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating sales trend report");
                return StatusCode(500, new { message = "An error occurred while generating sales trend report", error = ex.Message });
            }
        }

        [HttpGet("staff/daily")]
        [ProducesResponseType(typeof(SalesReportDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetStaffDailySalesReport([FromQuery] int? userId, [FromQuery] DateTime? date)
        {
            try
            {
                var reportDate = date ?? DateTime.UtcNow.Date;
                var staffUserId = userId ?? GetCurrentUserId();
                
                _logger.LogInformation("Generating staff daily sales report for user {UserId} on date: {Date}", staffUserId, reportDate);

                var report = await _reportsService.GetStaffDailySalesReportAsync(staffUserId, reportDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating staff daily sales report");
                return StatusCode(500, new { message = "An error occurred while generating staff daily sales report", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("User ID not found in claims");
        }
    }
}

