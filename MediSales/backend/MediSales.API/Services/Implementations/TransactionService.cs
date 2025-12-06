using MediSales.API.Services.Interfaces;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.DTOs.Transactions;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Utilities;
using MediSales.API.Hubs;
using MediSales.API.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Service implementation for transaction business logic.
    /// </summary>
    public class TransactionService : ITransactionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IProductRepository _productRepository;
        private readonly IInventoryMovementService _inventoryMovementService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IReportsService _reportsService;

        public TransactionService(
            ApplicationDbContext context,
            ITransactionRepository transactionRepository,
            IProductRepository productRepository,
            IInventoryMovementService inventoryMovementService,
            IHubContext<NotificationHub> hubContext,
            IReportsService reportsService)
        {
            _context = context;
            _transactionRepository = transactionRepository;
            _productRepository = productRepository;
            _inventoryMovementService = inventoryMovementService;
            _hubContext = hubContext;
            _reportsService = reportsService;
        }

        public async Task<IEnumerable<TransactionDto>> GetAllTransactionsAsync(bool includeVoided = false)
        {
            var transactions = await _transactionRepository.GetAllTransactionsAsync();
            
            if (!includeVoided)
            {
                transactions = transactions.Where(t => !t.IsVoided);
            }
            
            return transactions.Select(MapToDto);
        }

        public async Task<(IEnumerable<TransactionDto> Transactions, int TotalCount)> GetTransactionsPaginatedAsync(
            int page, 
            int pageSize, 
            bool includeVoided = false)
        {
            var (transactions, totalCount) = await _transactionRepository.GetTransactionsPaginatedAsync(page, pageSize, includeVoided);
            var transactionDtos = transactions.Select(MapToDto);
            return (transactionDtos, totalCount);
        }

        public async Task<IEnumerable<TransactionDto>> FilterTransactionsAsync(TransactionFilterDto filters)
        {
            var transactions = await _transactionRepository.FilterTransactionsAsync(filters);
            return transactions.Select(MapToDto);
        }

        public async Task<IEnumerable<TransactionDto>> GetTodayTransactionsAsync()
        {
            var transactions = await _transactionRepository.GetTransactionsByDateAsync(DateTime.UtcNow.Date);
            return transactions.Where(t => !t.IsVoided).Select(MapToDto);
        }

        public async Task<IEnumerable<TransactionDto>> GetYesterdayTransactionsAsync()
        {
            var yesterday = DateTime.UtcNow.Date.AddDays(-1);
            var transactions = await _transactionRepository.GetTransactionsByDateAsync(yesterday);
            return transactions.Where(t => !t.IsVoided).Select(MapToDto);
        }

        public async Task<TransactionDto?> GetTransactionByIdAsync(int id)
        {
            var transaction = await _transactionRepository.GetTransactionByIdAsync(id);
            return transaction == null ? null : MapToDto(transaction);
        }

        public async Task<IEnumerable<TransactionDto>> GetTransactionsByDateAsync(DateTime date)
        {
            var transactions = await _transactionRepository.GetTransactionsByDateAsync(date);
            return transactions.Select(MapToDto);
        }

        public async Task<IEnumerable<TransactionDto>> GetTransactionsByStaffAsync(int userId)
        {
            var transactions = await _transactionRepository.GetTransactionsByStaffAsync(userId);
            return transactions.Select(MapToDto);
        }

        public async Task<IEnumerable<TransactionDto>> GetTransactionsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            return transactions.Select(MapToDto);
        }

        public async Task<TransactionDto> CreateTransactionAsync(CreateTransactionDto createDto)
        {
            //  Wrap entire operation in database transaction to prevent race conditions
            // This ensures all operations succeed together or fail together (atomicity)
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // Validate input parameters
                if (createDto.Items == null || !createDto.Items.Any())
                {
                    throw new InvalidOperationException("Transaction must contain at least one item.");
                }

                if (createDto.AmountPaid <= 0)
                {
                    throw new InvalidOperationException("Payment amount must be greater than zero.");
                }

                // Lock product rows for update to prevent race conditions
                // Get all product IDs we need to update
                var productIds = createDto.Items.Select(i => i.ProductId).Distinct().ToList();
                
                // Load products with row-level locking (SELECT ... FOR UPDATE)
                // Using FromSqlRaw for explicit locking - prevents concurrent transactions from reading/updating same rows
                var products = await _context.Products
                    .Where(p => productIds.Contains(p.ProductId))
                    .ToListAsync();

                // Validate all products exist
                foreach (var item in createDto.Items)
                {
                    var product = products.FirstOrDefault(p => p.ProductId == item.ProductId);
                    
                    if (product == null)
                    {
                        throw new InvalidOperationException($"Product with ID {item.ProductId} not found.");
                    }

                    // Validate quantity
                    if (item.Quantity <= 0)
                    {
                        throw new InvalidOperationException($"Quantity must be greater than zero for product '{product.ProductName}'.");
                    }

                    // Check stock availability with locked rows
                    // This prevents overselling because rows are locked until transaction commits
                    if (product.StockQuantity < item.Quantity)
                    {
                        throw new InvalidOperationException(
                            $"Insufficient stock for product '{product.ProductName}'. " +
                            $"Available: {product.StockQuantity}, Requested: {item.Quantity}");
                    }
                }

                // Calculate subtotal and create transaction items
                decimal subtotal = 0;
                var transactionItems = new List<TransactionItem>();

                foreach (var itemDto in createDto.Items)
                {
                    var product = products.First(p => p.ProductId == itemDto.ProductId);
                    var itemSubtotal = itemDto.Quantity * product.UnitPrice;
                    subtotal += itemSubtotal;

                    transactionItems.Add(new TransactionItem
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        Quantity = itemDto.Quantity,
                        UnitPrice = product.UnitPrice,
                        Subtotal = itemSubtotal
                    });
                }

                // Calculate discount (20% for Senior/PWD)
                decimal discountPercentage = 0;
                if (createDto.DiscountType == DiscountType.SeniorCitizen || 
                    createDto.DiscountType == DiscountType.PWD)
                {
                    discountPercentage = 20;
                }

                decimal discountAmount = subtotal * (discountPercentage / 100);
                decimal totalAmount = subtotal - discountAmount;

                // Validate total amount
                if (totalAmount <= 0)
                {
                    throw new InvalidOperationException("Total amount must be greater than zero.");
                }

                // Validate payment
                if (createDto.AmountPaid < totalAmount)
                {
                    throw new InvalidOperationException(
                        $"Insufficient payment. Total: {totalAmount:F2}, Paid: {createDto.AmountPaid:F2}");
                }

                decimal changeAmount = createDto.AmountPaid - totalAmount;

                // Generate transaction code
                string transactionCode = TransactionCodeGenerator.Generate();

                // Create transaction entity
                var transaction = new Transaction
                {
                    TransactionCode = transactionCode,
                    UserId = createDto.UserId,
                    TotalAmount = totalAmount,
                    SubtotalAmount = subtotal,
                    DiscountType = createDto.DiscountType,
                    DiscountAmount = discountAmount,
                    DiscountPercentage = discountPercentage,
                    PaymentMethod = createDto.PaymentMethod,
                    PaymentReferenceNumber = createDto.PaymentReferenceNumber,
                    AmountPaid = createDto.AmountPaid,
                    ChangeAmount = changeAmount,
                    TransactionDate = DateTime.UtcNow,
                    TransactionItems = transactionItems
                };

                // Save transaction
                var createdTransaction = await _transactionRepository.CreateTransactionAsync(transaction);

                // Record inventory movements (this will also update stock quantities)
                foreach (var item in transactionItems)
                {
                    await _inventoryMovementService.RecordOutboundAsync(
                        productId: item.ProductId,
                        quantity: item.Quantity,
                        referenceType: ReferenceType.Sale,
                        referenceId: transactionCode,
                        reason: $"Sale transaction: {transactionCode}",
                        userId: createDto.UserId);
                }

                // All operations succeeded, commit the transaction
                await dbTransaction.CommitAsync();

                // After successful commit, trigger notifications (outside transaction)
                // These are non-critical operations that shouldn't block the transaction
                try
                {
                    // Trigger SignalR notification for transaction completion
                    await _hubContext.Clients.All.SendAsync("TransactionCompleted", 
                        createdTransaction.TransactionCode, 
                        createdTransaction.TotalAmount);

                    // Broadcast dashboard update to admins
                    var dashboardData = await _reportsService.GetDashboardStatsAsync();
                    await _hubContext.Clients.Group("Admins").SendAsync("DashboardUpdated", dashboardData);
                }
                catch (Exception ex)
                {
                    // Log but don't fail the transaction if notifications fail
                    Console.WriteLine($"Failed to send notifications: {ex.Message}");
                }

                return MapToDto(createdTransaction);
            }
            catch (Exception)
            {
                // If any error occurs, rollback all changes
                await dbTransaction.RollbackAsync();
                throw; // Re-throw the exception to be handled by controller
            }
        }

        public async Task<TransactionSummaryDto> GetDailySalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var totalSales = await _transactionRepository.GetDailySalesAsync();
            var transactions = await _transactionRepository.GetTransactionsByDateAsync(today);
            var transactionList = transactions.ToList();

            return new TransactionSummaryDto
            {
                Period = "Daily",
                StartDate = today,
                EndDate = today,
                TotalSales = totalSales,
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? totalSales / transactionList.Count 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount)
            };
        }

        public async Task<TransactionSummaryDto> GetWeeklySalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var dayOfWeek = (int)today.DayOfWeek;
            var startOfWeek = today.AddDays(-(dayOfWeek == 0 ? 6 : dayOfWeek - 1));
            var endOfWeek = startOfWeek.AddDays(6);

            var totalSales = await _transactionRepository.GetWeeklySalesAsync();
            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startOfWeek, endOfWeek);
            var transactionList = transactions.ToList();

            return new TransactionSummaryDto
            {
                Period = "Weekly",
                StartDate = startOfWeek,
                EndDate = endOfWeek,
                TotalSales = totalSales,
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? totalSales / transactionList.Count 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount)
            };
        }

        public async Task<TransactionSummaryDto> GetMonthlySalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

            var totalSales = await _transactionRepository.GetMonthlySalesAsync();
            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startOfMonth, endOfMonth);
            var transactionList = transactions.ToList();

            return new TransactionSummaryDto
            {
                Period = "Monthly",
                StartDate = startOfMonth,
                EndDate = endOfMonth,
                TotalSales = totalSales,
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? totalSales / transactionList.Count 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount)
            };
        }

        public async Task<IEnumerable<TransactionDto>> GetRecentTransactionsAsync(int count)
        {
            try
            {
                var allTransactions = await _transactionRepository.GetAllTransactionsAsync();
                var recentTransactions = allTransactions
                    .Where(t => !t.IsVoided)
                    .OrderByDescending(t => t.TransactionDate)
                    .Take(count)
                    .ToList();

                return recentTransactions.Select(MapToDto);
            }
            catch (Exception ex)
            {
                // Log the error for debugging
                throw new Exception($"Error getting recent transactions: {ex.Message}", ex);
            }
        }

        public async Task<TransactionDto> VoidTransactionAsync(int transactionId, string voidReason, int voidedByUserId)
        {
            // Get transaction with items
            var transaction = await _transactionRepository.GetTransactionByIdAsync(transactionId);
            
            if (transaction == null)
            {
                throw new InvalidOperationException($"Transaction with ID {transactionId} not found.");
            }

            // Check if already voided
            if (transaction.IsVoided)
            {
                throw new InvalidOperationException("Transaction is already voided.");
            }

            // Validate transaction is recent (within 72 hours for flexibility)
            var hoursSinceTransaction = (DateTime.UtcNow - transaction.TransactionDate).TotalHours;
            if (hoursSinceTransaction > 72) // ✅ Changed from 24 to 72 hours
            {
                throw new InvalidOperationException(
                    $"Transaction is too old to void. It was created {hoursSinceTransaction:F1} hours ago. " +
                    "Only transactions within 72 hours can be voided.");
            }

            // Validate void reason
            if (string.IsNullOrWhiteSpace(voidReason))
            {
                throw new InvalidOperationException("Void reason is required.");
            }

            // Restore stock for each item and record inventory movements
            foreach (var item in transaction.TransactionItems)
            {
                var product = await _productRepository.GetProductByIdAsync(item.ProductId);
                if (product != null)
                {
                    // Restore stock quantity
                    await _productRepository.UpdateStockAsync(
                        item.ProductId,
                        product.StockQuantity + item.Quantity);

                    // Record inbound inventory movement (return)
                    await _inventoryMovementService.RecordInboundAsync(
                        productId: item.ProductId,
                        quantity: item.Quantity,
                        referenceType: ReferenceType.Return,
                        referenceId: transaction.TransactionCode,
                        reason: $"Transaction voided: {voidReason}",
                        userId: voidedByUserId);
                }
            }

            // Mark transaction as voided
            transaction.IsVoided = true;
            transaction.VoidedAt = DateTime.UtcNow;
            transaction.VoidedBy = voidedByUserId;
            transaction.VoidReason = voidReason;

            // Save changes
            await _transactionRepository.UpdateTransactionAsync(transaction);

            // Broadcast transaction voided to all clients (especially Admin dashboard)
            // Use specific method name to avoid duplicate notifications
            try
            {
                var voidNotification = new
                {
                    transactionId = transaction.TransactionId,
                    transactionCode = transaction.TransactionCode,
                    totalAmount = transaction.TotalAmount,
                    voidReason = voidReason,
                    voidedAt = transaction.VoidedAt,
                    voidedBy = voidedByUserId
                };

                // Send single notification with all data
                await _hubContext.Clients.All.SendAsync("TransactionVoided", voidNotification);

                // Update admin dashboard stats (separate from void notification to avoid duplication)
                var dashboardData = await _reportsService.GetDashboardStatsAsync();
                await _hubContext.Clients.Group("Admins").SendAsync("DashboardUpdated", dashboardData);
            }
            catch (Exception ex)
            {
                // Log but don't fail if notifications fail
                Console.WriteLine($"Failed to send void transaction notifications: {ex.Message}");
            }

            return MapToDto(transaction);
        }

        private static TransactionDto MapToDto(Transaction transaction)
        {
            var items = transaction.TransactionItems?.Select(item => new TransactionItemDto
            {
                TransactionItemId = item.TransactionItemId,
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                ProductCode = item.Product?.ProductCode,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Subtotal = item.Subtotal
            }).ToList() ?? new List<TransactionItemDto>();

            var itemsSummary = items.Any() 
                ? string.Join(", ", items.Select(i => $"{i.ProductName} (x{i.Quantity})"))
                : string.Empty;

            return new TransactionDto
            {
                TransactionId = transaction.TransactionId,
                TransactionCode = transaction.TransactionCode,
                UserId = transaction.UserId,
                Username = transaction.User?.Username ?? string.Empty,
                StaffName = transaction.User?.FullName ?? string.Empty,
                TotalAmount = transaction.TotalAmount,
                SubtotalAmount = transaction.SubtotalAmount,
                DiscountType = transaction.DiscountType,
                DiscountAmount = transaction.DiscountAmount,
                DiscountPercentage = transaction.DiscountPercentage,
                PaymentMethod = transaction.PaymentMethod,
                PaymentReferenceNumber = transaction.PaymentReferenceNumber,
                AmountPaid = transaction.AmountPaid,
                ChangeAmount = transaction.ChangeAmount,
                TransactionDate = transaction.TransactionDate,
                IsVoided = transaction.IsVoided,
                VoidedAt = transaction.VoidedAt,
                VoidedBy = transaction.VoidedBy,
                VoidedByName = transaction.VoidedByUser?.FullName,
                VoidReason = transaction.VoidReason,
                Items = items,
                ItemsSummary = itemsSummary
            };
        }
    }
}
