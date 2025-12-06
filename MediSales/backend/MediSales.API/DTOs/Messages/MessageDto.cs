namespace MediSales.API.DTOs.Messages
{
    /// <summary>
    /// Message data for API responses.
    /// </summary>
    public class MessageDto
    {
        public int MessageId { get; set; }
        public int FromUserId { get; set; }
        public string FromUsername { get; set; } = string.Empty;
        public string FromStaffName { get; set; } = string.Empty;
        public int ToUserId { get; set; }
        public string ToUsername { get; set; } = string.Empty;
        public string ToStaffName { get; set; } = string.Empty;
        public string? SenderProfilePictureUrl { get; set; }
        public string MessageText { get; set; } = string.Empty;
        public string? ReplyText { get; set; }
        public bool IsRead { get; set; }
        public DateTime SentDate { get; set; }
        public DateTime? ReadDate { get; set; }
        public DateTime? ReplyDate { get; set; }
    }
}
