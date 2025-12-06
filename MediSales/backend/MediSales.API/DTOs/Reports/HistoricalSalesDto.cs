namespace MediSales.API.DTOs.Reports
{
    public class HistoricalSalesDto
    {
        public DateTime Date { get; set; }
        public decimal TotalSales { get; set; }
        public int TransactionCount { get; set; }
        public decimal AverageTransaction { get; set; }
    }
}
