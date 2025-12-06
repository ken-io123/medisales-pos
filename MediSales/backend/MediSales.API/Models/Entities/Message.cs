using MediSales.API.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Represents a chat message between users.
    /// </summary>
    [Index(nameof(CreatedAt))]
    public class Message
    {
        [Key]
        public int MessageId { get; set; }

        [Required(ErrorMessage = "Sender ID is required")]
        [ForeignKey(nameof(FromUser))]
        public int FromUserId { get; set; }

        [Required(ErrorMessage = "Recipient ID is required")]
        [ForeignKey(nameof(ToUser))]
        public int ToUserId { get; set; }

        [Required(ErrorMessage = "Message text is required")]
        [MaxLength(1000, ErrorMessage = "Message text cannot exceed 1000 characters")]
        public string MessageText { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Reply text cannot exceed 1000 characters")]
        public string? ReplyText { get; set; }

        [Required]
        public MessageStatus MessageStatus { get; set; } = MessageStatus.Unread;

        [Required]
        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        [Required]
        public MessageType MessageType { get; set; } = MessageType.Text;

        [MaxLength(500, ErrorMessage = "Attachment URL cannot exceed 500 characters")]
        public string? AttachmentUrl { get; set; }

        public bool IsReplied { get; set; } = false;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? RepliedAt { get; set; }

        [Required]
        public bool IsArchived { get; set; } = false;

        public DateTime? ArchivedAt { get; set; }

        // Navigation properties
        public virtual User FromUser { get; set; } = null!;
        public virtual User ToUser { get; set; } = null!;
    }
}
