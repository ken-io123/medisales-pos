using MediSales.API.DTOs.Messages;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.Services.Interfaces;
using MediSales.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediSales.API.Hubs;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Service implementation for managing messages between users.
    /// </summary>
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _chatHubContext;
        private readonly ILogger<MessageService> _logger;

        public MessageService(
            IMessageRepository messageRepository, 
            ApplicationDbContext context,
            IHubContext<ChatHub> chatHubContext,
            ILogger<MessageService> logger)
        {
            _messageRepository = messageRepository;
            _context = context;
            _chatHubContext = chatHubContext;
            _logger = logger;
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesForUserAsync(int userId)
        {
            var messages = await _messageRepository.GetMessagesForUserAsync(userId);
            return messages.Select(MapToDto);
        }

        public async Task<MessageDto> SendMessageAsync(int fromUserId, int toUserId, string messageText)
        {
            _logger.LogInformation($"[MESSAGE SERVICE] Sending message from User {fromUserId} to User {toUserId}");
            
            var message = new Message
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                MessageText = messageText,
                MessageStatus = MessageStatus.Unread,
                CreatedAt = DateTime.UtcNow
            };

            var createdMessage = await _messageRepository.CreateMessageAsync(message);
            
            _logger.LogInformation($"[MESSAGE SERVICE] Message saved to DB with ID={createdMessage.MessageId}");
            
            //  Trigger SignalR to send real-time message
            try
            {
                _logger.LogInformation($"[MESSAGE SERVICE] Broadcasting message via SignalR to recipient User {toUserId}");
                
                // Send to recipient
                await _chatHubContext.Clients.User(toUserId.ToString())
                    .SendAsync("ReceiveMessage", fromUserId, messageText, createdMessage.MessageId, createdMessage.CreatedAt);
                
                // Echo back to sender
                await _chatHubContext.Clients.User(fromUserId.ToString())
                    .SendAsync("ReceiveMessage", fromUserId, messageText, createdMessage.MessageId, createdMessage.CreatedAt);
                
                _logger.LogInformation($"[MESSAGE SERVICE] ✅ SignalR broadcast successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MESSAGE SERVICE] ❌ Failed to broadcast message via SignalR");
                // Don't throw - message is already saved to DB
            }
            
            return MapToDto(createdMessage);
        }

        public async Task<MessageDto> ReplyToMessageAsync(int messageId, string replyText)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            
            if (message == null)
            {
                throw new InvalidOperationException($"Message with ID {messageId} not found.");
            }

            message.ReplyText = replyText;
            message.IsReplied = true;
            message.RepliedAt = DateTime.UtcNow;

            var updatedMessage = await _messageRepository.UpdateMessageAsync(message);
            return MapToDto(updatedMessage);
        }

        public async Task<MessageDto> MarkAsReadAsync(int messageId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            
            if (message == null)
            {
                throw new InvalidOperationException($"Message with ID {messageId} not found.");
            }

            message.MessageStatus = MessageStatus.Read;

            var updatedMessage = await _messageRepository.UpdateMessageAsync(message);
            return MapToDto(updatedMessage);
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _messageRepository.GetUnreadCountAsync(userId);
        }

        public async Task<IEnumerable<MessageDto>> GetConversationAsync(int userId1, int userId2)
        {
            var messages = await _context.Messages
                .Include(m => m.FromUser)
                .Include(m => m.ToUser)
                .Where(m => (m.FromUserId == userId1 && m.ToUserId == userId2) || 
                           (m.FromUserId == userId2 && m.ToUserId == userId1))
                .Where(m => !m.IsArchived)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            // Mark messages as read for userId1 (the current user viewing the conversation)
            var unreadMessages = messages.Where(m => m.ToUserId == userId1 && !m.IsRead).ToList();
            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
                message.MessageStatus = MessageStatus.Read;
            }

            if (unreadMessages.Any())
            {
                await _context.SaveChangesAsync();
            }

            return messages.Select(MapToDto);
        }

        public async Task<MessageDto> MarkMessageAsReadAsync(int messageId, int userId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            
            if (message == null)
            {
                throw new InvalidOperationException($"Message with ID {messageId} not found.");
            }

            // Only mark as read if the user is the recipient
            if (message.ToUserId != userId)
            {
                throw new UnauthorizedAccessException("You can only mark messages sent to you as read.");
            }

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            message.MessageStatus = MessageStatus.Read;

            var updatedMessage = await _messageRepository.UpdateMessageAsync(message);
            return MapToDto(updatedMessage);
        }

        public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(int userId)
        {
            // Get all messages involving this user
            var messages = await _context.Messages
                .Include(m => m.FromUser)
                .Include(m => m.ToUser)
                .Where(m => (m.FromUserId == userId || m.ToUserId == userId) && !m.IsArchived)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            // Group by conversation partner
            var conversations = messages
                .GroupBy(m => m.FromUserId == userId ? m.ToUserId : m.FromUserId)
                .Select(g => new
                {
                    OtherUserId = g.Key,
                    LastMessage = g.First(),
                    UnreadCount = g.Count(m => m.ToUserId == userId && !m.IsRead)
                })
                .ToList();

            // Build conversation DTOs
            var conversationDtos = new List<ConversationDto>();
            foreach (var conv in conversations)
            {
                var otherUser = await _context.Users.FindAsync(conv.OtherUserId);
                if (otherUser != null)
                {
                    conversationDtos.Add(new ConversationDto
                    {
                        OtherUserId = conv.OtherUserId,
                        OtherUsername = otherUser.Username,
                        OtherUserFullName = otherUser.FullName,
                        OtherUserRole = otherUser.Role.ToString(),
                        OtherUserProfilePictureUrl = otherUser.ProfilePictureUrl,
                        IsOnline = otherUser.IsOnlineNow,
                        LastSeenAt = otherUser.LastSeenAt,
                        LastMessageText = conv.LastMessage.MessageText,
                        LastMessageTime = conv.LastMessage.CreatedAt,
                        IsLastMessageFromMe = conv.LastMessage.FromUserId == userId,
                        UnreadCount = conv.UnreadCount
                    });
                }
            }

            return conversationDtos.OrderByDescending(c => c.LastMessageTime);
        }

        public async Task<MessageDto?> UpdateMessageAsync(int messageId, string newMessageText)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            
            if (message == null)
            {
                return null;
            }

            message.MessageText = newMessageText;

            var updatedMessage = await _messageRepository.UpdateMessageAsync(message);
            return MapToDto(updatedMessage);
        }

        public async Task<bool> DeleteMessageAsync(int messageId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            
            if (message == null)
            {
                return false;
            }

            // Soft delete - mark as archived
            message.IsArchived = true;
            message.ArchivedAt = DateTime.UtcNow;

            await _messageRepository.UpdateMessageAsync(message);
            return true;
        }

        private MessageDto MapToDto(Message message)
        {
            return new MessageDto
            {
                MessageId = message.MessageId,
                FromUserId = message.FromUserId,
                FromUsername = message.FromUser?.Username ?? string.Empty,
                FromStaffName = message.FromUser?.FullName ?? string.Empty,
                ToUserId = message.ToUserId,
                ToUsername = message.ToUser?.Username ?? string.Empty,
                ToStaffName = message.ToUser?.FullName ?? string.Empty,
                SenderProfilePictureUrl = message.FromUser?.ProfilePictureUrl,
                MessageText = message.MessageText,
                ReplyText = message.ReplyText,
                IsRead = message.IsRead,
                SentDate = message.CreatedAt,
                ReadDate = message.ReadAt,
                ReplyDate = message.RepliedAt
            };
        }
    }
}
