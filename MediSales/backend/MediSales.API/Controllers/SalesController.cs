using Microsoft.AspNetCore.Mvc;
using MediSales.API.DTOs.Transactions;
using MediSales.API.Services.Interfaces;
using System.Security.Claims;
using ClosedXML.Excel;

namespace MediSales.API.Controllers
{
    /// <summary>Sales endpoints.</summary>
    [ApiController]
    [Route("api/sales")]
    public class SalesController : ControllerBase
    {
        private readonly ITransactionService _transactionService;
        private readonly ILogger<SalesController> _logger;

        public SalesController(
            ITransactionService transactionService,
            ILogger<SalesController> logger)
        {
            _transactionService = transactionService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetAllSales([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                _logger.LogInformation("Fetching sales - Page: {Page}, PageSize: {PageSize}", page, pageSize);
                var transactions = await _transactionService.GetAllTransactionsAsync();
                
                // Apply pagination
                var totalCount = transactions.Count();
                var paginatedSales = transactions
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var response = new
                {
                    Data = paginatedSales,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching sales");
                return StatusCode(500, new { message = "An error occurred while fetching sales", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(TransactionDto), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetSaleById(int id)
        {
            try
            {
                _logger.LogInformation("Fetching sale with ID: {SaleId}", id);
                var transaction = await _transactionService.GetTransactionByIdAsync(id);

                if (transaction == null)
                {
                    _logger.LogWarning("Sale with ID {SaleId} not found", id);
                    return NotFound(new { message = $"Sale with ID {id} not found" });
                }

                return Ok(transaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching sale with ID: {SaleId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching sale", error = ex.Message });
            }
        }

        [HttpGet("daily")]
        [ProducesResponseType(typeof(TransactionSummaryDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetDailySales()
        {
            try
            {
                _logger.LogInformation("Fetching daily sales summary");
                var summary = await _transactionService.GetDailySalesAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching daily sales");
                return StatusCode(500, new { message = "An error occurred while fetching daily sales", error = ex.Message });
            }
        }

        [HttpGet("weekly")]
        [ProducesResponseType(typeof(TransactionSummaryDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetWeeklySales()
        {
            try
            {
                _logger.LogInformation("Fetching weekly sales summary");
                var summary = await _transactionService.GetWeeklySalesAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching weekly sales");
                return StatusCode(500, new { message = "An error occurred while fetching weekly sales", error = ex.Message });
            }
        }

        [HttpGet("monthly")]
        [ProducesResponseType(typeof(TransactionSummaryDto), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetMonthlySales()
        {
            try
            {
                _logger.LogInformation("Fetching monthly sales summary");
                var summary = await _transactionService.GetMonthlySalesAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching monthly sales");
                return StatusCode(500, new { message = "An error occurred while fetching monthly sales", error = ex.Message });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(TransactionDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> CreateSale([FromBody] CreateTransactionDto createDto)
        {
            try
            {
                _logger.LogInformation("Creating new sale transaction");
                _logger.LogInformation("Transaction payload: UserId={UserId}, Items={ItemCount}, DiscountType={DiscountType}, PaymentMethod={PaymentMethod}, AmountPaid={AmountPaid}", 
                    createDto.UserId, createDto.Items?.Count ?? 0, createDto.DiscountType, createDto.PaymentMethod, createDto.AmountPaid);

                if (createDto == null || createDto.Items == null || !createDto.Items.Any())
                {
                    _logger.LogWarning("Invalid transaction data received");
                    return BadRequest(new { message = "Invalid transaction data. At least one sale item is required." });
                }

                // ✅ FIX: Use JWT if available, otherwise use payload UserId (backward compatibility)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    // Prefer JWT user ID (most secure)
                    createDto.UserId = jwtUserId;
                }
                else if (createDto.UserId <= 0)
                {
                    // No JWT and no valid UserId in payload
                    _logger.LogWarning("No valid user ID from JWT or payload");
                    return Unauthorized(new { message = "User authentication required" });
                }
                // else: Use the UserId from payload (frontend already sends it)

                var transaction = await _transactionService.CreateTransactionAsync(createDto);
                _logger.LogInformation("Sale transaction created successfully with ID: {TransactionId}", transaction.TransactionId);

                return CreatedAtAction(
                    nameof(GetSaleById),
                    new { id = transaction.TransactionId },
                    transaction
                );
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid sale transaction data");
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business logic error during sale creation");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating sale transaction. Details: {ErrorMessage}, StackTrace: {StackTrace}", 
                    ex.Message, ex.StackTrace);
                return StatusCode(500, new { message = "An error occurred while creating the sale", error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        [HttpGet("export")]
        [ProducesResponseType(typeof(FileResult), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> ExportSales([FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] string? search)
        {
            try
            {
                _logger.LogInformation("Exporting sales - StartDate: {StartDate}, EndDate: {EndDate}, Search: {Search}", startDate, endDate, search);

                var transactions = await _transactionService.GetAllTransactionsAsync();
                
                // Apply filters
                var filteredTransactions = transactions.AsEnumerable();
                
                if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var parsedStartDate))
                {
                    filteredTransactions = filteredTransactions.Where(t => t.TransactionDate >= parsedStartDate);
                }
                
                if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var parsedEndDate))
                {
                    filteredTransactions = filteredTransactions.Where(t => t.TransactionDate <= parsedEndDate.AddDays(1).AddSeconds(-1));
                }
                
                if (!string.IsNullOrEmpty(search))
                {
                    filteredTransactions = filteredTransactions.Where(t => 
                        t.TransactionCode.Contains(search, StringComparison.OrdinalIgnoreCase));
                }

                var transactionsList = filteredTransactions.OrderBy(t => t.TransactionDate).ToList();

                // Generate Excel file using ClosedXML
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Transactions");

                // Add headers
                worksheet.Cell(1, 1).Value = "Transaction Code";
                worksheet.Cell(1, 2).Value = "Date & Time";
                worksheet.Cell(1, 3).Value = "Staff";
                worksheet.Cell(1, 4).Value = "Items Count";
                worksheet.Cell(1, 5).Value = "Subtotal";
                worksheet.Cell(1, 6).Value = "Discount Type";
                worksheet.Cell(1, 7).Value = "Discount Amount";
                worksheet.Cell(1, 8).Value = "Total Amount";
                worksheet.Cell(1, 9).Value = "Payment Method";
                worksheet.Cell(1, 10).Value = "Amount Paid";
                worksheet.Cell(1, 11).Value = "Change";
                worksheet.Cell(1, 12).Value = "Status";

                // Style headers
                var headerRange = worksheet.Range(1, 1, 1, 12);
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // Add data
                int row = 2;
                foreach (var transaction in transactionsList)
                {
                    worksheet.Cell(row, 1).Value = transaction.TransactionCode;
                    worksheet.Cell(row, 2).Value = transaction.TransactionDate.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cell(row, 3).Value = transaction.StaffName ?? "Unassigned";
                    worksheet.Cell(row, 4).Value = transaction.Items?.Count ?? 0;
                    worksheet.Cell(row, 5).Value = transaction.SubtotalAmount;
                    worksheet.Cell(row, 6).Value = transaction.DiscountType.ToString();
                    worksheet.Cell(row, 7).Value = transaction.DiscountAmount;
                    worksheet.Cell(row, 8).Value = transaction.TotalAmount;
                    worksheet.Cell(row, 9).Value = transaction.PaymentMethod.ToString();
                    worksheet.Cell(row, 10).Value = transaction.AmountPaid;
                    worksheet.Cell(row, 11).Value = transaction.ChangeAmount;
                    worksheet.Cell(row, 12).Value = transaction.IsVoided ? "Voided" : "Active";
                    row++;
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                // Generate file in memory
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var fileName = $"transactions-{DateTime.UtcNow:yyyyMMdd-HHmmss}.xlsx";
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while exporting sales");
                return StatusCode(500, new { message = "An error occurred while exporting sales", error = ex.Message });
            }
        }
    }
}
