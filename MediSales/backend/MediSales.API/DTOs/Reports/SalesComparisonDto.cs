namespace MediSales.API.DTOs.Reports
{
    public class SalesComparisonDto
    {
        public DateTime Date1 { get; set; }
        public decimal Sales1 { get; set; }
        public DateTime Date2 { get; set; }
        public decimal Sales2 { get; set; }
        public decimal PercentageChange { get; set; }
        public decimal AmountDifference { get; set; }
        public bool IsIncrease { get; set; }
        public string TrendDescription { get; set; } = string.Empty;
    }
}
