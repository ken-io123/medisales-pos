using MediSales.API.DTOs.Transactions;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for transaction business logic operations.</summary>
    public interface ITransactionService
    {
        Task<IEnumerable<TransactionDto>> GetAllTransactionsAsync(bool includeVoided = false);
        Task<(IEnumerable<TransactionDto> Transactions, int TotalCount)> GetTransactionsPaginatedAsync(int page, int pageSize, bool includeVoided = false);
        Task<IEnumerable<TransactionDto>> FilterTransactionsAsync(TransactionFilterDto filters);
        Task<IEnumerable<TransactionDto>> GetTodayTransactionsAsync();
        Task<IEnumerable<TransactionDto>> GetYesterdayTransactionsAsync();
        Task<TransactionDto?> GetTransactionByIdAsync(int id);
        Task<IEnumerable<TransactionDto>> GetTransactionsByDateAsync(DateTime date);
        Task<IEnumerable<TransactionDto>> GetTransactionsByStaffAsync(int userId);
        Task<IEnumerable<TransactionDto>> GetTransactionsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<TransactionDto> CreateTransactionAsync(CreateTransactionDto createDto);
        Task<TransactionDto> VoidTransactionAsync(int transactionId, string voidReason, int voidedByUserId);
        Task<TransactionSummaryDto> GetDailySalesAsync();
        Task<TransactionSummaryDto> GetWeeklySalesAsync();
        Task<TransactionSummaryDto> GetMonthlySalesAsync();
        Task<IEnumerable<TransactionDto>> GetRecentTransactionsAsync(int count);
    }
}
