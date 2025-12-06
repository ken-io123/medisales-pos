using MediSales.API.DTOs.Alerts;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.Services.Interfaces;
using MediSales.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Service implementation for managing stock alerts.
    /// </summary>
    public class StockAlertService : IStockAlertService
    {
        private readonly IStockAlertRepository _stockAlertRepository;
        private readonly IProductRepository _productRepository;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly ILogger<StockAlertService> _logger;
        private const int LOW_STOCK_THRESHOLD = 20;
        private const int EXPIRING_DAYS_THRESHOLD = 30;

        public StockAlertService(
            IStockAlertRepository stockAlertRepository,
            IProductRepository productRepository,
            IHubContext<NotificationHub> notificationHub,
            ILogger<StockAlertService> logger)
        {
            _stockAlertRepository = stockAlertRepository;
            _productRepository = productRepository;
            _notificationHub = notificationHub;
            _logger = logger;
        }

        public async Task<IEnumerable<StockAlertDto>> CheckLowStockAsync()
        {
            var alerts = new List<StockAlertDto>();
            var products = await _productRepository.GetAllProductsAsync();

            foreach (var product in products)
            {
                // Skip archived products
                if (product.IsArchived)
                    continue;
                    
                AlertType? alertType = null;
                string alertMessage = string.Empty;

                if (product.StockQuantity == 0)
                {
                    alertType = AlertType.OutOfStock;
                    alertMessage = $"Product '{product.ProductName}' is out of stock.";
                }
                else if (product.StockQuantity < LOW_STOCK_THRESHOLD)
                {
                    alertType = AlertType.LowStock;
                    alertMessage = $"Product '{product.ProductName}' has low stock: {product.StockQuantity} units remaining.";
                }

                if (alertType.HasValue)
                {
                    // Check if alert already exists
                    bool alertExists = await _stockAlertRepository.AlertExistsAsync(product.ProductId, alertType.Value);

                    if (!alertExists)
                    {
                        var alert = new StockAlert
                        {
                            ProductId = product.ProductId,
                            AlertType = alertType.Value,
                            AlertMessage = alertMessage,
                            CurrentStockLevel = product.StockQuantity,
                            ThresholdLevel = alertType.Value == AlertType.OutOfStock ? 0 : LOW_STOCK_THRESHOLD,
                            AlertDate = DateTime.UtcNow
                        };

                        var createdAlert = await _stockAlertRepository.CreateAlertAsync(alert);
                        var alertDto = MapToDto(createdAlert);
                        alerts.Add(alertDto);
                        
                        // Send real-time notification to all connected clients
                        try
                        {
                            await _notificationHub.Clients.All.SendAsync("LowStockAlert", 
                                product.ProductId, 
                                product.ProductName, 
                                product.StockQuantity, 
                                LOW_STOCK_THRESHOLD);
                            
                            // Also send a general notification
                            var notificationType = alertType.Value == AlertType.OutOfStock ? "critical" : "warning";
                            await _notificationHub.Clients.All.SendAsync("ReceiveNotification", 
                                alertMessage, 
                                notificationType);
                            
                            _logger.LogInformation("Sent low stock alert for product {ProductName} ({ProductId})", 
                                product.ProductName, product.ProductId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to send SignalR notification for low stock alert");
                        }
                    }
                }
            }

            return alerts;
        }

        public async Task<IEnumerable<StockAlertDto>> CheckExpiringAsync()
        {
            var alerts = new List<StockAlertDto>();
            var products = await _productRepository.GetAllProductsAsync();
            var today = DateTime.UtcNow.Date;

            foreach (var product in products)
            {
                // Skip archived products
                if (product.IsArchived)
                    continue;
                    
                var daysUntilExpiry = (product.ExpiryDate.Date - today).Days;
                AlertType? alertType = null;
                string alertMessage = string.Empty;

                if (daysUntilExpiry < 0)
                {
                    alertType = AlertType.Expired;
                    alertMessage = $"Product '{product.ProductName}' has expired ({Math.Abs(daysUntilExpiry)} days ago).";
                }
                else if (daysUntilExpiry <= 7)
                {
                    alertType = AlertType.ExpiringIn7Days;
                    alertMessage = $"Product '{product.ProductName}' is expiring in {daysUntilExpiry} days (Critical).";
                }
                else if (daysUntilExpiry <= 30)
                {
                    alertType = AlertType.ExpiringIn30Days;
                    alertMessage = $"Product '{product.ProductName}' is expiring in {daysUntilExpiry} days.";
                }
                else if (daysUntilExpiry <= 60)
                {
                    alertType = AlertType.ExpiringIn60Days;
                    alertMessage = $"Product '{product.ProductName}' is expiring in {daysUntilExpiry} days.";
                }

                if (alertType.HasValue)
                {
                    // Check if alert already exists
                    bool alertExists = await _stockAlertRepository.AlertExistsAsync(product.ProductId, alertType.Value);

                    if (!alertExists)
                    {
                        var alert = new StockAlert
                        {
                            ProductId = product.ProductId,
                            AlertType = alertType.Value,
                            AlertMessage = alertMessage,
                            CurrentStockLevel = product.StockQuantity,
                            DaysUntilExpiry = daysUntilExpiry,
                            AlertDate = DateTime.UtcNow
                        };

                        var createdAlert = await _stockAlertRepository.CreateAlertAsync(alert);
                        var alertDto = MapToDto(createdAlert);
                        alerts.Add(alertDto);
                        
                        // Send real-time notification to all connected clients
                        try
                        {
                            await _notificationHub.Clients.All.SendAsync("ExpirationAlert", 
                                product.ProductId, 
                                product.ProductName, 
                                product.ExpiryDate, 
                                daysUntilExpiry);
                            
                            // Also send a general notification
                            var notificationType = alertType.Value == AlertType.Expired || alertType.Value == AlertType.ExpiringIn7Days 
                                ? "critical" 
                                : alertType.Value == AlertType.ExpiringIn30Days ? "warning" : "info";
                            await _notificationHub.Clients.All.SendAsync("ReceiveNotification", 
                                alertMessage, 
                                notificationType);
                            
                            _logger.LogInformation("Sent expiration alert for product {ProductName} ({ProductId}), days until expiry: {DaysUntilExpiry}", 
                                product.ProductName, product.ProductId, daysUntilExpiry);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to send SignalR notification for expiration alert");
                        }
                    }
                }
            }

            return alerts;
        }

        public async Task<IEnumerable<StockAlertDto>> GetActiveAlertsAsync()
        {
            var alerts = await _stockAlertRepository.GetActiveAlertsAsync();
            return alerts.Select(MapToDto);
        }

        public async Task<StockAlertDto> ResolveAlertAsync(int alertId, int resolvedBy)
        {
            var alert = await _stockAlertRepository.GetAlertByIdAsync(alertId);

            if (alert == null)
            {
                throw new InvalidOperationException($"Alert with ID {alertId} not found.");
            }

            if (alert.IsResolved)
            {
                throw new InvalidOperationException($"Alert with ID {alertId} is already resolved.");
            }

            alert.IsResolved = true;
            alert.ResolvedAt = DateTime.UtcNow;
            alert.ResolvedBy = resolvedBy;

            var updatedAlert = await _stockAlertRepository.UpdateAlertAsync(alert);
            var alertDto = MapToDto(updatedAlert);
            
            // Send real-time notification that alert was resolved
            try
            {
                await _notificationHub.Clients.All.SendAsync("AlertResolved", new
                {
                    AlertId = alert.StockAlertId,
                    ProductId = alert.ProductId,
                    ProductName = alert.Product?.ProductName ?? "Unknown",
                    AlertType = alert.AlertType.ToString(),
                    ResolvedBy = resolvedBy,
                    ResolvedAt = alert.ResolvedAt
                });
                
                await _notificationHub.Clients.All.SendAsync("ReceiveNotification", 
                    $"Alert for '{alert.Product?.ProductName ?? "product"}' has been resolved.", 
                    "success");
                    
                _logger.LogInformation("Alert {AlertId} resolved by user {UserId}", alertId, resolvedBy);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send SignalR notification for resolved alert");
            }
            
            return alertDto;
        }

        public async Task<IEnumerable<StockAlertDto>> RunAllChecksAsync()
        {
            // First auto-resolve alerts that are no longer valid
            await AutoResolveAlertsAsync();
            
            var lowStockAlerts = await CheckLowStockAsync();
            var expiringAlerts = await CheckExpiringAsync();

            return lowStockAlerts.Concat(expiringAlerts);
        }

        public async Task<IEnumerable<StockAlertDto>> GetAlertsByTypeAsync(params AlertType[] alertTypes)
        {
            var allAlerts = await _stockAlertRepository.GetActiveAlertsAsync();
            return allAlerts
                .Where(a => alertTypes.Contains(a.AlertType))
                .Select(MapToDto);
        }

        public async Task<IEnumerable<StockAlertDto>> GetExpirationAlertsAsync()
        {
            return await GetAlertsByTypeAsync(
                AlertType.ExpiringIn7Days, 
                AlertType.ExpiringIn30Days, 
                AlertType.ExpiringIn60Days, 
                AlertType.Expired);
        }

        public async Task<IEnumerable<StockAlertDto>> GetStockAlertsOnlyAsync()
        {
            return await GetAlertsByTypeAsync(AlertType.LowStock, AlertType.OutOfStock);
        }

        public async Task<int> AutoResolveAlertsAsync()
        {
            var resolvedCount = 0;
            var activeAlerts = await _stockAlertRepository.GetActiveAlertsAsync();
            var today = DateTime.UtcNow.Date;

            foreach (var alert in activeAlerts)
            {
                bool shouldAutoResolve = false;
                var product = alert.Product;
                
                if (product == null)
                    continue;

                // Auto-resolve stock alerts if stock is now above threshold
                if (alert.AlertType == AlertType.LowStock && product.StockQuantity >= LOW_STOCK_THRESHOLD)
                {
                    shouldAutoResolve = true;
                    _logger.LogInformation("Auto-resolving LowStock alert for {ProductName} - stock is now {Stock}", 
                        product.ProductName, product.StockQuantity);
                }
                else if (alert.AlertType == AlertType.OutOfStock && product.StockQuantity > 0)
                {
                    shouldAutoResolve = true;
                    _logger.LogInformation("Auto-resolving OutOfStock alert for {ProductName} - stock is now {Stock}", 
                        product.ProductName, product.StockQuantity);
                }
                // Auto-resolve if product is archived
                else if (product.IsArchived)
                {
                    shouldAutoResolve = true;
                    _logger.LogInformation("Auto-resolving alert for archived product {ProductName}", product.ProductName);
                }

                if (shouldAutoResolve)
                {
                    alert.IsResolved = true;
                    alert.ResolvedAt = DateTime.UtcNow;
                    alert.ResolvedBy = null; // System auto-resolved
                    await _stockAlertRepository.UpdateAlertAsync(alert);
                    resolvedCount++;
                    
                    // Send notification for auto-resolved alert
                    try
                    {
                        await _notificationHub.Clients.All.SendAsync("AlertAutoResolved", new
                        {
                            AlertId = alert.StockAlertId,
                            ProductId = alert.ProductId,
                            ProductName = product.ProductName,
                            AlertType = alert.AlertType.ToString(),
                            Reason = "Stock level restored"
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to send SignalR notification for auto-resolved alert");
                    }
                }
            }

            if (resolvedCount > 0)
            {
                _logger.LogInformation("Auto-resolved {Count} alerts", resolvedCount);
            }

            return resolvedCount;
        }

        private StockAlertDto MapToDto(StockAlert alert)
        {
            // Determine severity based on alert type
            string severity = alert.AlertType switch
            {
                AlertType.OutOfStock => "critical",
                AlertType.Expired => "critical",
                AlertType.ExpiringIn7Days => "critical",
                AlertType.ExpiringIn30Days => "warning",
                AlertType.LowStock => "warning",
                AlertType.ExpiringIn60Days => "info",
                _ => "info"
            };

            return new StockAlertDto
            {
                StockAlertId = alert.StockAlertId,
                ProductId = alert.ProductId,
                Product = alert.Product != null ? new DTOs.Products.ProductDto
                {
                    ProductId = alert.Product.ProductId,
                    ProductCode = alert.Product.ProductCode,
                    ProductName = alert.Product.ProductName,
                    Description = alert.Product.Description,
                    Category = alert.Product.Category,
                    UnitPrice = alert.Product.UnitPrice,
                    StockQuantity = alert.Product.StockQuantity,
                    SupplierName = alert.Product.SupplierName,
                    ExpiryDate = alert.Product.ExpiryDate,
                    ManufacturingDate = alert.Product.ManufacturingDate,
                    CreatedAt = alert.Product.CreatedAt,
                    UpdatedAt = alert.Product.UpdatedAt
                } : null,
                ProductName = alert.Product?.ProductName ?? string.Empty,
                ProductCode = alert.Product?.ProductCode,
                AlertType = alert.AlertType,
                AlertMessage = alert.AlertMessage,
                CurrentStockLevel = alert.CurrentStockLevel,
                ThresholdLevel = alert.ThresholdLevel,
                DaysUntilExpiry = alert.DaysUntilExpiry,
                ExpiryDate = alert.Product?.ExpiryDate,
                IsResolved = alert.IsResolved,
                ResolvedBy = alert.ResolvedBy,
                ResolvedByUsername = alert.ResolvedByUser?.Username,
                AlertDate = alert.AlertDate,
                ResolvedAt = alert.ResolvedAt,
                Severity = severity
            };
        }
    }
}
