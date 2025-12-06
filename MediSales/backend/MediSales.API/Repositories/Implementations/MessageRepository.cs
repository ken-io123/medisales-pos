using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Repositories.Implementations
{
    /// <summary>Repository for message data access.</summary>
    public class MessageRepository : IMessageRepository
    {
        private readonly ApplicationDbContext _context;

        public MessageRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Message>> GetMessagesForUserAsync(int userId)
        {
            return await _context.Messages
                .Include(m => m.FromUser)
                .Include(m => m.ToUser)
                .Where(m => m.FromUserId == userId || m.ToUserId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<Message?> GetMessageByIdAsync(int messageId)
        {
            return await _context.Messages
                .Include(m => m.FromUser)
                .Include(m => m.ToUser)
                .FirstOrDefaultAsync(m => m.MessageId == messageId);
        }

        public async Task<Message> CreateMessageAsync(Message message)
        {
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            
            // Reload with navigation properties
            return await GetMessageByIdAsync(message.MessageId) 
                ?? throw new InvalidOperationException("Failed to create message");
        }

        public async Task<Message> UpdateMessageAsync(Message message)
        {
            _context.Messages.Update(message);
            await _context.SaveChangesAsync();
            
            // Reload with navigation properties
            return await GetMessageByIdAsync(message.MessageId) 
                ?? throw new InvalidOperationException("Failed to update message");
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Messages
                .Where(m => m.ToUserId == userId && m.MessageStatus == MessageStatus.Unread)
                .CountAsync();
        }
    }
}
