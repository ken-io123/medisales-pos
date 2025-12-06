using System.ComponentModel.DataAnnotations;

namespace MediSales.API.DTOs.Messages
{
    /// <summary>
    /// Request to update a message.
    /// </summary>
    public class UpdateMessageDto
    {
        [Required(ErrorMessage = "Message text is required")]
        [StringLength(1000, ErrorMessage = "Message text cannot exceed 1000 characters")]
        public string MessageText { get; set; } = string.Empty;
    }
}
