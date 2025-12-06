namespace MediSales.API.DTOs.Messages
{
    /// <summary>
    /// Conversation summary between two users.
    /// </summary>
    public class ConversationDto
    {
        public int OtherUserId { get; set; }
        public string OtherUsername { get; set; } = string.Empty;
        public string OtherUserFullName { get; set; } = string.Empty;
        public string OtherUserRole { get; set; } = string.Empty;
        public string? OtherUserProfilePictureUrl { get; set; }
        public bool IsOnline { get; set; } = false;
        public DateTime? LastSeenAt { get; set; }
        public string LastMessageText { get; set; } = string.Empty;
        public DateTime LastMessageTime { get; set; }
        public bool IsLastMessageFromMe { get; set; } = false;
        public int UnreadCount { get; set; } = 0;
    }
}
