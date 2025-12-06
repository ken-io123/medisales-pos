namespace MediSales.API.Models.DTOs
{
    public class ConversationDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public bool IsOnlineNow { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageTime { get; set; }
        public int UnreadCount { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}
