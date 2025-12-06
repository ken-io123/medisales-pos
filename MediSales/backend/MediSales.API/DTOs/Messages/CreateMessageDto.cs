using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Messages
{
    /// <summary>
    /// Request to send a new message.
    /// </summary>
    public class CreateMessageDto
    {
        [Required(ErrorMessage = "Sender user ID is required")]
        public int FromUserId { get; set; }

        [Required(ErrorMessage = "Recipient user ID is required")]
        public int ToUserId { get; set; }

        [Required(ErrorMessage = "Message text is required")]
        [StringLength(1000, MinimumLength = 1, ErrorMessage = "Message must be between 1 and 1000 characters")]
        public string MessageText { get; set; } = string.Empty;
    }
}
