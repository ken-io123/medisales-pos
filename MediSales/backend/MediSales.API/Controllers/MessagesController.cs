using Microsoft.AspNetCore.Mvc;
using MediSales.API.DTOs.Messages;
using MediSales.API.Services.Interfaces;

namespace MediSales.API.Controllers
{
    /// <summary>Messages endpoints.</summary>
    [ApiController]
    [Route("api/messages")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(
            IMessageService messageService,
            ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetMessages([FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                _logger.LogInformation("Fetching messages for user ID: {UserId}", userId);
                var messages = await _messageService.GetMessagesForUserAsync(userId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching messages for user ID: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching messages", error = ex.Message });
            }
        }

        [HttpGet("user/{id}")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetUserMessages(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                _logger.LogInformation("Fetching messages for user ID: {UserId}", id);
                var messages = await _messageService.GetMessagesForUserAsync(id);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching messages for user ID: {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching messages", error = ex.Message });
            }
        }

        [HttpGet("unread-count")]
        [ProducesResponseType(typeof(int), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetUnreadCount([FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                _logger.LogInformation("Fetching unread count for user ID: {UserId}", userId);
                var count = await _messageService.GetUnreadCountAsync(userId);
                return Ok(new { userId, unreadCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching unread count for user ID: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching unread count", error = ex.Message });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(MessageDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> SendMessage([FromBody] CreateMessageDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for message creation");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Sending message from user {FromUserId} to user {ToUserId}", 
                    createDto.FromUserId, createDto.ToUserId);

                var message = await _messageService.SendMessageAsync(
                    createDto.FromUserId, 
                    createDto.ToUserId, 
                    createDto.MessageText);

                return CreatedAtAction(
                    nameof(GetMessages), 
                    new { userId = createDto.ToUserId }, 
                    message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business validation error during message creation");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while sending message");
                return StatusCode(500, new { message = "An error occurred while sending message", error = ex.Message });
            }
        }

        [HttpPut("{id}/reply")]
        [ProducesResponseType(typeof(MessageDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> ReplyToMessage(int id, [FromBody] ReplyMessageDto replyDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for message reply");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Replying to message ID: {MessageId}", id);

                var message = await _messageService.ReplyToMessageAsync(id, replyDto.ReplyText);

                return Ok(message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Message with ID {MessageId} not found", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while replying to message ID: {MessageId}", id);
                return StatusCode(500, new { message = "An error occurred while replying to message", error = ex.Message });
            }
        }

        [HttpPut("{id}/read")]
        [ProducesResponseType(typeof(MessageDto), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                _logger.LogInformation("Marking message ID: {MessageId} as read", id);

                var message = await _messageService.MarkAsReadAsync(id);

                return Ok(message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Message with ID {MessageId} not found", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while marking message ID: {MessageId} as read", id);
                return StatusCode(500, new { message = "An error occurred while marking message as read", error = ex.Message });
            }
        }

        [HttpGet("conversation/{otherUserId}")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetConversation([FromQuery] int? currentUserId, int otherUserId)
        {
            try
            {
                // Try to get current user ID from query, header, or default
                int resolvedCurrentUserId = currentUserId ?? 0;
                
                // If not in query, try to get from request headers
                if (resolvedCurrentUserId <= 0)
                {
                    var userIdHeader = Request.Headers["userId"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(userIdHeader) && int.TryParse(userIdHeader, out int headerUserId))
                    {
                        resolvedCurrentUserId = headerUserId;
                    }
                }

                // Validate we have valid user IDs
                if (resolvedCurrentUserId <= 0)
                {
                    _logger.LogWarning("Missing current user ID in conversation request");
                    return BadRequest(new { message = "Current user ID is required. Provide it as ?currentUserId=X parameter" });
                }

                if (otherUserId <= 0)
                {
                    return BadRequest(new { message = "Invalid other user ID" });
                }

                _logger.LogInformation("Fetching conversation between user {User1} and user {User2}", 
                    resolvedCurrentUserId, otherUserId);

                var messages = await _messageService.GetConversationAsync(resolvedCurrentUserId, otherUserId);

                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching conversation");
                return StatusCode(500, new { message = "An error occurred while fetching conversation", error = ex.Message });
            }
        }

        [HttpPost("send")]
        [ProducesResponseType(typeof(MessageDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> SendChatMessage([FromBody] CreateMessageDto sendDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for message send");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Sending chat message from user {FromUserId} to user {ToUserId}", 
                    sendDto.FromUserId, sendDto.ToUserId);

                var message = await _messageService.SendMessageAsync(
                    sendDto.FromUserId, 
                    sendDto.ToUserId, 
                    sendDto.MessageText);

                // Note: SignalR notification will be handled by the ChatHub
                return CreatedAtAction(
                    nameof(GetConversation), 
                    new { currentUserId = sendDto.FromUserId, otherUserId = sendDto.ToUserId }, 
                    message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business validation error during message send");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while sending chat message");
                return StatusCode(500, new { message = "An error occurred while sending message", error = ex.Message });
            }
        }

        [HttpPut("{id}/mark-read")]
        [ProducesResponseType(typeof(MessageDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> MarkMessageAsRead(int id, [FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                _logger.LogInformation("User {UserId} marking message ID: {MessageId} as read", userId, id);

                var message = await _messageService.MarkMessageAsReadAsync(id, userId);

                return Ok(message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "User {UserId} unauthorized to mark message {MessageId} as read", userId, id);
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Message with ID {MessageId} not found", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while marking message as read");
                return StatusCode(500, new { message = "An error occurred while marking message as read", error = ex.Message });
            }
        }

        [HttpGet("conversations")]
        [ProducesResponseType(typeof(IEnumerable<ConversationDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetConversations([FromQuery] int? userId)
        {
            try
            {
                // Try to get user ID from query or header
                int resolvedUserId = userId ?? 0;
                
                if (resolvedUserId <= 0)
                {
                    var userIdHeader = Request.Headers["userId"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(userIdHeader) && int.TryParse(userIdHeader, out int headerUserId))
                    {
                        resolvedUserId = headerUserId;
                    }
                }

                if (resolvedUserId <= 0)
                {
                    _logger.LogWarning("Missing user ID in conversations request");
                    return BadRequest(new { message = "User ID is required. Provide it as ?userId=X parameter" });
                }

                _logger.LogInformation("Fetching conversations for user ID: {UserId}", resolvedUserId);

                var conversations = await _messageService.GetUserConversationsAsync(resolvedUserId);

                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching conversations");
                return StatusCode(500, new { message = "An error occurred while fetching conversations", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(MessageDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> UpdateMessage(int id, [FromBody] UpdateMessageDto request)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { message = "Invalid message ID" });
                }

                if (string.IsNullOrWhiteSpace(request.MessageText))
                {
                    return BadRequest(new { message = "Message text cannot be empty" });
                }

                _logger.LogInformation("Updating message ID: {MessageId}", id);
                var updatedMessage = await _messageService.UpdateMessageAsync(id, request.MessageText);

                if (updatedMessage == null)
                {
                    return NotFound(new { message = "Message not found" });
                }

                return Ok(updatedMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating message ID: {MessageId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the message", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { message = "Invalid message ID" });
                }

                _logger.LogInformation("Deleting message ID: {MessageId}", id);
                var deleted = await _messageService.DeleteMessageAsync(id);

                if (!deleted)
                {
                    return NotFound(new { message = "Message not found" });
                }

                return Ok(new { message = "Message deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting message ID: {MessageId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the message", error = ex.Message });
            }
        }
    }
}
