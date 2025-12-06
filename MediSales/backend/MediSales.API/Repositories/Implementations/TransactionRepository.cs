using MediSales.API.Repositories.Interfaces;
using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.DTOs.Transactions;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Repositories.Implementations
{
    /// <summary>Repository for transaction data access.</summary>
    public class TransactionRepository : ITransactionRepository
    {
        private readonly ApplicationDbContext _context;

        public TransactionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Transaction>> GetAllTransactionsAsync()
        {
            return await _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .Include(t => t.VoidedByUser)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Transaction> Transactions, int TotalCount)> GetTransactionsPaginatedAsync(
            int page, 
            int pageSize, 
            bool includeVoided = false)
        {
            var query = _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .Include(t => t.VoidedByUser)
                .AsQueryable();

            // Filter out voided transactions if needed
            if (!includeVoided)
            {
                query = query.Where(t => !t.IsVoided);
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination at database level (CRITICAL for performance)
            var transactions = await query
                .OrderByDescending(t => t.TransactionDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (transactions, totalCount);
        }

        public async Task<IEnumerable<Transaction>> FilterTransactionsAsync(TransactionFilterDto filters)
        {
            var query = _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .Include(t => t.VoidedByUser)
                .AsQueryable();

            // Date range filter
            if (filters.StartDate.HasValue)
            {
                var startOfDay = filters.StartDate.Value.Date;
                query = query.Where(t => t.TransactionDate >= startOfDay);
            }

            if (filters.EndDate.HasValue)
            {
                var endOfDay = filters.EndDate.Value.Date.AddDays(1);
                query = query.Where(t => t.TransactionDate < endOfDay);
            }

            // Staff filter
            if (filters.StaffId.HasValue)
            {
                query = query.Where(t => t.UserId == filters.StaffId.Value);
            }

            // Payment method filter
            if (!string.IsNullOrWhiteSpace(filters.PaymentMethod))
            {
                if (Enum.TryParse<PaymentMethod>(filters.PaymentMethod, true, out var paymentMethod))
                {
                    query = query.Where(t => t.PaymentMethod == paymentMethod);
                }
            }

            // Discount type filter
            if (!string.IsNullOrWhiteSpace(filters.DiscountType))
            {
                if (Enum.TryParse<DiscountType>(filters.DiscountType, true, out var discountType))
                {
                    query = query.Where(t => t.DiscountType == discountType);
                }
            }

            // Amount range filter
            if (filters.MinAmount.HasValue)
            {
                query = query.Where(t => t.TotalAmount >= filters.MinAmount.Value);
            }

            if (filters.MaxAmount.HasValue)
            {
                query = query.Where(t => t.TotalAmount <= filters.MaxAmount.Value);
            }

            // Search term filter (transaction code only)
            if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
            {
                var searchTerm = filters.SearchTerm.ToLower();
                query = query.Where(t => t.TransactionCode.ToLower().Contains(searchTerm));
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(filters.Status))
            {
                switch (filters.Status.ToLower())
                {
                    case "active":
                        query = query.Where(t => !t.IsVoided);
                        break;
                    case "voided":
                        query = query.Where(t => t.IsVoided);
                        break;
                    case "all":
                        // No filter, include all
                        break;
                }
            }
            else if (!filters.IncludeVoided)
            {
                // Default: exclude voided transactions
                query = query.Where(t => !t.IsVoided);
            }

            return await query
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<Transaction?> GetTransactionByIdAsync(int id)
        {
            return await _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .FirstOrDefaultAsync(t => t.TransactionId == id);
        }

        public async Task<IEnumerable<Transaction>> GetTransactionsByDateAsync(DateTime date)
        {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);

            return await _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .Where(t => t.TransactionDate >= startOfDay && t.TransactionDate < endOfDay)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Transaction>> GetTransactionsByStaffAsync(int userId)
        {
            return await _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Transaction>> GetTransactionsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var start = startDate.Date;
            var end = endDate.Date.AddDays(1);

            return await _context.Transactions
                .Include(t => t.User)
                .Include(t => t.TransactionItems)
                    .ThenInclude(ti => ti.Product)
                .Where(t => t.TransactionDate >= start && t.TransactionDate < end)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<Transaction> CreateTransactionAsync(Transaction transaction)
        {
            // Add the transaction (transaction management handled by TransactionService)
            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Load related data
            await _context.Entry(transaction)
                .Reference(t => t.User)
                .LoadAsync();

            await _context.Entry(transaction)
                .Collection(t => t.TransactionItems)
                .LoadAsync();

            return transaction;
        }

        public async Task<Transaction> UpdateTransactionAsync(Transaction transaction)
        {
            _context.Transactions.Update(transaction);
            await _context.SaveChangesAsync();

            // Reload related data
            await _context.Entry(transaction)
                .Reference(t => t.User)
                .LoadAsync();

            if (transaction.VoidedBy.HasValue)
            {
                await _context.Entry(transaction)
                    .Reference(t => t.VoidedByUser)
                    .LoadAsync();
            }

            await _context.Entry(transaction)
                .Collection(t => t.TransactionItems)
                .LoadAsync();

            return transaction;
        }

        public async Task<decimal> GetDailySalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            return await _context.Transactions
                .Where(t => t.TransactionDate >= today && t.TransactionDate < tomorrow)
                .SumAsync(t => t.TotalAmount);
        }

        public async Task<decimal> GetWeeklySalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var dayOfWeek = (int)today.DayOfWeek;
            var startOfWeek = today.AddDays(-(dayOfWeek == 0 ? 6 : dayOfWeek - 1));
            var endOfWeek = startOfWeek.AddDays(7);

            return await _context.Transactions
                .Where(t => t.TransactionDate >= startOfWeek && t.TransactionDate < endOfWeek)
                .SumAsync(t => t.TotalAmount);
        }

        public async Task<decimal> GetMonthlySalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1);

            return await _context.Transactions
                .Where(t => t.TransactionDate >= startOfMonth && t.TransactionDate < endOfMonth)
                .SumAsync(t => t.TotalAmount);
        }

        public async Task<decimal> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var start = startDate.Date;
            var end = endDate.Date.AddDays(1);

            return await _context.Transactions
                .Where(t => t.TransactionDate >= start && t.TransactionDate < end)
                .SumAsync(t => t.TotalAmount);
        }
    }
}
