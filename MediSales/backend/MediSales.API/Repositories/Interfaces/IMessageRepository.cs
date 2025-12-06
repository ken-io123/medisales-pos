using MediSales.API.Models.Entities;

namespace MediSales.API.Repositories.Interfaces
{
    /// <summary>Repository for message data access.</summary>
    public interface IMessageRepository
    {
        Task<IEnumerable<Message>> GetMessagesForUserAsync(int userId);
        Task<Message?> GetMessageByIdAsync(int messageId);
        Task<Message> CreateMessageAsync(Message message);
        Task<Message> UpdateMessageAsync(Message message);
        Task<int> GetUnreadCountAsync(int userId);
    }
}
