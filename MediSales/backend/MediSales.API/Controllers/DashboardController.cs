using Microsoft.AspNetCore.Mvc;
using MediSales.API.Services.Interfaces;
using MediSales.API.DTOs.Reports;

namespace MediSales.API.Controllers
{
    /// <summary>
    /// Dashboard overview data endpoints.
    /// </summary>
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IReportsService _reportsService;
        private readonly ITransactionService _transactionService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            IReportsService reportsService,
            ITransactionService transactionService,
            ILogger<DashboardController> logger)
        {
            _reportsService = reportsService;
            _transactionService = transactionService;
            _logger = logger;
        }

        [HttpGet("stats")]
        [ProducesResponseType(typeof(DashboardStatsDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                _logger.LogInformation("Fetching dashboard statistics");
                var stats = await _reportsService.GetDashboardStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching dashboard statistics");
                return StatusCode(500, new { message = "An error occurred while fetching dashboard statistics", error = ex.Message });
            }
        }

        [HttpGet("sales-chart")]
        [ProducesResponseType(typeof(IEnumerable<SalesChartResponseDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetSalesChart([FromQuery] int days = 7)
        {
            try
            {
                if (days < 1 || days > 365)
                {
                    return BadRequest(new { message = "Days must be between 1 and 365" });
                }

                _logger.LogInformation("Fetching sales chart data for {Days} days", days);
                var chartData = await _reportsService.GetSalesChartDataAsync(days);
                
                var response = chartData.Data.Select(d => new SalesChartResponseDto
                {
                    Day = DateTime.Parse(d.Date).ToString("MMM dd"),
                    TotalSales = d.Sales
                }).ToList();
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching sales chart data");
                return StatusCode(500, new { message = "An error occurred while fetching sales chart data", error = ex.Message });
            }
        }

        [HttpGet("top-products")]
        [ProducesResponseType(typeof(IEnumerable<TopProductResponseDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetTopProducts([FromQuery] int count = 5)
        {
            try
            {
                if (count < 1 || count > 20)
                {
                    return BadRequest(new { message = "Count must be between 1 and 20" });
                }

                _logger.LogInformation("Fetching top {Count} products for dashboard", count);
                var products = await _reportsService.GetTopSellingProductsAsync(count);
                
                var response = products.Select(p => new TopProductResponseDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    UnitsSold = p.TotalQuantitySold,
                    Revenue = p.TotalRevenue
                }).ToList();
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching top products");
                return StatusCode(500, new { message = "An error occurred while fetching top products", error = ex.Message });
            }
        }

        [HttpGet("recent-transactions")]
        [ProducesResponseType(typeof(IEnumerable<RecentTransactionResponseDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetRecentTransactions([FromQuery] int count = 10)
        {
            try
            {
                if (count < 1 || count > 50)
                {
                    return BadRequest(new { message = "Count must be between 1 and 50" });
                }

                _logger.LogInformation("Fetching {Count} recent transactions for dashboard", count);
                var transactions = await _transactionService.GetRecentTransactionsAsync(count);
                
                if (transactions == null)
                {
                    _logger.LogWarning("Transaction service returned null");
                    return Ok(new List<RecentTransactionResponseDto>());
                }
                
                var response = transactions.Select(t => new RecentTransactionResponseDto
                {
                    TransactionId = t.TransactionId,
                    TransactionCode = t.TransactionCode ?? "N/A",
                    StaffName = t.StaffName ?? "Unknown",
                    PaymentMethod = t.PaymentMethod.ToString(),
                    TotalAmount = t.TotalAmount,
                    CreatedAt = t.TransactionDate
                }).ToList();
                
                _logger.LogInformation("Returning {Count} recent transactions", response.Count);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching recent transactions. Details: {Message}, StackTrace: {StackTrace}", 
                    ex.Message, ex.StackTrace);
                return StatusCode(500, new { 
                    message = "An error occurred while fetching recent transactions", 
                    error = ex.Message,
                    details = ex.InnerException?.Message 
                });
            }
        }

        [HttpGet("sales-by-category")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetSalesByCategory()
        {
            try
            {
                _logger.LogInformation("Fetching sales by category");
                var transactions = await _transactionService.GetAllTransactionsAsync(false);
                
                var categoryData = transactions
                    .SelectMany(t => t.Items ?? Enumerable.Empty<DTOs.Transactions.TransactionItemDto>())
                    .GroupBy(item => item.ProductCode?.Substring(0, 3) ?? "OTH")
                    .Select(g => new
                    {
                        category = g.Key == "MED" ? "Medicine" : 
                                  g.Key == "VIT" ? "Vitamins" :
                                  g.Key == "SUP" ? "Supplements" :
                                  g.Key == "EQU" ? "Equipment" : "Other",
                        revenue = g.Sum(item => item.Subtotal),
                        count = g.Count()
                    })
                    .OrderByDescending(x => x.revenue)
                    .ToList();

                return Ok(categoryData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching sales by category");
                return StatusCode(500, new { message = "An error occurred while fetching sales by category", error = ex.Message });
            }
        }

        [HttpGet("payment-methods")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetPaymentMethods()
        {
            try
            {
                _logger.LogInformation("Fetching payment methods breakdown");
                var transactions = await _transactionService.GetAllTransactionsAsync(false);
                
                var paymentData = transactions
                    .GroupBy(t => t.PaymentMethod)
                    .Select(g => new
                    {
                        method = g.Key.ToString(),
                        count = g.Count(),
                        revenue = g.Sum(t => t.TotalAmount),
                        percentage = 0.0
                    })
                    .ToList();

                var totalRevenue = paymentData.Sum(p => p.revenue);
                var result = paymentData.Select(p => new
                {
                    p.method,
                    p.count,
                    p.revenue,
                    percentage = totalRevenue > 0 ? Math.Round((p.revenue / totalRevenue) * 100, 1) : 0
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching payment methods breakdown");
                return StatusCode(500, new { message = "An error occurred while fetching payment methods breakdown", error = ex.Message });
            }
        }
    }
}
