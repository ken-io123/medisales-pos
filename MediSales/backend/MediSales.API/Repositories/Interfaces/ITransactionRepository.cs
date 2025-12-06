using MediSales.API.Models.Entities;
using MediSales.API.DTOs.Transactions;

namespace MediSales.API.Repositories.Interfaces
{
    /// <summary>Repository for transaction data access.</summary>
    public interface ITransactionRepository
    {
        Task<IEnumerable<Transaction>> GetAllTransactionsAsync();
        Task<(IEnumerable<Transaction> Transactions, int TotalCount)> GetTransactionsPaginatedAsync(int page, int pageSize, bool includeVoided = false);
        Task<IEnumerable<Transaction>> FilterTransactionsAsync(TransactionFilterDto filters);
        Task<Transaction?> GetTransactionByIdAsync(int id);
        Task<IEnumerable<Transaction>> GetTransactionsByDateAsync(DateTime date);
        Task<IEnumerable<Transaction>> GetTransactionsByStaffAsync(int userId);
        Task<IEnumerable<Transaction>> GetTransactionsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<Transaction> CreateTransactionAsync(Transaction transaction);
        Task<Transaction> UpdateTransactionAsync(Transaction transaction);
        Task<decimal> GetDailySalesAsync();
        Task<decimal> GetWeeklySalesAsync();
        Task<decimal> GetMonthlySalesAsync();
        Task<decimal> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
}
