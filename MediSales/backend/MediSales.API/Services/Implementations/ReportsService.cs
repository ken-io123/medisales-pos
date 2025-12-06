using MediSales.API.DTOs.Reports;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Service implementation for generating reports and analytics.
    /// </summary>
    public class ReportsService : IReportsService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IProductRepository _productRepository;
        private const int LOW_STOCK_THRESHOLD = 20;
        private const int EXPIRING_DAYS_THRESHOLD = 30;

        public ReportsService(
            ITransactionRepository transactionRepository,
            IProductRepository productRepository)
        {
            _transactionRepository = transactionRepository;
            _productRepository = productRepository;
        }

        public async Task<SalesReportDto> GetDailySalesReportAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            return new SalesReportDto
            {
                Period = "Daily",
                StartDate = startDate,
                EndDate = startDate,
                TotalSales = transactionList.Sum(t => t.TotalAmount),
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? transactionList.Average(t => t.TotalAmount) 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount),
                TotalSubtotal = transactionList.Sum(t => t.SubtotalAmount),
                TotalItemsSold = transactionList.SelectMany(t => t.TransactionItems).Sum(i => i.Quantity)
            };
        }

        public async Task<SalesReportDto> GetStaffDailySalesReportAsync(int userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided && t.UserId == userId).ToList();

            return new SalesReportDto
            {
                Period = "Daily",
                StartDate = startDate,
                EndDate = startDate,
                TotalSales = transactionList.Sum(t => t.TotalAmount),
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? transactionList.Average(t => t.TotalAmount) 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount),
                TotalSubtotal = transactionList.Sum(t => t.SubtotalAmount),
                TotalItemsSold = transactionList.SelectMany(t => t.TransactionItems).Sum(i => i.Quantity)
            };
        }

        public async Task<SalesReportDto> GetWeeklySalesReportAsync(DateTime weekStart)
        {
            var startDate = weekStart.Date;
            var endDate = startDate.AddDays(7);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            return new SalesReportDto
            {
                Period = "Weekly",
                StartDate = startDate,
                EndDate = endDate.AddDays(-1),
                TotalSales = transactionList.Sum(t => t.TotalAmount),
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? transactionList.Average(t => t.TotalAmount) 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount),
                TotalSubtotal = transactionList.Sum(t => t.SubtotalAmount),
                TotalItemsSold = transactionList.SelectMany(t => t.TransactionItems).Sum(i => i.Quantity)
            };
        }

        public async Task<SalesReportDto> GetMonthlySalesReportAsync(int month, int year)
        {
            if (month < 1 || month > 12)
            {
                throw new ArgumentException("Month must be between 1 and 12", nameof(month));
            }

            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            return new SalesReportDto
            {
                Period = "Monthly",
                StartDate = startDate,
                EndDate = endDate.AddDays(-1),
                TotalSales = transactionList.Sum(t => t.TotalAmount),
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? transactionList.Average(t => t.TotalAmount) 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount),
                TotalSubtotal = transactionList.Sum(t => t.SubtotalAmount),
                TotalItemsSold = transactionList.SelectMany(t => t.TransactionItems).Sum(i => i.Quantity)
            };
        }

        public async Task<SalesReportDto> GetYearlySalesReportAsync(int year)
        {
            var startDate = new DateTime(year, 1, 1);
            var endDate = startDate.AddYears(1);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            return new SalesReportDto
            {
                Period = "Yearly",
                StartDate = startDate,
                EndDate = endDate.AddDays(-1),
                TotalSales = transactionList.Sum(t => t.TotalAmount),
                TransactionCount = transactionList.Count,
                AverageTransactionAmount = transactionList.Any() 
                    ? transactionList.Average(t => t.TotalAmount) 
                    : 0,
                TotalDiscounts = transactionList.Sum(t => t.DiscountAmount),
                TotalSubtotal = transactionList.Sum(t => t.SubtotalAmount),
                TotalItemsSold = transactionList.SelectMany(t => t.TransactionItems).Sum(i => i.Quantity)
            };
        }

        public async Task<IEnumerable<ProductSalesDto>> GetTopSellingProductsAsync(int count)
        {
            var transactions = await _transactionRepository.GetAllTransactionsAsync();
            var activeTransactions = transactions.Where(t => !t.IsVoided);
            var products = await _productRepository.GetAllProductsAsync();

            var productSales = activeTransactions
                .SelectMany(t => t.TransactionItems)
                .GroupBy(ti => ti.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    TotalQuantity = g.Sum(ti => ti.Quantity),
                    TotalRevenue = g.Sum(ti => ti.Subtotal),
                    TransactionCount = g.Select(ti => ti.TransactionId).Distinct().Count()
                })
                .OrderByDescending(x => x.TotalQuantity)
                .Take(count)
                .ToList();

            var result = new List<ProductSalesDto>();

            foreach (var sale in productSales)
            {
                var product = products.FirstOrDefault(p => p.ProductId == sale.ProductId);
                if (product != null)
                {
                    result.Add(new ProductSalesDto
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        ProductCode = product.ProductCode,
                        Category = product.Category,
                        TotalQuantitySold = sale.TotalQuantity,
                        TotalRevenue = sale.TotalRevenue,
                        TransactionCount = sale.TransactionCount,
                        CurrentStock = product.StockQuantity
                    });
                }
            }

            return result;
        }

        public async Task<IEnumerable<CategorySalesDto>> GetSalesByCategoryAsync()
        {
            var transactions = await _transactionRepository.GetAllTransactionsAsync();
            var activeTransactions = transactions.Where(t => !t.IsVoided);
            var products = await _productRepository.GetAllProductsAsync();

            var categorySales = activeTransactions
                .SelectMany(t => t.TransactionItems)
                .Join(products,
                    ti => ti.ProductId,
                    p => p.ProductId,
                    (ti, p) => new { TransactionItem = ti, Product = p })
                .GroupBy(x => x.Product.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    TotalSales = g.Sum(x => x.TransactionItem.Subtotal),
                    TotalQuantity = g.Sum(x => x.TransactionItem.Quantity),
                    TransactionCount = g.Select(x => x.TransactionItem.TransactionId).Distinct().Count()
                })
                .ToList();

            var totalSales = categorySales.Sum(c => c.TotalSales);

            return categorySales.Select(c => new CategorySalesDto
            {
                Category = c.Category,
                TotalSales = c.TotalSales,
                TotalQuantitySold = c.TotalQuantity,
                TransactionCount = c.TransactionCount,
                Percentage = totalSales > 0 ? (c.TotalSales / totalSales) * 100 : 0
            }).OrderByDescending(c => c.TotalSales);
        }

        public async Task<IEnumerable<PaymentMethodDto>> GetSalesByPaymentMethodAsync()
        {
            var transactions = await _transactionRepository.GetAllTransactionsAsync();
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            var paymentMethodSales = transactionList
                .GroupBy(t => t.PaymentMethod)
                .Select(g => new
                {
                    PaymentMethod = g.Key,
                    TotalAmount = g.Sum(t => t.TotalAmount),
                    TransactionCount = g.Count()
                })
                .ToList();

            var totalAmount = paymentMethodSales.Sum(p => p.TotalAmount);

            return paymentMethodSales.Select(p => new PaymentMethodDto
            {
                PaymentMethod = p.PaymentMethod,
                PaymentMethodName = p.PaymentMethod.ToString(),
                TotalAmount = p.TotalAmount,
                TransactionCount = p.TransactionCount,
                Percentage = totalAmount > 0 ? (p.TotalAmount / totalAmount) * 100 : 0
            }).OrderByDescending(p => p.TotalAmount);
        }

        public async Task<IEnumerable<StaffPerformanceDto>> GetStaffPerformanceAsync()
        {
            var transactions = await _transactionRepository.GetAllTransactionsAsync();

            var staffPerformance = transactions
                .GroupBy(t => new { t.UserId, t.User.Username, t.User.FullName })
                .Select(g => new StaffPerformanceDto
                {
                    UserId = g.Key.UserId,
                    Username = g.Key.Username ?? string.Empty,
                    FullName = g.Key.FullName ?? string.Empty,
                    TotalSales = g.Sum(t => t.TotalAmount),
                    TransactionCount = g.Count(),
                    AverageTransactionAmount = g.Average(t => t.TotalAmount),
                    TotalItemsSold = g.SelectMany(t => t.TransactionItems).Sum(i => i.Quantity),
                    TotalDiscounts = g.Sum(t => t.DiscountAmount)
                })
                .OrderByDescending(s => s.TotalSales)
                .ToList();

            return staffPerformance;
        }

        public async Task<InventoryReportDto> GetInventoryReportAsync()
        {
            var products = await _productRepository.GetAllProductsAsync();
            var productList = products.ToList();
            var today = DateTime.UtcNow.Date;

            var productInventories = productList.Select(p =>
            {
                var daysUntilExpiry = (p.ExpiryDate.Date - today).Days;
                string stockStatus;

                if (p.StockQuantity == 0)
                    stockStatus = "Out of Stock";
                else if (p.StockQuantity < LOW_STOCK_THRESHOLD)
                    stockStatus = "Low Stock";
                else
                    stockStatus = "Normal";

                return new ProductInventoryDto
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    ProductCode = p.ProductCode,
                    Category = p.Category,
                    StockQuantity = p.StockQuantity,
                    UnitPrice = p.UnitPrice,
                    TotalValue = p.StockQuantity * p.UnitPrice,
                    ExpiryDate = p.ExpiryDate,
                    DaysUntilExpiry = daysUntilExpiry,
                    StockStatus = stockStatus
                };
            }).ToList();

            return new InventoryReportDto
            {
                TotalProducts = productList.Count,
                TotalInventoryValue = productInventories.Sum(p => p.TotalValue),
                TotalStockUnits = productList.Sum(p => p.StockQuantity),
                LowStockProducts = productList.Count(p => p.StockQuantity > 0 && p.StockQuantity < LOW_STOCK_THRESHOLD),
                OutOfStockProducts = productList.Count(p => p.StockQuantity == 0),
                ExpiringProducts = productList.Count(p => (p.ExpiryDate.Date - today).Days <= EXPIRING_DAYS_THRESHOLD),
                Products = productInventories
            };
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var today = DateTime.UtcNow.Date;
            var weekAgo = today.AddDays(-7);
            var monthAgo = today.AddDays(-30);
            var previousMonthStart = monthAgo.AddDays(-30);

            // Get today's transactions
            var todayTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(today, today.AddDays(1));
            var todayList = todayTransactions.Where(t => !t.IsVoided).ToList();

            // Get week's transactions
            var weekTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(weekAgo, today.AddDays(1));
            var weekList = weekTransactions.Where(t => !t.IsVoided).ToList();

            // Get month's transactions
            var monthTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(monthAgo, today.AddDays(1));
            var monthList = monthTransactions.Where(t => !t.IsVoided).ToList();

            // Get previous month's transactions for growth calculation
            var previousMonthTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(previousMonthStart, monthAgo);
            var previousMonthList = previousMonthTransactions.Where(t => !t.IsVoided).ToList();

            // Get product stats
            var allProducts = await _productRepository.GetAllProductsAsync();
            var productList = allProducts.ToList();
            
            // Calculate expiring products (within 30 days)
            var expiringProducts = productList.Count(p => (p.ExpiryDate.Date - today).Days <= EXPIRING_DAYS_THRESHOLD && (p.ExpiryDate.Date - today).Days >= 0);

            // Calculate growth percentages
            var previousMonthRevenue = previousMonthList.Sum(t => t.TotalAmount);
            var currentMonthRevenue = monthList.Sum(t => t.TotalAmount);
            var revenueGrowth = previousMonthRevenue > 0 
                ? ((double)(currentMonthRevenue - previousMonthRevenue) / (double)previousMonthRevenue) * 100 
                : 0;

            var previousMonthTransactionCount = previousMonthList.Count;
            var currentMonthTransactionCount = monthList.Count;
            var transactionGrowth = previousMonthTransactionCount > 0 
                ? ((double)(currentMonthTransactionCount - previousMonthTransactionCount) / (double)previousMonthTransactionCount) * 100 
                : 0;

            return new DashboardStatsDto
            {
                TotalRevenue = monthList.Sum(t => t.TotalAmount),
                TotalTransactions = monthList.Count,
                TotalProducts = productList.Count,
                LowStockProducts = productList.Count(p => p.StockQuantity > 0 && p.StockQuantity < LOW_STOCK_THRESHOLD),
                ExpiringSoon = expiringProducts,
                TodaySales = todayList.Sum(t => t.TotalAmount),
                WeeklySales = weekList.Sum(t => t.TotalAmount),
                MonthlySales = monthList.Sum(t => t.TotalAmount),
                RevenueGrowthPercent = revenueGrowth,
                TransactionGrowthPercent = transactionGrowth
            };
        }

        public async Task<SalesChartDto> GetSalesChartDataAsync(int days)
        {
            var endDate = DateTime.UtcNow.Date.AddDays(1);
            var startDate = endDate.AddDays(-days);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            var dataPoints = new List<SalesDataPoint>();

            for (int i = 0; i < days; i++)
            {
                var date = startDate.AddDays(i);
                var nextDate = date.AddDays(1);

                var dayTransactions = transactionList.Where(t => t.TransactionDate >= date && t.TransactionDate < nextDate).ToList();

                dataPoints.Add(new SalesDataPoint
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Sales = dayTransactions.Sum(t => t.TotalAmount),
                    Transactions = dayTransactions.Count
                });
            }

            var totalSales = dataPoints.Sum(d => d.Sales);
            var averageSales = days > 0 ? totalSales / days : 0;

            return new SalesChartDto
            {
                Data = dataPoints,
                TotalSales = totalSales,
                AverageDailySales = averageSales
            };
        }

        public async Task<HistoricalSalesDto> GetSalesBySpecificDateAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var transactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
            var transactionList = transactions.Where(t => !t.IsVoided).ToList();

            var totalSales = transactionList.Sum(t => t.TotalAmount);
            var transactionCount = transactionList.Count;

            return new HistoricalSalesDto
            {
                Date = startDate,
                TotalSales = totalSales,
                TransactionCount = transactionCount,
                AverageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0
            };
        }

        public async Task<SalesComparisonDto> CompareSalesBetweenDatesAsync(DateTime date1, DateTime date2)
        {
            // Get sales for both dates
            var sales1 = await GetSalesBySpecificDateAsync(date1);
            var sales2 = await GetSalesBySpecificDateAsync(date2);

            // Calculate percentage change: ((newValue - oldValue) / oldValue) * 100
            decimal percentageChange = 0;
            decimal amountDifference = sales2.TotalSales - sales1.TotalSales;
            bool isIncrease = amountDifference >= 0;
            string trendDescription;

            if (sales1.TotalSales > 0)
            {
                percentageChange = Math.Round((amountDifference / sales1.TotalSales) * 100, 2);
            }
            else if (sales2.TotalSales > 0)
            {
                // If first date has zero sales but second date has sales, it's infinite increase
                percentageChange = 100;
                isIncrease = true;
            }

            // Determine trend description
            if (percentageChange == 0)
            {
                trendDescription = "No change in sales";
            }
            else if (isIncrease)
            {
                if (percentageChange > 50)
                    trendDescription = $"Significant increase of {percentageChange}%";
                else if (percentageChange > 20)
                    trendDescription = $"Notable increase of {percentageChange}%";
                else
                    trendDescription = $"Slight increase of {percentageChange}%";
            }
            else
            {
                var absPercentage = Math.Abs(percentageChange);
                if (absPercentage > 50)
                    trendDescription = $"Significant decrease of {absPercentage}%";
                else if (absPercentage > 20)
                    trendDescription = $"Notable decrease of {absPercentage}%";
                else
                    trendDescription = $"Slight decrease of {absPercentage}%";
            }

            return new SalesComparisonDto
            {
                Date1 = sales1.Date,
                Sales1 = sales1.TotalSales,
                Date2 = sales2.Date,
                Sales2 = sales2.TotalSales,
                PercentageChange = percentageChange,
                AmountDifference = amountDifference,
                IsIncrease = isIncrease,
                TrendDescription = trendDescription
            };
        }

        public async Task<SalesChartDto> GetSalesTrendAsync(string period)
        {
            var dataPoints = new List<SalesDataPoint>();
            var today = DateTime.UtcNow.Date;
            DateTime startDate, endDate;

            switch (period.ToLower())
            {
                case "daily":
                    // Last 30 days
                    endDate = today.AddDays(1);
                    startDate = today.AddDays(-29);
                    var dailyTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
                    var dailyList = dailyTransactions.Where(t => !t.IsVoided).ToList();

                    for (int i = 0; i < 30; i++)
                    {
                        var date = startDate.AddDays(i);
                        var nextDate = date.AddDays(1);
                        var dayTx = dailyList.Where(t => t.TransactionDate >= date && t.TransactionDate < nextDate).ToList();

                        dataPoints.Add(new SalesDataPoint
                        {
                            Date = date.ToString("yyyy-MM-dd"),
                            Label = date.ToString("MMM dd"),
                            StartDate = date,
                            EndDate = nextDate,
                            Sales = dayTx.Sum(t => t.TotalAmount),
                            Transactions = dayTx.Count
                        });
                    }
                    break;

                case "weekly":
                    // Last 12 weeks
                    // Align to start of week (Monday)
                    var currentWeekStart = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                    if (today.DayOfWeek == DayOfWeek.Sunday) currentWeekStart = currentWeekStart.AddDays(-7);
                    
                    endDate = currentWeekStart.AddDays(7); // End of current week
                    startDate = endDate.AddDays(-12 * 7); // 12 weeks back

                    var weeklyTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
                    var weeklyList = weeklyTransactions.Where(t => !t.IsVoided).ToList();

                    for (int i = 0; i < 12; i++)
                    {
                        var weekStart = startDate.AddDays(i * 7);
                        var weekEnd = weekStart.AddDays(7);
                        var weekTx = weeklyList.Where(t => t.TransactionDate >= weekStart && t.TransactionDate < weekEnd).ToList();

                        dataPoints.Add(new SalesDataPoint
                        {
                            Date = weekStart.ToString("yyyy-MM-dd"),
                            Label = $"Week {i + 1} ({weekStart:MMM dd})",
                            StartDate = weekStart,
                            EndDate = weekEnd,
                            Sales = weekTx.Sum(t => t.TotalAmount),
                            Transactions = weekTx.Count
                        });
                    }
                    break;

                case "monthly":
                    // Current Year (Jan - Dec)
                    startDate = new DateTime(today.Year, 1, 1);
                    endDate = startDate.AddYears(1);

                    var monthlyTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
                    var monthlyList = monthlyTransactions.Where(t => !t.IsVoided).ToList();

                    for (int i = 0; i < 12; i++)
                    {
                        var monthStart = startDate.AddMonths(i);
                        var monthEnd = monthStart.AddMonths(1);
                        
                        // Don't show future months if we want to be strict, but usually reports show full year with 0s
                        var monthTx = monthlyList.Where(t => t.TransactionDate >= monthStart && t.TransactionDate < monthEnd).ToList();

                        dataPoints.Add(new SalesDataPoint
                        {
                            Date = monthStart.ToString("yyyy-MM-dd"),
                            Label = monthStart.ToString("MMM yyyy"),
                            StartDate = monthStart,
                            EndDate = monthEnd,
                            Sales = monthTx.Sum(t => t.TotalAmount),
                            Transactions = monthTx.Count
                        });
                    }
                    break;

                case "yearly":
                    // Last 5 years
                    var currentYear = today.Year;
                    startDate = new DateTime(currentYear - 4, 1, 1);
                    endDate = new DateTime(currentYear + 1, 1, 1);

                    var yearlyTransactions = await _transactionRepository.GetTransactionsByDateRangeAsync(startDate, endDate);
                    var yearlyList = yearlyTransactions.Where(t => !t.IsVoided).ToList();

                    for (int i = 0; i < 5; i++)
                    {
                        var yearStart = startDate.AddYears(i);
                        var yearEnd = yearStart.AddYears(1);
                        var yearTx = yearlyList.Where(t => t.TransactionDate >= yearStart && t.TransactionDate < yearEnd).ToList();

                        dataPoints.Add(new SalesDataPoint
                        {
                            Date = yearStart.ToString("yyyy-MM-dd"),
                            Label = yearStart.ToString("yyyy"),
                            StartDate = yearStart,
                            EndDate = yearEnd,
                            Sales = yearTx.Sum(t => t.TotalAmount),
                            Transactions = yearTx.Count
                        });
                    }
                    break;
                
                default:
                    throw new ArgumentException("Invalid period. Use daily, weekly, monthly, or yearly.");
            }

            var totalSales = dataPoints.Sum(d => d.Sales);
            var avgSales = dataPoints.Count > 0 ? totalSales / dataPoints.Count : 0;

            return new SalesChartDto
            {
                Data = dataPoints,
                TotalSales = totalSales,
                AverageDailySales = avgSales // Renaming this property in DTO might be better, but keeping for compatibility
            };
        }
    }
}
