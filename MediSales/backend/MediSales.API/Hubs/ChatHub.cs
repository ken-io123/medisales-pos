using Microsoft.AspNetCore.SignalR;
using MediSales.API.Data;
using MediSales.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace MediSales.API.Hubs
{
    /// <summary>SignalR hub for real-time chat functionality.</summary>
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChatHub> _logger;
        
        // Track conversation rooms for typing indicators
        private static readonly ConcurrentDictionary<string, string> UserConnections = new();

        public ChatHub(ApplicationDbContext context, ILogger<ChatHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SendMessage(int fromUserId, int toUserId, string message)
        {
            try
            {
                _logger.LogInformation($"[CHAT DEBUG] SendMessage called: From={fromUserId}, To={toUserId}, Message='{message.Substring(0, Math.Min(message.Length, 50))}'");
                _logger.LogInformation($"[CHAT DEBUG] Current Context.ConnectionId={Context.ConnectionId}");
                _logger.LogInformation($"[CHAT DEBUG] Current Context.UserIdentifier={Context.UserIdentifier}");

                // Save message to database
                var messageEntity = new Message
                {
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    MessageText = message,
                    CreatedAt = DateTime.UtcNow,
                    MessageStatus = Models.Enums.MessageStatus.Unread,
                    IsReplied = false,
                    IsArchived = false
                };

                _context.Messages.Add(messageEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[CHAT DEBUG] Message saved to DB with ID={messageEntity.MessageId}");

                // Send to recipient via SignalR
                _logger.LogInformation($"[CHAT DEBUG] Attempting to send to recipient User {toUserId}");
                await Clients.User(toUserId.ToString()).SendAsync("ReceiveMessage", fromUserId, message, messageEntity.MessageId, messageEntity.CreatedAt);
                
                // Also send to sender for confirmation (echo back)
                _logger.LogInformation($"[CHAT DEBUG] Attempting to echo back to sender User {fromUserId}");
                await Clients.User(fromUserId.ToString()).SendAsync("ReceiveMessage", fromUserId, message, messageEntity.MessageId, messageEntity.CreatedAt);
                
                _logger.LogInformation($"[CHAT DEBUG] ✅ Message sent successfully from User {fromUserId} to User {toUserId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[CHAT DEBUG] ❌ Error sending message from User {fromUserId} to User {toUserId}");
                throw;
            }
        }

        public async Task JoinConversation(int userId1, int userId2)
        {
            try
            {
                // Create a unique room name for the conversation (sorted IDs to ensure consistency)
                var roomName = $"conversation_{Math.Min(userId1, userId2)}_{Math.Max(userId1, userId2)}";
                
                await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
                UserConnections[Context.ConnectionId] = roomName;
                
                _logger.LogInformation($"User joined conversation room: {roomName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining conversation");
                throw;
            }
        }

        public async Task LeaveConversation()
        {
            try
            {
                if (UserConnections.TryGetValue(Context.ConnectionId, out var roomName))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
                    UserConnections.TryRemove(Context.ConnectionId, out _);
                    
                    _logger.LogInformation($"User left conversation room: {roomName}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving conversation");
                throw;
            }
        }

        public async Task SendTypingIndicator(int userId, int otherUserId, bool isTyping)
        {
            try
            {
                var roomName = $"conversation_{Math.Min(userId, otherUserId)}_{Math.Max(userId, otherUserId)}";
                
                // Notify other user in the conversation
                await Clients.OthersInGroup(roomName).SendAsync("UserTyping", userId, isTyping);
                
                _logger.LogInformation($"User {userId} typing indicator: {isTyping} in room {roomName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending typing indicator");
                throw;
            }
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                _logger.LogInformation($"[CHAT DEBUG] 🔌 OnConnectedAsync called - ConnectionId={Context.ConnectionId}");
                _logger.LogInformation($"[CHAT DEBUG] Context.UserIdentifier={Context.UserIdentifier}");
                _logger.LogInformation($"[CHAT DEBUG] Context.User.Identity.IsAuthenticated={Context.User?.Identity?.IsAuthenticated}");
                _logger.LogInformation($"[CHAT DEBUG] Context.User.Identity.Name={Context.User?.Identity?.Name}");
                
                var userId = Context.UserIdentifier;
                
                if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out int userIdInt))
                {
                    _logger.LogInformation($"[CHAT DEBUG] ✅ User ID parsed successfully: {userIdInt}");
                    
                    // Update user status to Online
                    var user = await _context.Users.FindAsync(userIdInt);
                    if (user != null)
                    {
                        user.Status = Models.Enums.UserStatus.Online;
                        user.LastSeenAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();

                        // Add user to role-based group
                        if (user.Role == Models.Enums.UserRole.Administrator)
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                            _logger.LogInformation($"[CHAT DEBUG] Added User {userIdInt} to Admins group");
                        }
                        else if (user.Role == Models.Enums.UserRole.Staff)
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, "Staff");
                            _logger.LogInformation($"[CHAT DEBUG] Added User {userIdInt} to Staff group");
                        }

                        _logger.LogInformation($"[CHAT DEBUG] ✅ User {userIdInt} ({user.FullName}) connected to ChatHub successfully");
                    }
                    else
                    {
                        _logger.LogWarning($"[CHAT DEBUG] ⚠️ User {userIdInt} not found in database");
                    }
                }
                else
                {
                    _logger.LogWarning($"[CHAT DEBUG] ⚠️ Context.UserIdentifier is null or invalid: '{userId}'");
                }

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[CHAT DEBUG] ❌ Error in OnConnectedAsync");
                throw;
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var userId = Context.UserIdentifier;
                
                if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out int userIdInt))
                {
                    // Update user status to Offline
                    var user = await _context.Users.FindAsync(userIdInt);
                    if (user != null)
                    {
                        user.Status = Models.Enums.UserStatus.Offline;
                        user.LastSeenAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();

                        _logger.LogInformation($"User {userIdInt} ({user.FullName}) disconnected from ChatHub");
                    }
                }

                // Clean up conversation room tracking
                UserConnections.TryRemove(Context.ConnectionId, out _);

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OnDisconnectedAsync");
            }
        }

        public async Task MarkMessageAsRead(int messageId, int readBy)
        {
            try
            {
                var message = await _context.Messages.FindAsync(messageId);
                if (message != null)
                {
                    message.MessageStatus = Models.Enums.MessageStatus.Read;
                    await _context.SaveChangesAsync();

                    // Notify the sender that their message was read
                    await Clients.User(message.FromUserId.ToString()).SendAsync("MessageRead", messageId, readBy);
                    
                    _logger.LogInformation($"Message {messageId} marked as read by User {readBy}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking message {messageId} as read");
                throw;
            }
        }
    }
}
