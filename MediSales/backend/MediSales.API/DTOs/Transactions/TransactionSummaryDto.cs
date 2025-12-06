namespace MediSales.API.DTOs.Transactions
{
    /// <summary>
    /// Sales summary for a period.
    /// </summary>
    public class TransactionSummaryDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalSales { get; set; }
        public int TransactionCount { get; set; }
        public decimal AverageTransactionAmount { get; set; }
        public decimal TotalDiscounts { get; set; }
    }
}
