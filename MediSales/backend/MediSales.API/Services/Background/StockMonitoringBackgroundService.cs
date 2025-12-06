using MediSales.API.Services.Interfaces;

namespace MediSales.API.Services.Background
{
    /// <summary>
    /// Background service that periodically checks for low stock and expiring products.
    /// </summary>
    public class StockMonitoringBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<StockMonitoringBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(6); // Run every 6 hours

        public StockMonitoringBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<StockMonitoringBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Stock Monitoring Background Service is starting");

            // Run initial check after 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Running scheduled stock and expiry checks at {Time}", DateTime.UtcNow);

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var stockAlertService = scope.ServiceProvider.GetRequiredService<IStockAlertService>();

                        // Run low stock check
                        var lowStockAlerts = await stockAlertService.CheckLowStockAsync();
                        _logger.LogInformation("Low stock check completed. {Count} alerts generated", lowStockAlerts.Count());

                        // Run expiring products check
                        var expiringAlerts = await stockAlertService.CheckExpiringAsync();
                        _logger.LogInformation("Expiring products check completed. {Count} alerts generated", expiringAlerts.Count());

                        var totalAlerts = lowStockAlerts.Count() + expiringAlerts.Count();
                        if (totalAlerts > 0)
                        {
                            _logger.LogWarning("Total {Count} new alerts generated during scheduled check", totalAlerts);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during scheduled stock monitoring check");
                }

                // Wait for the next interval
                _logger.LogInformation("Next stock check scheduled in {Hours} hours", _checkInterval.TotalHours);
                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Stock Monitoring Background Service is stopping");
        }
    }
}
