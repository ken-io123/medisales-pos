using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediSales.API.DTOs.Transactions;
using MediSales.API.Services.Interfaces;
using System.Security.Claims;

namespace MediSales.API.Controllers
{
    /// <summary>
    /// POS transaction management endpoints.
    /// </summary>
    [ApiController]
    [Route("api/transactions")]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionService _transactionService;
        private readonly IAuditLogService _auditLogService;
        private readonly ILogger<TransactionController> _logger;

        public TransactionController(
            ITransactionService transactionService,
            IAuditLogService auditLogService,
            ILogger<TransactionController> logger)
        {
            _transactionService = transactionService;
            _auditLogService = auditLogService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<TransactionDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetAllTransactions(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] bool includeVoided = false)
        {
            try
            {
                _logger.LogInformation("Fetching transactions - Page: {Page}, PageSize: {PageSize}, IncludeVoided: {IncludeVoided}", 
                    page, pageSize, includeVoided);

                var (paginatedTransactions, totalCount) = await _transactionService.GetTransactionsPaginatedAsync(page, pageSize, includeVoided);

                var response = new
                {
                    Data = paginatedTransactions,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all transactions");
                return StatusCode(500, new { message = "An error occurred while fetching transactions", error = ex.Message });
            }
        }

        [HttpGet("filter")]
        [ProducesResponseType(typeof(IEnumerable<TransactionDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> FilterTransactions([FromQuery] TransactionFilterDto filters)
        {
            try
            {
                _logger.LogInformation("Filtering transactions with criteria");
                var transactions = await _transactionService.FilterTransactionsAsync(filters);
                
                var totalCount = transactions.Count();
                if (filters.Page.HasValue && filters.PageSize.HasValue)
                {
                    transactions = transactions
                        .Skip((filters.Page.Value - 1) * filters.PageSize.Value)
                        .Take(filters.PageSize.Value);
                }

                var response = new
                {
                    Data = transactions,
                    Page = filters.Page ?? 1,
                    PageSize = filters.PageSize ?? totalCount,
                    TotalCount = totalCount,
                    TotalPages = filters.PageSize.HasValue 
                        ? (int)Math.Ceiling(totalCount / (double)filters.PageSize.Value)
                        : 1
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while filtering transactions");
                return StatusCode(500, new { message = "An error occurred while filtering transactions", error = ex.Message });
            }
        }

        [HttpGet("today")]
        [ProducesResponseType(typeof(IEnumerable<TransactionDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetTodayTransactions()
        {
            try
            {
                _logger.LogInformation("Fetching today's transactions");
                var transactions = await _transactionService.GetTodayTransactionsAsync();
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching today's transactions");
                return StatusCode(500, new { message = "An error occurred while fetching today's transactions", error = ex.Message });
            }
        }

        [HttpGet("yesterday")]
        [ProducesResponseType(typeof(IEnumerable<TransactionDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetYesterdayTransactions()
        {
            try
            {
                _logger.LogInformation("Fetching yesterday's transactions");
                var transactions = await _transactionService.GetYesterdayTransactionsAsync();
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching yesterday's transactions");
                return StatusCode(500, new { message = "An error occurred while fetching yesterday's transactions", error = ex.Message });
            }
        }

        [HttpGet("date-range")]
        [ProducesResponseType(typeof(IEnumerable<TransactionDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetTransactionsByDateRange([FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            try
            {
                if (start > end)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                _logger.LogInformation("Fetching transactions from {StartDate} to {EndDate}", start, end);
                var transactions = await _transactionService.GetTransactionsByDateRangeAsync(start, end);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching transactions by date range");
                return StatusCode(500, new { message = "An error occurred while fetching transactions", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(TransactionDto), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetTransactionById(int id)
        {
            try
            {
                _logger.LogInformation("Fetching transaction with ID: {TransactionId}", id);
                var transaction = await _transactionService.GetTransactionByIdAsync(id);

                if (transaction == null)
                {
                    _logger.LogWarning("Transaction with ID {TransactionId} not found", id);
                    return NotFound(new { message = $"Transaction with ID {id} not found" });
                }

                return Ok(transaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching transaction with ID: {TransactionId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching transaction", error = ex.Message });
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

        [HttpGet("staff/{userId}")]
        [ProducesResponseType(typeof(IEnumerable<TransactionDto>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetTransactionsByStaff(int userId)
        {
            try
            {
                _logger.LogInformation("Fetching transactions for staff member with ID: {UserId}", userId);
                var transactions = await _transactionService.GetTransactionsByStaffAsync(userId);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching transactions for staff member with ID: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching transactions", error = ex.Message });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(TransactionDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for transaction creation");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Creating new transaction for user ID: {UserId}", createDto.UserId);

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    if (createDto.UserId != jwtUserId)
                    {
                        _logger.LogWarning("Transaction creation request UserId ({RequestUserId}) differs from authenticated UserId ({AuthUserId}). Overriding with authenticated user.", 
                            createDto.UserId, jwtUserId);
                        createDto.UserId = jwtUserId;
                    }
                }
                else
                {
                    _logger.LogWarning("No JWT found for transaction creation. Using UserId from request body: {UserId}", createDto.UserId);
                }

                var transaction = await _transactionService.CreateTransactionAsync(createDto);

                _logger.LogInformation("Transaction created successfully with ID: {TransactionId}, Code: {TransactionCode}", 
                    transaction.TransactionId, transaction.TransactionCode);

                await _auditLogService.LogAsync(
                    "Create", 
                    "Transaction", 
                    transaction.TransactionCode, 
                    createDto.UserId, 
                    $"Created transaction {transaction.TransactionCode} with total amount {transaction.TotalAmount:C}");

                return CreatedAtAction(
                    nameof(GetTransactionById), 
                    new { id = transaction.TransactionId }, 
                    transaction);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business validation error during transaction creation");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating transaction");
                return StatusCode(500, new { message = "An error occurred while creating transaction", error = ex.Message });
            }
        }

        [HttpPost("{id}/void")]
        [ProducesResponseType(typeof(TransactionDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> VoidTransaction(int id, [FromBody] VoidTransactionDto voidDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for transaction voiding");
                    return BadRequest(ModelState);
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                int voidedByUserId;
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    voidedByUserId = jwtUserId;
                }
                else
                {
                    voidedByUserId = 1;
                    _logger.LogWarning("No JWT found, using default admin user ID for void operation");
                }

                _logger.LogInformation("Voiding transaction ID: {TransactionId} by user ID: {UserId}", id, voidedByUserId);

                var voidedTransaction = await _transactionService.VoidTransactionAsync(
                    id, 
                    voidDto.VoidReason, 
                    voidedByUserId);

                _logger.LogInformation("Transaction {TransactionId} voided successfully", id);

                await _auditLogService.LogAsync(
                    "Void", 
                    "Transaction", 
                    voidedTransaction.TransactionCode, 
                    voidedByUserId, 
                    $"Voided transaction {voidedTransaction.TransactionCode}. Reason: {voidDto.VoidReason}");

                return Ok(voidedTransaction);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business validation error during transaction voiding");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while voiding transaction ID: {TransactionId}", id);
                return StatusCode(500, new { message = "An error occurred while voiding transaction", error = ex.Message });
            }
        }

        [HttpGet("export/csv")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ExportTransactionsToCSV(
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null)
        {
            try
            {
                _logger.LogInformation("Exporting transactions to CSV - DateFrom: {DateFrom}, DateTo: {DateTo}", dateFrom, dateTo);
                
                var transactions = await _transactionService.GetAllTransactionsAsync();
                
                // Apply date filters if provided
                if (dateFrom.HasValue)
                {
                    transactions = transactions.Where(t => t.TransactionDate >= dateFrom.Value);
                }
                if (dateTo.HasValue)
                {
                    transactions = transactions.Where(t => t.TransactionDate <= dateTo.Value);
                }

                var csv = new System.Text.StringBuilder();
                csv.AppendLine("Transaction Code,Staff Name,Payment Method,Total Amount,Discount,Cashier ID,Transaction Date");
                
                foreach (var transaction in transactions)
                {
                    var transactionDate = transaction.TransactionDate != DateTime.MinValue ? transaction.TransactionDate.ToString("yyyy-MM-dd HH:mm:ss") : "";
                    csv.AppendLine($"\"{transaction.TransactionCode}\",\"{transaction.StaffName}\",\"{transaction.PaymentMethod}\",{transaction.TotalAmount},{transaction.DiscountAmount},{transaction.UserId},\"{transactionDate}\"");
                }

                var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
                var fileName = $"transactions_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                
                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting transactions to CSV");
                return StatusCode(500, new { message = "An error occurred while exporting transactions" });
            }
        }

        [HttpGet("{id}/receipt")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetReceipt(int id)
        {
            try
            {
                _logger.LogInformation("Fetching receipt for transaction ID: {TransactionId}", id);
                var transaction = await _transactionService.GetTransactionByIdAsync(id);

                if (transaction == null)
                {
                    _logger.LogWarning("Transaction with ID {TransactionId} not found", id);
                    return NotFound(new { message = $"Transaction with ID {id} not found" });
                }

                var receipt = new
                {
                    storeName = "MediSales POS System",
                    storeAddress = "Pharmacy Address",
                    storePhone = "Contact Number",
                    transactionCode = transaction.TransactionCode,
                    cashier = transaction.StaffName,
                    cashierId = transaction.UserId,
                    dateTime = transaction.TransactionDate.ToString("yyyy-MM-dd HH:mm:ss"),
                    paymentMethod = transaction.PaymentMethod.ToString(),
                    items = transaction.Items?.Select(item => new
                    {
                        productName = item.ProductName,
                        quantity = item.Quantity,
                        unitPrice = item.UnitPrice,
                        subtotal = item.Subtotal
                    }),
                    subtotal = transaction.SubtotalAmount,
                    discountType = transaction.DiscountType.ToString(),
                    discountAmount = transaction.DiscountAmount,
                    discountPercentage = transaction.DiscountPercentage,
                    total = transaction.TotalAmount,
                    amountPaid = transaction.AmountPaid,
                    changeAmount = transaction.ChangeAmount
                };

                return Ok(receipt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching receipt for transaction ID: {TransactionId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching receipt", error = ex.Message });
            }
        }
    }
}
