namespace MediSales.API.DTOs.Reports
{
    /// <summary>
    /// DTO for sales chart data.
    /// </summary>
    public class SalesChartDto
    {
        public List<SalesDataPoint> Data { get; set; } = new();
        public decimal TotalSales { get; set; }
        public decimal AverageDailySales { get; set; }
    }

    public class SalesDataPoint
    {
        public string Date { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Sales { get; set; }
        public int Transactions { get; set; }
    }
}
