using Microsoft.AspNetCore.Mvc;
using MediSales.API.Services;
using MediSales.API.Data;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Controllers
{
    /// <summary>User profile endpoints.</summary>
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly FileUploadService _fileUploadService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(
            FileUploadService fileUploadService,
            ApplicationDbContext context,
            ILogger<ProfileController> logger)
        {
            _fileUploadService = fileUploadService;
            _context = context;
            _logger = logger;
        }

        [HttpPost("upload-picture")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> UploadProfilePicture([FromForm] int userId, [FromForm] IFormFile file)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file was uploaded" });
                }

                _logger.LogInformation($"Uploading profile picture for user ID: {userId}");

                // Find user
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {userId} not found" });
                }

                // Delete old profile picture if exists
                if (!string.IsNullOrEmpty(user.ProfilePictureFileName))
                {
                    await _fileUploadService.DeleteProfilePictureAsync(user.ProfilePictureFileName);
                }

                // Upload new picture
                var (success, fileName, url, error) = await _fileUploadService.UploadProfilePictureAsync(file, userId);

                if (!success)
                {
                    return BadRequest(new { message = error });
                }

                // Update user record
                user.ProfilePictureUrl = url;
                user.ProfilePictureFileName = fileName;
                user.ProfilePictureUploadedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Profile picture uploaded successfully for user {userId}: {fileName}");

                return Ok(new
                {
                    message = "Profile picture uploaded successfully",
                    pictureUrl = url,
                    fileName = fileName,
                    uploadedAt = user.ProfilePictureUploadedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading profile picture for user {userId}");
                return StatusCode(500, new { message = "An error occurred while uploading the profile picture", error = ex.Message });
            }
        }

        [HttpDelete("picture/{userId}")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteProfilePicture(int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                _logger.LogInformation($"Deleting profile picture for user ID: {userId}");

                // Find user
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {userId} not found" });
                }

                // Check if user has a profile picture
                if (string.IsNullOrEmpty(user.ProfilePictureFileName))
                {
                    return BadRequest(new { message = "User does not have a profile picture" });
                }

                // Delete file
                await _fileUploadService.DeleteProfilePictureAsync(user.ProfilePictureFileName);

                // Update user record
                user.ProfilePictureUrl = null;
                user.ProfilePictureFileName = null;
                user.ProfilePictureUploadedAt = null;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Profile picture deleted successfully for user {userId}");

                return Ok(new { message = "Profile picture deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting profile picture for user {userId}");
                return StatusCode(500, new { message = "An error occurred while deleting the profile picture", error = ex.Message });
            }
        }

        [HttpGet("picture/{userId}")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetProfilePicture(int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                // Find user
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {userId} not found" });
                }

                if (string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    return Ok(new
                    {
                        hasPicture = false,
                        pictureUrl = (string?)null,
                        fileName = (string?)null,
                        uploadedAt = (DateTime?)null
                    });
                }

                return Ok(new
                {
                    hasPicture = true,
                    pictureUrl = user.ProfilePictureUrl,
                    fileName = user.ProfilePictureFileName,
                    uploadedAt = user.ProfilePictureUploadedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting profile picture for user {userId}");
                return StatusCode(500, new { message = "An error occurred while retrieving the profile picture", error = ex.Message });
            }
        }
    }
}
