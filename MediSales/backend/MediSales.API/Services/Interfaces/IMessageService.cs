using MediSales.API.DTOs.Messages;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for managing messages between users.</summary>
    public interface IMessageService
    {
        Task<IEnumerable<MessageDto>> GetMessagesForUserAsync(int userId);
        Task<MessageDto> SendMessageAsync(int fromUserId, int toUserId, string messageText);
        Task<MessageDto> ReplyToMessageAsync(int messageId, string replyText);
        Task<MessageDto> MarkAsReadAsync(int messageId);
        Task<int> GetUnreadCountAsync(int userId);
        Task<IEnumerable<MessageDto>> GetConversationAsync(int userId1, int userId2);
        Task<MessageDto> MarkMessageAsReadAsync(int messageId, int userId);
        Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(int userId);
        Task<MessageDto?> UpdateMessageAsync(int messageId, string newMessageText);
        Task<bool> DeleteMessageAsync(int messageId);
    }
}
