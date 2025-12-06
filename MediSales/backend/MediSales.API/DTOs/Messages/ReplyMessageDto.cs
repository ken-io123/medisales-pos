using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Messages
{
    /// <summary>
    /// Request to reply to a message.
    /// </summary>
    public class ReplyMessageDto
    {
        [Required(ErrorMessage = "Reply text is required")]
        [StringLength(1000, MinimumLength = 1, ErrorMessage = "Reply must be between 1 and 1000 characters")]
        public string ReplyText { get; set; } = string.Empty;
    }
}
