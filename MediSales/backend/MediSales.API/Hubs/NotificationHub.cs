using Microsoft.AspNetCore.SignalR;
using MediSales.API.Data;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Hubs
{
    /// <summary>SignalR hub for broadcasting real-time notifications.</summary>
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;
        private readonly ApplicationDbContext _context;

        public NotificationHub(ILogger<NotificationHub> logger, ApplicationDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        public async Task SendNotification(string message, string type)
        {
            try
            {
                await Clients.All.SendAsync("ReceiveNotification", message, type);
                _logger.LogInformation("Notification broadcast: {Type} - {Message}", type, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification");
                throw;
            }
        }

        public async Task BroadcastSalesUpdate(decimal amount, string transactionCode)
        {
            try
            {
                await Clients.Group("Admins").SendAsync("SalesUpdated", amount, transactionCode, DateTime.UtcNow);
                _logger.LogInformation("Sales update broadcast: {TransactionCode} - ₱{Amount}", transactionCode, amount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting sales update");
                throw;
            }
        }

        public async Task BroadcastStockUpdate(int productId, string productName, int newStock)
        {
            try
            {
                await Clients.All.SendAsync("StockUpdated", productId, productName, newStock);
                _logger.LogInformation("Stock update broadcast: {ProductName} - {NewStock} units", productName, newStock);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting stock update");
                throw;
            }
        }

        public async Task SendLowStockAlert(int productId, string productName, int currentStock, int threshold)
        {
            try
            {
                await Clients.Group("Admins").SendAsync("LowStockAlert", productId, productName, currentStock, threshold);
                _logger.LogWarning("Low stock alert: {ProductName} - {CurrentStock} units (threshold: {Threshold})", productName, currentStock, threshold);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending low stock alert");
                throw;
            }
        }

        public async Task SendStockAlert(string productName, int currentStock, string alertType)
        {
            try
            {
                await Clients.Group("Admins").SendAsync("ReceiveStockAlert", new
                {
                    ProductName = productName,
                    CurrentStock = currentStock,
                    AlertType = alertType,
                    Timestamp = DateTime.UtcNow
                });
                _logger.LogWarning("Stock alert: {ProductName} - {CurrentStock} units ({AlertType})", productName, currentStock, alertType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending stock alert");
                throw;
            }
        }

        public async Task SendTransactionComplete(string transactionId, decimal amount)
        {
            try
            {
                await Clients.All.SendAsync("TransactionCompleted", transactionId, amount);
                _logger.LogInformation("Transaction completed notification: {TransactionId} - ₱{Amount}", transactionId, amount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending transaction complete notification");
                throw;
            }
        }

        public async Task SendNewMessage(int toUserId, int fromUserId, string fromUserName, string preview)
        {
            try
            {
                await Clients.User(toUserId.ToString()).SendAsync("NewMessageReceived", new
                {
                    FromUserId = fromUserId,
                    FromUserName = fromUserName,
                    MessagePreview = preview,
                    Timestamp = DateTime.UtcNow
                });
                _logger.LogInformation("New message notification sent to user {UserId} from {FromUser}", toUserId, fromUserName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending new message notification");
                throw;
            }
        }

        public async Task BroadcastDashboardUpdate(object data)
        {
            try
            {
                await Clients.Group("Admins").SendAsync("DashboardUpdated", data);
                _logger.LogInformation("Dashboard update broadcast to Admins");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting dashboard update");
                throw;
            }
        }

        public async Task SendExpirationAlert(int productId, string productName, DateTime expiryDate, int daysUntilExpiry)
        {
            try
            {
                await Clients.Group("Admins").SendAsync("ExpirationAlert", productId, productName, expiryDate, daysUntilExpiry);
                _logger.LogWarning("Expiration alert: {ProductName} - {Days} days until expiry", productName, daysUntilExpiry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending expiration alert");
                throw;
            }
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                var userId = Context.UserIdentifier;
                _logger.LogInformation("Client connected to NotificationHub: {ConnectionId} (User: {UserId})", Context.ConnectionId, userId);

                if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out int userIdInt))
                {
                    var user = await _context.Users.FindAsync(userIdInt);
                    if (user != null)
                    {
                        if (user.Role == Models.Enums.UserRole.Administrator)
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                            _logger.LogInformation("Added User {UserId} to Admins notification group", userIdInt);
                        }
                        else if (user.Role == Models.Enums.UserRole.Staff)
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, "Staff");
                            _logger.LogInformation("Added User {UserId} to Staff notification group", userIdInt);
                        }
                    }
                }

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in NotificationHub OnConnectedAsync");
                throw;
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                _logger.LogInformation("Client disconnected from NotificationHub: {ConnectionId}", Context.ConnectionId);

                if (exception != null)
                {
                    _logger.LogError(exception, "Client disconnected with error");
                }

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in NotificationHub OnDisconnectedAsync");
            }
        }

        public async Task JoinGroup(string groupName)
        {
            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation("Connection {ConnectionId} joined group {GroupName}", Context.ConnectionId, groupName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining group {GroupName}", groupName);
                throw;
            }
        }

        public async Task LeaveGroup(string groupName)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation("Connection {ConnectionId} left group {GroupName}", Context.ConnectionId, groupName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving group {GroupName}", groupName);
                throw;
            }
        }
    }
}
